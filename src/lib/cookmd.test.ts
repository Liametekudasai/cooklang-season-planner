import { describe, expect, it } from "vitest";

import { extractCookSource, toMealFlowRecipe } from "./cookmd";

const SAMPLE = `---
title: Easy pancakes
servings: 12
nutrition:
  calories: 61
course: Breakfast, Brunch
diet: Vegetarian
time required: 30 minutes
source: https://example.com/pancakes
---

Put @flour{100%g} and @?caster sugar{} in a bowl.`;

describe("cook.md import", () => {
  it("replaces front matter with MealFlow properties", () => {
    const r = toMealFlowRecipe(SAMPLE, "https://x.test");
    expect(r.fileName).toBe("easy-pancakes.cook");
    expect(r.content.startsWith(">> title: Easy pancakes\n>> servings: 12\n")).toBe(true);
    expect(r.content).toContain(">> tags: breakfast, brunch, vegetarian");
    expect(r.content).toContain(">> time: 30 minutes");
    expect(r.content).toContain(">> source: https://example.com/pancakes");
    expect(r.content).not.toContain("---");
    expect(r.content).toContain("@caster sugar{}");
  });

  it("defaults servings to 4 when missing", () => {
    expect(toMealFlowRecipe("@egg{2}", "https://x.test").content).toContain(">> servings: 4");
  });

  it("extracts the recipe text from the cook.md page", () => {
    expect(extractCookSource('<pre><code id="cook-code" class="x">a &amp; @b{}</code></pre>')).toBe("a & @b{}");
  });
});
