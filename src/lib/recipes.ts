import { parseCooklang, type ParsedRecipe } from "./cooklang";
import { matchSeason } from "@/data/seasonality";

export type ProteinTag =
  | "chicken"
  | "beef"
  | "pork"
  | "lamb"
  | "fish"
  | "seafood"
  | "egg"
  | "legume"
  | "cheese"
  | "vegetable";

export interface Recipe {
  id: string;
  fileName: string;
  title: string;
  servings: number;
  source: string;
  parsed: ParsedRecipe;
  tags: string[];
  protein: ProteinTag;
  /** months (1-12) in which every seasonal ingredient of this recipe is available */
  seasonalIngredients: { name: string; months: number[] }[];
  origin: "folder" | "added";
}

const PROTEIN_KEYWORDS: [ProteinTag, string[]][] = [
  ["chicken", ["chicken", "poulet", "turkey", "duck"]],
  ["beef", ["beef", "steak", "mince", "ground beef", "veal"]],
  ["pork", ["pork", "bacon", "sausage", "chorizo", "ham", "pancetta", "lardon"]],
  ["lamb", ["lamb", "mutton"]],
  ["fish", ["salmon", "cod", "tuna", "haddock", "mackerel", "trout", "sardine", "anchov", "fish"]],
  ["seafood", ["prawn", "shrimp", "mussel", "squid", "scallop", "crab", "clam"]],
  ["legume", ["lentil", "chickpea", "bean", "tofu", "tempeh", "pea protein"]],
  ["egg", ["egg"]],
  ["cheese", ["cheese", "halloumi", "feta", "mozzarella", "ricotta", "paneer"]],
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.cook$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function detectProtein(ingredientNames: string[]): ProteinTag {
  const haystack = ingredientNames.join(" ").toLowerCase();
  for (const [tag, keywords] of PROTEIN_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return tag;
  }
  return "vegetable";
}

export function buildRecipe(
  fileName: string,
  source: string,
  origin: Recipe["origin"] = "folder",
): Recipe {
  const parsed = parseCooklang(source);
  const bareName = fileName.replace(/\.cook$/i, "").replace(/[-_]+/g, " ");
  const title = parsed.metadata["title"] ?? bareName.replace(/\b\w/g, (c) => c.toUpperCase());
  const servingsRaw = parsed.metadata["servings"] ?? parsed.metadata["serves"] ?? "";
  const servings = Number.parseInt(servingsRaw, 10);
  const names = parsed.ingredients.map((i) => i.name);

  const seasonalIngredients: Recipe["seasonalIngredients"] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const entry = matchSeason(name);
    if (!entry || entry.months.length === 12) continue;
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);
    seasonalIngredients.push({ name, months: entry.months });
  }

  const tags = (parsed.metadata["tags"] ?? parsed.metadata["category"] ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return {
    id: slugify(fileName) || slugify(title),
    fileName,
    title,
    servings: Number.isFinite(servings) && servings > 0 ? servings : 4,
    source,
    parsed,
    tags,
    protein: detectProtein(names),
    seasonalIngredients,
    origin,
  };
}

/** Ingredients in this recipe that are out of season for the given month (1-12). */
export function outOfSeasonIngredients(recipe: Recipe, month: number): string[] {
  return recipe.seasonalIngredients
    .filter((item) => !item.months.includes(month))
    .map((item) => item.name);
}

export function isInSeason(recipe: Recipe, month: number): boolean {
  return outOfSeasonIngredients(recipe, month).length === 0;
}

/** Recipes shipped in the project's /recipes folder (bundled at build time). */
export function loadBundledRecipes(): Recipe[] {
  const modules = import.meta.glob("/recipes/*.cook", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  return Object.entries(modules)
    .map(([path, source]) => buildRecipe(path.split("/").pop() ?? path, source))
    .sort((a, b) => a.title.localeCompare(b.title));
}
