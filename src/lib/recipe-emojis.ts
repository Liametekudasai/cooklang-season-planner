import type { Recipe } from "./recipes";

export const DEFAULT_EMOJI_LIMIT = 2;
export const MAX_EMOJI_LIMIT = 10;

export function normalizeEmojiLimit(value: number): number {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(MAX_EMOJI_LIMIT, Math.floor(value)))
    : DEFAULT_EMOJI_LIMIT;
}

const normalize = (name: string) => name.toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/œ/g, "oe").replace(/[^a-z]+/g, " ").trim();

// Specific food names precede broad categories; aliases describe ingredients, not UI labels.
const FOODS: [string, string][] = [
  ["🍗", "chicken|poulet|turkey|dinde|duck|canard"],
  ["🥩", "beef|boeuf|steak|veal|veau|lamb|agneau|mutton"],
  ["🥓", "bacon|lardon|lardons|pancetta"],
  ["🥓", "pork|porc|ham|jambon|sausage|saucisse|chorizo"],
  ["🐟", "fish|poisson|salmon|saumon|cod|cabillaud|tuna|thon|trout|truite|sardine|sardines|haddock|mackerel|maquereau|anchovy|anchovies|anchois"],
  ["🦐", "prawn|prawns|shrimp|shrimps|crevette|crevettes"],
  ["🦀", "crab|crabe"], ["🦑", "squid|calamar|calamars"],
  ["🦪", "mussel|mussels|moule|moules|clam|clams|oyster|oysters|huitre|huitres|scallop|scallops"],
  ["🍝", "pasta|pates|spaghetti|pappardelle|penne|tagliatelle|macaroni|fusilli|lasagne|lasagna"],
  ["🍚", "rice|riz|arborio"], ["🍞", "bread|pain|baguette"],
  ["🥚", "egg|eggs|oeuf|oeufs"],
  ["🧀", "cheese|fromage|halloumi|feta|mozzarella|ricotta|paneer|parmesan|cheddar|gruyere"],
  ["🫘", "lentil|lentils|lentille|lentilles|chickpea|chickpeas|pois chiche|pois chiches|bean|beans|haricot|haricots|tofu|tempeh"],
  ["🥕", "carrot|carrots|carotte|carottes"],
  ["🍅", "tomato|tomatoes|tomate|tomates"],
  ["🥦", "broccoli|brocoli|brocolis"],
  ["🍆", "aubergine|aubergines|eggplant"],
  ["🥒", "cucumber|cucumbers|concombre|concombres|courgette|courgettes|zucchini"],
  ["🥔", "potato|potatoes|pomme de terre|pommes de terre"],
  ["🍠", "sweet potato|sweet potatoes|patate douce|patates douces"],
  ["🎃", "pumpkin|squash|butternut|potiron|potimarron|citrouille|courge|courges"],
  ["🍄", "mushroom|mushrooms|champignon|champignons|porcini|ceps|chanterelle|chanterelles|girolle|girolles"],
  ["🌽", "corn|sweetcorn|mais"], ["🫑", "pepper|peppers|poivron|poivrons"],
  ["🥬", "spinach|epinard|epinards|kale|cabbage|chou|choux|lettuce|salade|laitue|chard|blette|blettes|leek|leeks|poireau|poireaux|asparagus|asperge|asperges|greens"],
  ["🫛", "pea|peas|petit pois|petits pois"],
  ["🧅", "onion|onions|oignon|oignons|shallot|shallots|echalote|echalotes"],
  ["🧄", "garlic|ail"],
  ["🍎", "apple|apples|pomme|pommes"], ["🍐", "pear|pears|poire|poires"],
  ["🍋", "lemon|lemons|citron|citrons"], ["🍊", "orange|oranges|clementine|mandarin"],
  ["🍓", "strawberry|strawberries|fraise|fraises"],
  ["🍑", "peach|peaches|peche|peches|apricot|apricots|abricot|abricots"],
  ["🍒", "cherry|cherries|cerise|cerises"], ["🍇", "grape|grapes|raisin|raisins"],
  ["🫐", "blueberry|blueberries|myrtille|myrtilles"],
  ["🍉", "watermelon|pasteque"], ["🍌", "banana|bananas|banane|bananes"],
  ["🥑", "avocado|avocados|avocat|avocats"],
  ["🌿", "basil|basilic|mint|menthe|parsley|persil|coriander|coriandre|cilantro|thyme|thym|rosemary|romarin|dill|aneth|chives|ciboulette"],
];

const MATCHERS = FOODS.map(([emoji, aliases]) => ({
  emoji, pattern: new RegExp(`(?:^| )(?:${aliases})(?: |$)`),
}));

export function recipeEmojis(recipe: Pick<Recipe, "parsed">, limit = DEFAULT_EMOJI_LIMIT): string[] {
  const maximum = normalizeEmojiLimit(limit);
  if (maximum === 0) return [];
  const names = recipe.parsed.ingredients.map(({ name }) => normalize(name));
  const found = new Set<string>();
  for (const { emoji, pattern } of MATCHERS) {
    // Each ingredient contributes its most specific match only.
    if (names.some((name) => MATCHERS.find((item) => item.pattern.test(name))?.emoji === emoji && pattern.test(name))) {
      found.add(emoji);
      if (found.size === maximum) break;
    }
  }
  return [...found];
}