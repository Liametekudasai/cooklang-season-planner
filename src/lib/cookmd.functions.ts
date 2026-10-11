import { createServerFn } from "@tanstack/react-start";

import { extractCookSource, toMealFlowRecipe, type ConvertedRecipe } from "./cookmd";

type Result = ({ ok: true } & ConvertedRecipe) | { ok: false; error: string };

export const importFromCookMd = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    const url = new URL(String(input.url).trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid link");
    return { url: url.toString() };
  })
  .handler(async ({ data }): Promise<Result> => {
    try {
      let target = `https://cook.md/${data.url}`;
      for (let attempt = 0; attempt < 6; attempt++) {
        const res = await fetch(target, { redirect: "follow", headers: { Accept: "text/html" } });
        if (!res.ok) return { ok: false, error: `cook.md answered ${res.status}` };
        target = res.url || target;
        const source = extractCookSource(await res.text());
        if (source) return { ok: true, ...toMealFlowRecipe(source, data.url) };
        await new Promise((r) => setTimeout(r, 2500)); // still converting
      }
      return { ok: false, error: "timeout" };
    } catch (error) {
      console.error("cook.md import failed", error);
      return { ok: false, error: "network" };
    }
  });
