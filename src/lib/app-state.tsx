import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getDesktopBridge } from "./desktop";
import { setCustomSeasons, type SeasonEntry } from "@/data/seasonality";
import {
  buildRecipe,
  loadBundledRecipes,
  type Recipe,
  type SeasonOverrides,
} from "./recipes";
import {
  generatePlan,
  pickReplacement,
  planStatus,
  type MealPlan,
  type MealSlot,
  type SlotStatus,
} from "./planner";

const STORAGE_KEY = "mealflow.state.v1";

interface PersistedState {
  people: number;
  meals: MealSlot[];
  plan: MealPlan | null;
  checked: string[];
  overrides: SeasonOverrides;
  addedRecipes: { fileName: string; source: string }[];
  advanced: boolean;
  savedMenus: SavedMenu[];
  customSeasons: SeasonEntry[];
}

export interface SavedMenu {
  id: string;
  name: string;
  savedAt: string;
  plan: MealPlan;
}

const DEFAULT_STATE: PersistedState = {
  people: 2,
  meals: ["dinner"],
  plan: null,
  checked: [],
  overrides: {},
  addedRecipes: [],
  advanced: false,
  savedMenus: [],
  customSeasons: [],
};

function readStorage(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PersistedState>) };
  } catch {
    return DEFAULT_STATE;
  }
}

interface AppState {
  ready: boolean;
  recipes: Recipe[];
  month: number;
  people: number;
  meals: MealSlot[];
  plan: MealPlan | null;
  status: SlotStatus[];
  checked: Set<string>;
  overrides: SeasonOverrides;
  recipesPath: string | null;
  setPeople: (people: number) => void;
  setMeals: (meals: MealSlot[]) => void;
  regenerate: () => void;
  clearPlan: () => void;
  swapSlot: (index: number, recipeId: string) => void;
  rerollSlot: (index: number) => void;
  toggleChecked: (key: string) => void;
  clearChecked: () => void;
  setOverride: (key: string, months: number[] | null) => void;
  addRecipe: (fileName: string, source: string) => void;
  removeAddedRecipe: (id: string) => void;
  rescan: () => Promise<void>;
  canChooseFolder: boolean;
  chooseRecipesFolder: () => Promise<void>;
  advanced: boolean;
  setAdvanced: (on: boolean) => void;
  setSlotPeople: (index: number, people: number) => void;
  savedMenus: SavedMenu[];
  saveMenu: (name: string) => void;
  loadMenu: (id: string) => void;
  deleteMenu: (id: string) => void;
  customSeasons: SeasonEntry[];
  addCustomSeason: (entry: SeasonEntry) => void;
  removeCustomSeason: (name: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [folderRecipes, setFolderRecipes] = useState<Recipe[]>([]);
  const [recipesPath, setRecipesPath] = useState<string | null>(null);
  const month = new Date().getMonth() + 1;

  const bundled = useMemo(() => {
    setCustomSeasons(state.customSeasons);
    return loadBundledRecipes();
  }, [state.customSeasons]);

  const loadFolder = useCallback(async () => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    try {
      const [files, path] = await Promise.all([bridge.readRecipes(), bridge.recipesPath()]);
      setFolderRecipes(files.map((file) => buildRecipe(file.name, file.content)));
      setRecipesPath(path);
    } catch (error) {
      console.error("Could not read the recipes folder", error);
    }
  }, []);

