import { formatQuantity, type Quantity } from "./cooklang";
import type { MealPlan } from "./planner";
import type { Recipe } from "./recipes";

export type Aisle =
  | "Fruit & vegetables"
  | "Meat & fish"
  | "Dairy & eggs"
  | "Bakery"
  | "Store cupboard"
  | "Frozen"
  | "Other";

const AISLE_KEYWORDS: [Aisle, string[]][] = [
  ["Meat & fish", ["chicken", "beef", "pork", "lamb", "bacon", "sausage", "mince", "salmon", "cod", "tuna", "prawn", "fish", "ham", "chorizo", "pancetta", "duck", "turkey", "mussel", "squid"]],
  ["Dairy & eggs", ["milk", "butter", "cream", "yoghurt", "yogurt", "cheese", "egg", "mozzarella", "parmesan", "feta", "ricotta", "creme fraiche", "mascarpone"]],
  ["Bakery", ["bread", "baguette", "bun", "tortilla", "pitta", "brioche", "sourdough"]],
  ["Frozen", ["frozen", "ice"]],
  ["Store cupboard", ["flour", "sugar", "salt", "pepper", "oil", "vinegar", "rice", "pasta", "noodle", "lentil", "chickpea", "bean", "stock", "tinned", "canned", "tomato paste", "soy sauce", "honey", "mustard", "spice", "cumin", "paprika", "cinnamon", "curry", "yeast", "couscous", "polenta", "oats", "nut", "seed", "wine", "coconut milk"]],
];

import { matchSeason } from "@/data/seasonality";

export function aisleFor(name: string): Aisle {
  const lower = name.toLowerCase();
  for (const [aisle, keywords] of AISLE_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) return aisle;
  }
  const season = matchSeason(name);
  if (season && (season.category === "fruit" || season.category === "vegetable" || season.category === "herb" || season.category === "mushroom")) {
    return "Fruit & vegetables";
  }
  return "Other";
}

export const AISLE_ORDER: Aisle[] = [
  "Fruit & vegetables",
  "Meat & fish",
  "Dairy & eggs",
  "Bakery",
  "Store cupboard",
  "Frozen",
  "Other",
];

export interface ShoppingItem {
  key: string;
  name: string;
  aisle: Aisle;
  amounts: string[];
  usedIn: string[];
}

function scale(quantity: Quantity, factor: number): Quantity {
  if (typeof quantity === "number") return Math.round(quantity * factor * 100) / 100;
  return quantity;
}

export function buildShoppingList(
  plan: MealPlan,
  recipes: Recipe[],
): { aisle: Aisle; items: ShoppingItem[] }[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const map = new Map<string, ShoppingItem & { numeric: Map<string, number> }>();

  for (const entry of plan.entries) {
    const recipe = byId.get(entry.recipeId);
    if (!recipe) continue;
    const factor = plan.people / (recipe.servings || 4);

    for (const ingredient of recipe.parsed.ingredients) {
      const name = ingredient.name.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      let item = map.get(key);
      if (!item) {
        item = {
          key,
          name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
          aisle: aisleFor(name),
          amounts: [],
          usedIn: [],
          numeric: new Map(),
        };
        map.set(key, item);
      }
      if (!item.usedIn.includes(recipe.title)) item.usedIn.push(recipe.title);

      const scaled = scale(ingredient.quantity, factor);
      if (typeof scaled === "number") {
        const unit = ingredient.unit ?? "";
        item.numeric.set(unit, (item.numeric.get(unit) ?? 0) + scaled);
      } else if (typeof scaled === "string" && scaled) {
        const label = formatQuantity(scaled, ingredient.unit);
        if (label && !item.amounts.includes(label)) item.amounts.push(label);
      }
    }
  }

  const grouped = new Map<Aisle, ShoppingItem[]>();
  for (const item of map.values()) {
    const amounts = [
      ...[...item.numeric.entries()].map(([unit, total]) =>
        formatQuantity(Math.round(total * 100) / 100, unit || null),
      ),
      ...item.amounts,
    ].filter(Boolean);

    const finalItem: ShoppingItem = {
      key: item.key,
      name: item.name,
      aisle: item.aisle,
      amounts,
      usedIn: item.usedIn,
    };
    const bucket = grouped.get(item.aisle) ?? [];
    bucket.push(finalItem);
    grouped.set(item.aisle, bucket);
  }

  return AISLE_ORDER.filter((aisle) => grouped.has(aisle)).map((aisle) => ({
    aisle,
    items: (grouped.get(aisle) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
