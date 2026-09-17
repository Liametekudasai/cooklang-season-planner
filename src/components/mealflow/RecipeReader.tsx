import { Clock, CookingPot, X } from "lucide-react";

import { formatQuantity } from "@/lib/cooklang";
import type { Recipe } from "@/lib/recipes";
import { MONTH_NAMES } from "@/data/seasonality";
import { cn } from "@/lib/utils";

interface Props {
  recipe: Recipe;
  people: number;
  month: number;
  outOfSeason: string[];
  onClose: () => void;
}

export function RecipeReader({ recipe, people, month, outOfSeason, onClose }: Props) {
  const factor = people / (recipe.servings || 4);
  const time = recipe.parsed.metadata["time"] ?? recipe.parsed.metadata["duration"];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-sm">
      <button
        aria-label="Close recipe"
        className="flex-1 cursor-default"
        onClick={onClose}
      />
      <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-card shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-border bg-card/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
              {recipe.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Scaled for {people} {people === 1 ? "person" : "people"}
              {time ? ` · ${time}` : ""} · {recipe.fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {outOfSeason.length > 0 && (
          <p className="mx-6 mt-5 rounded-md border border-warning bg-warning/15 px-4 py-3 text-sm text-foreground">
            Out of season in {MONTH_NAMES[month - 1]}: {outOfSeason.join(", ")}
          </p>
        )}

        <div className="grid gap-8 px-6 py-6 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <aside>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Ingredients
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {recipe.parsed.ingredients.map((ingredient, index) => {
                const quantity =
                  typeof ingredient.quantity === "number"
                    ? Math.round(ingredient.quantity * factor * 100) / 100
                    : ingredient.quantity;
                const label = formatQuantity(quantity, ingredient.unit);
                return (
                  <li key={`${ingredient.name}-${index}`} className="flex justify-between gap-3">
                    <span className="text-foreground">{ingredient.name}</span>
                    {label && <span className="text-muted-foreground">{label}</span>}
                  </li>
                );
              })}
            </ul>

            {recipe.parsed.cookware.length > 0 && (
              <>
                <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Cookware
                </h3>
                <ul className="mt-3 space-y-1 text-sm text-foreground">
                  {[...new Set(recipe.parsed.cookware.map((c) => c.name))].map((name) => (
                    <li key={name} className="flex items-center gap-2">
                      <CookingPot className="size-4 text-muted-foreground" />
                      {name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>

          <ol className="space-y-5">
            {recipe.parsed.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <p className="text-[0.975rem] leading-7 text-foreground">
                  {step.tokens.map((token, tokenIndex) => {
                    if (token.type === "text") return <span key={tokenIndex}>{token.value}</span>;
                    if (token.type === "ingredient") {
                      const quantity =
                        typeof token.value.quantity === "number"
                          ? Math.round(token.value.quantity * factor * 100) / 100
                          : token.value.quantity;
                      const label = formatQuantity(quantity, token.value.unit);
                      return (
                        <span
                          key={tokenIndex}
                          className={cn(
                            "font-medium text-primary",
                            outOfSeason.includes(token.value.name) &&
                              "rounded-sm bg-warning/25 px-1",
                          )}
                        >
                          {token.value.name}
                          {label ? ` (${label})` : ""}
                        </span>
                      );
                    }
                    if (token.type === "cookware") {
                      return (
                        <span key={tokenIndex} className="font-medium text-accent">
                          {token.value.name}
                        </span>
                      );
                    }
                    return (
                      <span
                        key={tokenIndex}
                        className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 font-medium"
                      >
                        <Clock className="size-3.5" />
                        {formatQuantity(token.value.quantity, token.value.unit)}
                      </span>
                    );
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
