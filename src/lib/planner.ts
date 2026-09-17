import {
  isInSeason,
  outOfSeasonIngredients,
  type Recipe,
  type SeasonOverrides,
} from "./recipes";

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type MealSlot = "lunch" | "dinner";

export interface PlanEntry {
  day: string;
  meal: MealSlot;
  recipeId: string;
}

export interface MealPlan {
  createdAt: string;
  people: number;
  meals: MealSlot[];
  entries: PlanEntry[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Pick recipes for the week, favouring seasonal dishes and protein variety. */
export function generatePlan(
  recipes: Recipe[],
  options: {
    people: number;
    meals: MealSlot[];
    month: number;
    overrides?: SeasonOverrides;
  },
): MealPlan {
  const { people, meals, month, overrides = {} } = options;
  const seasonal = recipes.filter((r) => isInSeason(r, month, overrides));
  const pool = seasonal.length >= 3 ? seasonal : recipes;

  const entries: PlanEntry[] = [];
  let bag = shuffle(pool);
  let lastProtein: string | null = null;
  const used = new Set<string>();

  for (const day of DAYS) {
    for (const meal of meals) {
      if (!pool.length) break;
      if (!bag.length) {
        bag = shuffle(pool);
        used.clear();
      }
      // prefer a recipe with a different protein from the previous meal
      let index = bag.findIndex((r) => r.protein !== lastProtein && !used.has(r.id));
      if (index === -1) index = bag.findIndex((r) => !used.has(r.id));
      if (index === -1) index = 0;
      const chosen = bag.splice(index, 1)[0]!;
      used.add(chosen.id);
      lastProtein = chosen.protein;
      entries.push({ day, meal, recipeId: chosen.id });
    }
  }

  return { createdAt: new Date().toISOString(), people, meals, entries };
}

/** A seasonal replacement for one slot, avoiding dishes already in the plan when possible. */
export function pickReplacement(
  recipes: Recipe[],
  plan: MealPlan,
  month: number,
  currentId: string,
  overrides: SeasonOverrides = {},
): Recipe | null {
  const inPlan = new Set(plan.entries.map((e) => e.recipeId));
  const seasonal = recipes.filter(
    (r) => isInSeason(r, month, overrides) && r.id !== currentId,
  );
  const fresh = seasonal.filter((r) => !inPlan.has(r.id));
  const pool = fresh.length ? fresh : seasonal;
  if (!pool.length) return null;
  return shuffle(pool)[0]!;
}

export interface SlotStatus {
  entry: PlanEntry;
  recipe: Recipe | undefined;
  outOfSeason: string[];
}

export function planStatus(
  plan: MealPlan,
  recipes: Recipe[],
  month: number,
  overrides: SeasonOverrides = {},
): SlotStatus[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  return plan.entries.map((entry) => {
    const recipe = byId.get(entry.recipeId);
    return {
      entry,
      recipe,
      outOfSeason: recipe ? outOfSeasonIngredients(recipe, month, overrides) : [],
    };
  });
}
