import { describe, expect, it } from "vitest";
import { buildRecipe } from "./recipes";
import { normalizeEmojiLimit, recipeEmojis } from "./recipe-emojis";

const dish = (ingredients: string) => buildRecipe("meal.cook", ingredients);

describe("ingredient emoji display", () => {
  it("respects the chosen maximum", () => {
    const recipe = dish("@chicken{1} @carrots{2} @tomatoes{3}");
    expect(recipeEmojis(recipe, 1)).toEqual(["🍗"]);
    expect(recipeEmojis(recipe, 3)).toEqual(["🍗", "🥕", "🍅"]);
  });
  it("allows hiding all emojis with zero", () => {
    expect(recipeEmojis(dish("@chicken{1}"), 0)).toEqual([]);
  });
  it("matches French and English ingredients identically", () => {
    expect(recipeEmojis(dish("@bœuf{1} @carottes{2}"))).toEqual(
      recipeEmojis(dish("@beef{1} @carrots{2}")),
    );
    expect(recipeEmojis(dish("@bœuf{1} @carottes{2}"))).toEqual(["🥩", "🥕"]);
  });
  it("uses distinct emojis and specific multiword names", () => {
    expect(recipeEmojis(dish("@sweet potatoes{2} @pommes de terre{3} @potatoes{1}"), 5))
      .toEqual(["🥔", "🍠"]);
  });
  it("does not invent an ingredient for unknown names", () => {
    expect(recipeEmojis(dish("@water{1} @salt{1}"))).toEqual([]);
  });
  it("keeps saved limits within the supported range", () => {
    expect(normalizeEmojiLimit(-1)).toBe(0);
    expect(normalizeEmojiLimit(99)).toBe(10);
    expect(normalizeEmojiLimit(2.9)).toBe(2);
    expect(normalizeEmojiLimit(Number.NaN)).toBe(2);
  });
});