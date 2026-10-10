import { useState } from "react";
import { BookOpen, CalendarDays, ChefHat, ShoppingBasket } from "lucide-react";

import { AppStateProvider, useApp } from "@/lib/app-state";
import { outOfSeasonIngredients } from "@/lib/recipes";
import { MONTH_NAMES } from "@/data/seasonality";
import { cn } from "@/lib/utils";
import { GuideView } from "./GuideView";
import { PlannerView } from "./PlannerView";
import { RecipeReader } from "./RecipeReader";
import { RecipesView } from "./RecipesView";
import { ShoppingView } from "./ShoppingView";

export type View = "planner" | "recipes" | "shopping" | "guide";

const NAV: { view: View; label: string; icon: typeof CalendarDays }[] = [
  { view: "planner", label: "Week", icon: CalendarDays },
  { view: "shopping", label: "Shopping", icon: ShoppingBasket },
  { view: "recipes", label: "Recipes", icon: ChefHat },
  { view: "guide", label: "Recipe format & seasons", icon: BookOpen },
];

export function MealFlowApp({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (view: View) => void;
}) {
  return (
    <AppStateProvider>
      <Shell view={view} onNavigate={onNavigate} />
    </AppStateProvider>
  );
}

function Shell({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  const { month, recipes, overrides, people } = useApp();
  const [openRecipeId, setOpenId] = useState<string | null>(null);
  const [openPeople, setOpenPeople] = useState<number | null>(null);
  const setOpenRecipeId = (id: string | null, forPeople?: number) => {
    setOpenId(id);
    setOpenPeople(forPeople ?? null);
  };
  const openRecipe = recipes.find((recipe) => recipe.id === openRecipeId) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl leading-none">
              MealFlow
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Seasonal weekly planner · {MONTH_NAMES[month - 1]}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm transition-colors",
                  view === item.view
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {view === "planner" && <PlannerView onOpenRecipe={(id, n) => setOpenRecipeId(id, n)} />}
        {view === "shopping" && <ShoppingView />}
        {view === "recipes" && <RecipesView onOpenRecipe={(id) => setOpenRecipeId(id)} />}
        {view === "guide" && <GuideView />}
      </main>

      {openRecipe && (
        <RecipeReader
          recipe={openRecipe}
          people={openPeople && openPeople > 0 ? openPeople : people}
          month={month}
          outOfSeason={outOfSeasonIngredients(openRecipe, month, overrides)}
          onClose={() => setOpenRecipeId(null)}
        />
      )}
    </div>
  );
}
