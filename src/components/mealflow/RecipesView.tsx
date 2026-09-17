import { useRef, useState } from "react";
import { FolderOpen, Plus, RotateCw, Trash2 } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { getDesktopBridge } from "@/lib/desktop";
import { outOfSeasonIngredients } from "@/lib/recipes";
import { MONTH_NAMES } from "@/data/seasonality";
import { cn } from "@/lib/utils";

interface Props {
  onOpenRecipe: (recipeId: string) => void;
}

export function RecipesView({ onOpenRecipe }: Props) {
  const { recipes, month, overrides, addRecipe, removeAddedRecipe, rescan, recipesPath } =
    useApp();
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const bridge = getDesktopBridge();

  const filtered = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(query.toLowerCase()),
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const text = await file.text();
      addRecipe(file.name, text);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-6 py-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search recipes"
          className="w-56 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <span className="text-sm text-muted-foreground">
          {recipes.length} recipes
          {recipesPath ? ` · folder: ${recipesPath}` : ""}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".cook"
            multiple
            hidden
            onChange={(event) => void handleFiles(event.target.files)}
          />
          <button
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Plus className="size-4" />
            Add .cook files
          </button>
          {bridge && (
            <>
              <button
                onClick={() => void bridge.openRecipesFolder()}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <FolderOpen className="size-4" />
                Open folder
              </button>
              <button
                onClick={() => void rescan()}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <RotateCw className="size-4" />
                Rescan
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((recipe) => {
          const missing = outOfSeasonIngredients(recipe, month, overrides);
          return (
            <article
              key={recipe.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5",
                missing.length ? "border-warning" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug">
                  {recipe.title}
                </h3>
                {recipe.origin === "added" && (
                  <button
                    onClick={() => removeAddedRecipe(recipe.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    aria-label={`Remove ${recipe.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {recipe.protein} · serves {recipe.servings} · {recipe.parsed.ingredients.length}{" "}
                ingredients
              </p>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">
                {missing.length
                  ? `Out of season in ${MONTH_NAMES[month - 1]}: ${missing.join(", ")}`
                  : "Everything in this dish is in season right now."}
              </p>
              <button
                onClick={() => onOpenRecipe(recipe.id)}
                className="mt-4 self-start rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open recipe
              </button>
            </article>
          );
        })}
      </div>

      {!filtered.length && (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No recipes match that search.
        </p>
      )}
    </div>
  );
}