  useEffect(() => {
    setState(readStorage());
    setReady(true);
    void loadFolder();
  }, [loadFolder]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const recipes = useMemo(() => {
    setCustomSeasons(state.customSeasons);
    const map = new Map<string, Recipe>();
    for (const recipe of bundled) map.set(recipe.id, recipe);
    for (const recipe of folderRecipes) map.set(recipe.id, recipe);
    for (const added of state.addedRecipes) {
      const recipe = buildRecipe(added.fileName, added.source, "added");
      map.set(recipe.id, recipe);
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [bundled, folderRecipes, state.addedRecipes, state.customSeasons]);

  const status = useMemo(
    () => (state.plan ? planStatus(state.plan, recipes, month, state.overrides) : []),
    [state.plan, recipes, month, state.overrides],
  );

  const update = useCallback((patch: Partial<PersistedState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value: AppState = {
    ready,
    recipes,
    month,
    people: state.people,
    meals: state.meals,
    plan: state.plan,
    status,
    checked: new Set(state.checked),
    overrides: state.overrides,
    recipesPath,
    setPeople: (people) =>
      setState((prev) => ({
        ...prev,
        people,
        plan: prev.plan
          ? {
              ...prev.plan,
              people,
              entries: prev.advanced
                ? prev.plan.entries
                : prev.plan.entries.map(({ people: _p, ...entry }) => entry),
            }
          : prev.plan,
      })),
    setMeals: (meals) => update({ meals }),
    regenerate: () =>
      setState((prev) => ({
        ...prev,
        checked: [],
        plan: generatePlan(recipes, {
          people: prev.people,
          meals: prev.meals.length ? prev.meals : ["dinner"],
          month,
          overrides: prev.overrides,
        }),
      })),
    clearPlan: () => update({ plan: null, checked: [] }),
    swapSlot: (index, recipeId) =>
      setState((prev) => {
        if (!prev.plan) return prev;
        const entries = prev.plan.entries.map((entry, i) =>
          i === index ? { ...entry, recipeId } : entry,
        );
        return { ...prev, plan: { ...prev.plan, entries } };
      }),
    rerollSlot: (index) =>
      setState((prev) => {
        if (!prev.plan) return prev;
        const current = prev.plan.entries[index];
        if (!current) return prev;
        const replacement = pickReplacement(
          recipes,
          prev.plan,
          month,
          current.recipeId,
          prev.overrides,
        );
        if (!replacement) return prev;
        const entries = prev.plan.entries.map((entry, i) =>
          i === index ? { ...entry, recipeId: replacement.id } : entry,
        );
        return { ...prev, plan: { ...prev.plan, entries } };
      }),
    toggleChecked: (key) =>
      setState((prev) => ({
        ...prev,
        checked: prev.checked.includes(key)
          ? prev.checked.filter((k) => k !== key)
          : [...prev.checked, key],
      })),
    clearChecked: () => update({ checked: [] }),
    setOverride: (key, months) =>
      setState((prev) => {
        const overrides = { ...prev.overrides };
        if (months === null) delete overrides[key];
        else overrides[key] = months;
        return { ...prev, overrides };
      }),
    addRecipe: (fileName, source) =>
      setState((prev) => ({
        ...prev,
        addedRecipes: [
          ...prev.addedRecipes.filter((r) => r.fileName !== fileName),
          { fileName, source },
        ],
      })),
    removeAddedRecipe: (id) =>
      setState((prev) => ({
        ...prev,
        addedRecipes: prev.addedRecipes.filter(
          (r) => buildRecipe(r.fileName, r.source).id !== id,
        ),
      })),
    rescan: loadFolder,
    canChooseFolder: Boolean(getDesktopBridge()?.chooseRecipesFolder),
    chooseRecipesFolder: async () => {
      const picked = await getDesktopBridge()?.chooseRecipesFolder?.();
      if (picked) await loadFolder();
    },
    advanced: state.advanced,
    setAdvanced: (on) =>
      setState((prev) => ({
        ...prev,
        advanced: on,
        plan:
          prev.plan && !on
            ? { ...prev.plan, entries: prev.plan.entries.map(({ people: _p, ...e }) => e) }
            : prev.plan,
      })),
    setSlotPeople: (index, people) =>
      setState((prev) => {
        if (!prev.plan) return prev;
        const entries = prev.plan.entries.map((entry, i) =>
          i === index ? { ...entry, people: Math.max(0, Math.min(20, people)) } : entry,
        );
        return { ...prev, plan: { ...prev.plan, entries } };
      }),
    savedMenus: state.savedMenus,
    saveMenu: (name) =>
      setState((prev) => {
        if (!prev.plan) return prev;
        const trimmed = name.trim() || "Untitled menu";
        const others = prev.savedMenus.filter(
          (m) => m.name.toLowerCase() !== trimmed.toLowerCase(),
        );
        return {
          ...prev,
          savedMenus: [
            ...others,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: trimmed,
              savedAt: new Date().toISOString(),
              plan: prev.plan,
            },
          ],
        };
      }),
    loadMenu: (id) =>
      setState((prev) => {
        const menu = prev.savedMenus.find((m) => m.id === id);
        if (!menu) return prev;
        const advanced = menu.plan.entries.some((e) => e.people !== undefined);
        return {
          ...prev,
          plan: menu.plan,
          people: menu.plan.people,
          meals: menu.plan.meals,
          checked: [],
          advanced: prev.advanced || advanced,
        };
      }),
    deleteMenu: (id) =>
      setState((prev) => ({ ...prev, savedMenus: prev.savedMenus.filter((m) => m.id !== id) })),
    customSeasons: state.customSeasons,
    addCustomSeason: (entry) =>
      setState((prev) => ({
        ...prev,
        customSeasons: [
          ...prev.customSeasons.filter((e) => e.name !== entry.name),
          entry,
        ],
      })),
    removeCustomSeason: (name) =>
      setState((prev) => {
        const overrides = { ...prev.overrides };
        delete overrides[name];
        return {
          ...prev,
          overrides,
          customSeasons: prev.customSeasons.filter((e) => e.name !== name),
        };
      }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}
