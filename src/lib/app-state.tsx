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
}

const DEFAULT_STATE: PersistedState = {
  people: 2,
  meals: ["dinner"],
  plan: null,
  checked: [],
  overrides: {},
  addedRecipes: [],
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
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [folderRecipes, setFolderRecipes] = useState<Recipe[]>([]);
  const [recipesPath, setRecipesPath] = useState<string | null>(null);
  const month = new Date().getMonth() + 1;

  const bundled = useMemo(() => loadBundledRecipes(), []);

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
    const map = new Map<string, Recipe>();
    for (const recipe of bundled) map.set(recipe.id, recipe);
    for (const recipe of folderRecipes) map.set(recipe.id, recipe);
    for (const added of state.addedRecipes) {
      const recipe = buildRecipe(added.fileName, added.source, "added");
      map.set(recipe.id, recipe);
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [bundled, folderRecipes, state.addedRecipes]);

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
        plan: prev.plan ? { ...prev.plan, people } : prev.plan,
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
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}
