// Turns the Cooklang text produced by cook.md into a MealFlow recipe file.

export function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** Pull the Cooklang source out of a cook.md result page. */
export function extractCookSource(html: string): string | null {
  const match = html.match(/<code[^>]*id="cook-code"[^>]*>([\s\S]*?)<\/code>/);
  if (!match?.[1]) return null;
  const text = decodeEntities(match[1].replace(/<[^>]+>/g, "")).trim();
  return text || null;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "imported-recipe"
  );
}

export interface ConvertedRecipe {
  title: string;
  fileName: string;
  content: string;
}

/** Replace cook.md's YAML front matter with MealFlow's `>>` properties. */
export function toMealFlowRecipe(source: string, url: string): ConvertedRecipe {
  const meta: Record<string, string> = {};
  let body = source.trim();
  const front = body.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (front?.[1]) {
    for (const line of front[1].split("\n")) {
      if (/^\s/.test(line)) continue; // nested values (nutrition etc.)
      const m = line.match(/^([^:]+):\s*(.*)$/);
      if (m?.[1] && m[2]) meta[m[1].trim().toLowerCase()] = m[2].trim();
    }
    body = body.slice(front[0].length).trim();
  }
  // Existing `>>` lines in the body win over nothing, but we rewrite the header ourselves.
  body = body
    .split("\n")
    .filter((line) => {
      const m = line.match(/^>>\s*([^:]+):\s*(.*)$/);
      if (!m?.[1]) return true;
      meta[m[1].trim().toLowerCase()] ??= (m[2] ?? "").trim();
      return false;
    })
    .join("\n")
    .replace(/@\?/g, "@")
    .trim();

  const title = meta.title || "Imported recipe";
  const servings = Number.parseInt(meta.servings ?? meta.yield ?? "", 10);
  const tags = [meta.course, meta.diet, meta.cuisine]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t, i, all) => t && all.indexOf(t) === i);
  const time = meta["time required"] || meta["total time"] || meta["cook time"] || meta.time;

  const header = [
    `>> title: ${title}`,
    `>> servings: ${Number.isFinite(servings) && servings > 0 ? servings : 4}`,
    tags.length ? `>> tags: ${tags.join(", ")}` : null,
    time ? `>> time: ${time}` : null,
    `>> source: ${meta.source || url}`,
  ].filter(Boolean);

  return { title, fileName: `${slugify(title)}.cook`, content: `${header.join("\n")}\n\n${body}\n` };
}
