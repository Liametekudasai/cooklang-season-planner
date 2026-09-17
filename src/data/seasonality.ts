// European seasonality: which months (1-12) each produce item is typically in season.
// Anything not listed here is treated as year-round (pantry staples, meat, dairy, spices).

export interface SeasonEntry {
  /** canonical lowercase name */
  name: string;
  /** alternative spellings / plurals that should match */
  aliases?: string[];
  months: number[];
  category: "vegetable" | "fruit" | "herb" | "mushroom" | "nut";
}

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const range = (from: number, to: number): number[] =>
  from <= to
    ? ALL.slice(from - 1, to)
    : [...ALL.slice(from - 1), ...ALL.slice(0, to)];

export const SEASONALITY: SeasonEntry[] = [
  // --- Vegetables ---
  { name: "asparagus", months: range(4, 6), category: "vegetable" },
  { name: "artichoke", aliases: ["artichokes"], months: range(3, 6), category: "vegetable" },
  { name: "aubergine", aliases: ["eggplant"], months: range(7, 10), category: "vegetable" },
  { name: "beetroot", aliases: ["beet", "beets"], months: range(6, 3), category: "vegetable" },
  { name: "broad beans", aliases: ["fava beans"], months: range(5, 7), category: "vegetable" },
  { name: "broccoli", months: range(6, 11), category: "vegetable" },
  { name: "brussels sprouts", months: range(10, 2), category: "vegetable" },
  { name: "cabbage", aliases: ["white cabbage", "red cabbage"], months: range(9, 4), category: "vegetable" },
  { name: "carrot", aliases: ["carrots"], months: ALL, category: "vegetable" },
  { name: "cauliflower", months: range(9, 4), category: "vegetable" },
  { name: "celeriac", months: range(9, 3), category: "vegetable" },
  { name: "celery", months: range(6, 12), category: "vegetable" },
  { name: "chard", aliases: ["swiss chard"], months: range(5, 11), category: "vegetable" },
  { name: "chicory", aliases: ["endive", "radicchio"], months: range(10, 3), category: "vegetable" },
  { name: "courgette", aliases: ["zucchini", "courgettes"], months: range(6, 9), category: "vegetable" },
  { name: "cucumber", aliases: ["cucumbers"], months: range(5, 9), category: "vegetable" },
  { name: "fennel", months: range(9, 3), category: "vegetable" },
  { name: "garlic", months: ALL, category: "vegetable" },
  { name: "green beans", aliases: ["french beans", "runner beans"], months: range(6, 9), category: "vegetable" },
  { name: "kale", aliases: ["cavolo nero"], months: range(10, 3), category: "vegetable" },
  { name: "kohlrabi", months: range(5, 10), category: "vegetable" },
  { name: "leek", aliases: ["leeks"], months: range(9, 4), category: "vegetable" },
  { name: "lettuce", aliases: ["little gem", "romaine"], months: range(4, 10), category: "vegetable" },
  { name: "onion", aliases: ["onions", "red onion", "yellow onion"], months: ALL, category: "vegetable" },
  { name: "spring onion", aliases: ["scallion", "scallions"], months: range(3, 9), category: "vegetable" },
  { name: "parsnip", aliases: ["parsnips"], months: range(9, 2), category: "vegetable" },
  { name: "peas", aliases: ["garden peas", "sugar snap peas"], months: range(5, 8), category: "vegetable" },
  { name: "pepper", aliases: ["bell pepper", "peppers", "red pepper"], months: range(7, 10), category: "vegetable" },
  { name: "potato", aliases: ["potatoes", "new potatoes"], months: ALL, category: "vegetable" },
  { name: "pumpkin", months: range(9, 12), category: "vegetable" },
  { name: "radish", aliases: ["radishes"], months: range(4, 9), category: "vegetable" },
  { name: "rocket", aliases: ["arugula"], months: range(4, 10), category: "vegetable" },
  { name: "shallot", aliases: ["shallots"], months: ALL, category: "vegetable" },
  { name: "spinach", months: range(3, 11), category: "vegetable" },
  { name: "squash", aliases: ["butternut squash"], months: range(9, 1), category: "vegetable" },
  { name: "sweetcorn", aliases: ["corn"], months: range(7, 10), category: "vegetable" },
  { name: "swede", aliases: ["rutabaga"], months: range(9, 3), category: "vegetable" },
  { name: "sweet potato", aliases: ["sweet potatoes"], months: range(9, 2), category: "vegetable" },
  { name: "tomato", aliases: ["tomatoes", "cherry tomatoes", "plum tomatoes"], months: range(6, 10), category: "vegetable" },
  { name: "turnip", aliases: ["turnips"], months: range(9, 3), category: "vegetable" },
  { name: "watercress", months: range(4, 10), category: "vegetable" },
  { name: "jerusalem artichoke", months: range(10, 2), category: "vegetable" },
  { name: "samphire", months: range(6, 8), category: "vegetable" },
  { name: "wild garlic", months: range(3, 5), category: "herb" },

  // --- Fruit ---
  { name: "apple", aliases: ["apples"], months: range(8, 3), category: "fruit" },
  { name: "apricot", aliases: ["apricots"], months: range(6, 8), category: "fruit" },
  { name: "blackberry", aliases: ["blackberries"], months: range(7, 10), category: "fruit" },
  { name: "blackcurrant", aliases: ["blackcurrants"], months: range(6, 8), category: "fruit" },
  { name: "blueberry", aliases: ["blueberries"], months: range(6, 9), category: "fruit" },
  { name: "cherry", aliases: ["cherries"], months: range(5, 8), category: "fruit" },
  { name: "clementine", aliases: ["clementines", "mandarin", "mandarins"], months: range(11, 2), category: "fruit" },
  { name: "cranberry", aliases: ["cranberries"], months: range(10, 12), category: "fruit" },
  { name: "damson", aliases: ["damsons"], months: range(8, 10), category: "fruit" },
  { name: "elderflower", months: range(5, 6), category: "fruit" },
  { name: "fig", aliases: ["figs"], months: range(8, 10), category: "fruit" },
  { name: "gooseberry", aliases: ["gooseberries"], months: range(5, 8), category: "fruit" },
  { name: "grape", aliases: ["grapes"], months: range(8, 10), category: "fruit" },
  { name: "lemon", aliases: ["lemons"], months: range(11, 5), category: "fruit" },
  { name: "melon", months: range(6, 9), category: "fruit" },
  { name: "nectarine", aliases: ["nectarines"], months: range(6, 9), category: "fruit" },
  { name: "orange", aliases: ["oranges", "blood orange"], months: range(12, 4), category: "fruit" },
  { name: "peach", aliases: ["peaches"], months: range(6, 9), category: "fruit" },
  { name: "pear", aliases: ["pears"], months: range(8, 2), category: "fruit" },
  { name: "plum", aliases: ["plums"], months: range(7, 10), category: "fruit" },
  { name: "quince", months: range(10, 12), category: "fruit" },
  { name: "raspberry", aliases: ["raspberries"], months: range(6, 10), category: "fruit" },
  { name: "redcurrant", aliases: ["redcurrants"], months: range(6, 8), category: "fruit" },
  { name: "rhubarb", months: range(1, 6), category: "fruit" },
  { name: "strawberry", aliases: ["strawberries"], months: range(5, 9), category: "fruit" },
  { name: "watermelon", months: range(6, 9), category: "fruit" },

  // --- Herbs ---
  { name: "basil", months: range(5, 9), category: "herb" },
  { name: "chives", months: range(3, 10), category: "herb" },
  { name: "coriander", aliases: ["cilantro"], months: range(4, 10), category: "herb" },
  { name: "dill", months: range(4, 9), category: "herb" },
  { name: "mint", months: range(4, 10), category: "herb" },
  { name: "parsley", aliases: ["flat-leaf parsley"], months: range(3, 11), category: "herb" },
  { name: "rosemary", months: ALL, category: "herb" },
  { name: "sage", months: range(3, 11), category: "herb" },
  { name: "tarragon", months: range(5, 9), category: "herb" },
  { name: "thyme", months: ALL, category: "herb" },

  // --- Mushrooms & nuts ---
  { name: "chanterelle", aliases: ["chanterelles", "girolles"], months: range(7, 11), category: "mushroom" },
  { name: "ceps", aliases: ["porcini", "cep"], months: range(8, 11), category: "mushroom" },
  { name: "mushroom", aliases: ["mushrooms", "chestnut mushrooms", "button mushrooms"], months: ALL, category: "mushroom" },
  { name: "chestnut", aliases: ["chestnuts"], months: range(10, 12), category: "nut" },
  { name: "hazelnut", aliases: ["hazelnuts"], months: range(9, 11), category: "nut" },
  { name: "walnut", aliases: ["walnuts"], months: range(9, 12), category: "nut" },
];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function normalise(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s-]/g, "")
    .replace(/\s+/g, " ");
}

const LOOKUP = new Map<string, SeasonEntry>();
for (const entry of SEASONALITY) {
  LOOKUP.set(entry.name, entry);
  for (const alias of entry.aliases ?? []) LOOKUP.set(normalise(alias), entry);
}

/** Find the seasonality entry for a free-text ingredient name, or null if year-round. */
export function matchSeason(ingredientName: string): SeasonEntry | null {
  const name = normalise(ingredientName);
  if (!name) return null;
  const direct = LOOKUP.get(name);
  if (direct) return direct;

  // try trailing words: "ripe cherry tomatoes" -> "cherry tomatoes" -> "tomatoes"
  const words = name.split(" ");
  for (let start = 0; start < words.length; start++) {
    const candidate = words.slice(start).join(" ");
    const hit = LOOKUP.get(candidate);
    if (hit) return hit;
  }
  // singularise a trailing plural
  const singular = name.endsWith("es")
    ? name.slice(0, -2)
    : name.endsWith("s")
      ? name.slice(0, -1)
      : null;
  if (singular) {
    const hit = LOOKUP.get(singular);
    if (hit) return hit;
  }
  return null;
}
