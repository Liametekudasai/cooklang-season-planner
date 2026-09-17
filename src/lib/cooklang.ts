// Minimal, dependency-free Cooklang parser.
// Supports: >> metadata, @ingredients{qty%unit}, #cookware{}, ~timer{qty%unit},
// -- line comments, [- block comments -], blank-line separated steps.

export type Quantity = number | string | null;

export interface Ingredient {
  name: string;
  quantity: Quantity;
  unit: string | null;
}

export interface Cookware {
  name: string;
  quantity: Quantity;
}

export interface Timer {
  name: string | null;
  quantity: Quantity;
  unit: string | null;
}

export type StepToken =
  | { type: "text"; value: string }
  | { type: "ingredient"; value: Ingredient }
  | { type: "cookware"; value: Cookware }
  | { type: "timer"; value: Timer };

export interface Step {
  tokens: StepToken[];
}

export interface ParsedRecipe {
  metadata: Record<string, string>;
  steps: Step[];
  ingredients: Ingredient[];
  cookware: Cookware[];
}

function parseQuantity(raw: string): { quantity: Quantity; unit: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { quantity: null, unit: null };
  const [amountPart, unitPart] = trimmed.split("%");
  const amountRaw = (amountPart ?? "").trim();
  const unit = unitPart ? unitPart.trim() : null;

  if (!amountRaw) return { quantity: null, unit };

  // fractions like 1/2
  const fraction = amountRaw.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const a = Number(fraction[1]);
    const b = Number(fraction[2]);
    if (b !== 0) return { quantity: a / b, unit };
  }
  const num = Number(amountRaw.replace(",", "."));
  if (!Number.isNaN(num)) return { quantity: num, unit };
  return { quantity: amountRaw, unit };
}

function stripComments(source: string): string {
  return source
    .replace(/\[-[\s\S]*?-\]/g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

const WORD_END = /[\s,.;:!?)\]]/;

function readName(text: string, start: number): { name: string; next: number } {
  // Braced name: @name{...} — name runs up to the "{"
  const braceIndex = text.indexOf("{", start);
  let end = start;
  while (end < text.length && !WORD_END.test(text[end]!) && text[end] !== "{") end++;

  if (braceIndex !== -1 && braceIndex === end) {
    return { name: text.slice(start, braceIndex), next: braceIndex };
  }
  return { name: text.slice(start, end), next: end };
}

function parseStepLine(line: string): Step {
  const tokens: StepToken[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      tokens.push({ type: "text", value: buffer });
      buffer = "";
    }
  };

  while (i < line.length) {
    const char = line[i]!;
    if (char === "@" || char === "#" || char === "~") {
      const { name, next } = readName(line, i + 1);
      let body = "";
      let cursor = next;
      if (line[cursor] === "{") {
        const close = line.indexOf("}", cursor);
        if (close !== -1) {
          body = line.slice(cursor + 1, close);
          cursor = close + 1;
        }
      }
      if (!name && !body) {
        buffer += char;
        i += 1;
        continue;
      }
      flush();
      const { quantity, unit } = parseQuantity(body);
      if (char === "@") {
        tokens.push({
          type: "ingredient",
          value: { name: name.trim(), quantity, unit },
        });
      } else if (char === "#") {
        tokens.push({ type: "cookware", value: { name: name.trim(), quantity } });
      } else {
        tokens.push({
          type: "timer",
          value: { name: name.trim() || null, quantity, unit },
        });
      }
      i = cursor;
      continue;
    }
    buffer += char;
    i += 1;
  }
  flush();
  return { tokens };
}

export function parseCooklang(source: string): ParsedRecipe {
  const metadata: Record<string, string> = {};
  const steps: Step[] = [];
  const cleaned = stripComments(source);

  const blocks = cleaned.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split("\n");
    const stepLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith(">>")) {
        const rest = trimmed.slice(2);
        const sep = rest.indexOf(":");
        if (sep !== -1) {
          metadata[rest.slice(0, sep).trim().toLowerCase()] = rest.slice(sep + 1).trim();
        }
        continue;
      }
      stepLines.push(trimmed);
    }
    if (stepLines.length) steps.push(parseStepLine(stepLines.join(" ")));
  }

  const ingredients: Ingredient[] = [];
  const cookware: Cookware[] = [];
  for (const step of steps) {
    for (const token of step.tokens) {
      if (token.type === "ingredient") ingredients.push(token.value);
      if (token.type === "cookware") cookware.push(token.value);
    }
  }

  return { metadata, steps, ingredients, cookware };
}

export function formatQuantity(quantity: Quantity, unit: string | null): string {
  if (quantity === null && !unit) return "";
  let amount = "";
  if (typeof quantity === "number") {
    amount = Number.isInteger(quantity) ? String(quantity) : String(Math.round(quantity * 100) / 100);
  } else if (typeof quantity === "string") {
    amount = quantity;
  }
  return [amount, unit].filter(Boolean).join(" ").trim();
}
