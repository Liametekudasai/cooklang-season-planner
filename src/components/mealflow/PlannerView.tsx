import { useState } from "react";
import { AlertTriangle, Dices, FolderOpen, RefreshCw, Save, Shuffle, Trash2, Users, Utensils } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { MONTH_NAMES } from "@/data/seasonality";
import { DAYS, slotPeople, type MealSlot } from "@/lib/planner";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import { recipeEmojis } from "@/lib/recipe-emojis";
import { Button } from "@/components/ui/button";

interface Props {
  onOpenRecipe: (recipeId: string, people?: number) => void;
}

const MEAL_OPTIONS: MealSlot[] = ["lunch", "dinner"];

export function PlannerView({ onOpenRecipe }: Props) {
  const { emojiLimit } = useSettings();
  const {
    plan,
    status,
    people,
    meals,
    month,
    recipes,
    setPeople,
    setMeals,
    regenerate,
    swapSlot,
    rerollSlot,
    advanced,
    setAdvanced,
    setSlotPeople,
    savedMenus,
    saveMenu,
    loadMenu,
    deleteMenu,
  } = useApp();
  const [swapping, setSwapping] = useState<number | null>(null);
  const [menuName, setMenuName] = useState("");
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const outOfSeasonCount = status.filter((slot) => slot.outOfSeason.length > 0).length;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {advanced ? "Default people" : "People"}
            </label>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setPeople(Math.max(1, people - 1))}
                className="size-9 rounded-md border border-border text-lg transition-colors hover:bg-muted"
                aria-label="Fewer people"
              >
                −
              </button>
              <span className="w-10 text-center text-xl font-semibold">{people}</span>
              <button
                onClick={() => setPeople(Math.min(20, people + 1))}
                className="size-9 rounded-md border border-border text-lg transition-colors hover:bg-muted"
                aria-label="More people"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Meals per day
            </label>
            <div className="mt-2 flex gap-2">
              {MEAL_OPTIONS.map((meal) => {
                const active = meals.includes(meal);
                return (
                  <button
                    key={meal}
                    onClick={() =>
                      setMeals(
                        active
                          ? meals.filter((m) => m !== meal)
                          : MEAL_OPTIONS.filter((m) => m === meal || meals.includes(m)),
                      )
                    }
                    disabled={active && meals.length === 1}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm capitalize transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted",
                      active && meals.length === 1 && "opacity-90",
                    )}
                  >
                    {meal}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Mode
            </label>
            <button
              onClick={() => setAdvanced(!advanced)}
              aria-pressed={advanced}
              className={cn(
                "mt-2 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors",
                advanced
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              <Users className="size-4" />
              {advanced ? "Advanced: people per meal" : "Simple"}
            </button>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto">
            <span className="text-sm text-muted-foreground">
              {MONTH_NAMES[month - 1]} · {recipes.length} recipes
            </span>
            <button
              onClick={regenerate}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="size-4" />
              {plan ? "Generate a new week" : "Generate week"}
            </button>
          </div>
        </div>
      </section>

      {advanced && plan && (
        <p className="text-sm text-muted-foreground">
          Set how many people eat each meal with the − / + buttons on every dish. Set a meal to 0
          to leave it off the shopping list.
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Saved menus</h2>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!plan) return;
            const name = menuName.trim() || "Untitled menu";
            saveMenu(name);
            setMenuName("");
            setSavedNote(`Saved "${name}"`);
            setTimeout(() => setSavedNote(null), 2500);
          }}
        >
          <input
            value={menuName}
            onChange={(event) => setMenuName(event.target.value)}
            placeholder={plan ? "Name this week's menu" : "Generate a week first"}
            disabled={!plan}
            maxLength={60}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!plan}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Save className="size-4" />
            Save menu
          </button>
        </form>
        {savedNote && <p className="mt-2 text-xs text-muted-foreground">{savedNote}</p>}
        {savedMenus.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {[...savedMenus].reverse().map((menu) => (
              <li key={menu.id} className="flex flex-wrap items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{menu.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(menu.savedAt).toLocaleDateString()} · {menu.plan.entries.length}{" "}
                    meals
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!plan || window.confirm(`Replace the current week with "${menu.name}"?`))
                      loadMenu(menu.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                >
                  <FolderOpen className="size-3.5" />
                  Use
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${menu.name}"?`)) deleteMenu(menu.id);
                  }}
                  aria-label={`Delete ${menu.name}`}
                  className="inline-flex items-center rounded-md border border-border p-1.5 text-xs transition-colors hover:bg-muted"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">No saved menus yet.</p>
        )}
      </section>

      {!plan && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Utensils className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl">
            No plan yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Choose how many people you are cooking for and generate a week of balanced,
            seasonal meals from your recipe collection.
          </p>
        </div>
      )}

      {plan && outOfSeasonCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning/15 px-5 py-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm">
            {outOfSeasonCount} {outOfSeasonCount === 1 ? "dish uses" : "dishes use"} produce
            that is no longer in season this month. Swap them, or let the app pick a seasonal
            replacement.
          </p>
        </div>
      )}

      {plan && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((day) => {
            const slots = status
              .map((slot, index) => ({ slot, index }))
              .filter(({ slot }) => slot.entry.day === day);
            if (!slots.length) return null;
            return (
              <section
                key={day}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-[family-name:var(--font-display)] text-lg">{day}</h3>
                <div className="mt-3 space-y-3">
                  {slots.map(({ slot, index }) => {
                    const flagged = slot.outOfSeason.length > 0;
                    return (
                      <div
                        key={`${slot.entry.day}-${slot.entry.meal}`}
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          advanced && plan && slotPeople(plan, slot.entry) === 0 && "opacity-50",
                          flagged
                            ? "border-warning bg-warning/10"
                            : "border-border/70 bg-background",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                            {slot.entry.meal}
                          </p>
                          {advanced && plan && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setSlotPeople(index, slotPeople(plan, slot.entry) - 1)
                                }
                                className="size-7 rounded border border-border text-sm hover:bg-muted"
                                aria-label={`Fewer people for ${day} ${slot.entry.meal}`}
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {slotPeople(plan, slot.entry)}
                              </span>
                              <button
                                onClick={() =>
                                  setSlotPeople(index, slotPeople(plan, slot.entry) + 1)
                                }
                                className="size-7 rounded border border-border text-sm hover:bg-muted"
                                aria-label={`More people for ${day} ${slot.entry.meal}`}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="link"
                          onClick={() =>
                            slot.recipe &&
                            onOpenRecipe(slot.recipe.id, plan ? slotPeople(plan, slot.entry) : undefined)
                          }
                          className="mt-1 block h-auto w-full whitespace-normal break-words p-0 text-left text-base font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {slot.recipe && recipeEmojis(slot.recipe, emojiLimit).length > 0 && (
                            <span aria-hidden="true">{recipeEmojis(slot.recipe, emojiLimit).join("")} </span>
                          )}
                          {slot.recipe?.title ?? "Recipe missing"}
                        </Button>
                        {flagged && (
                          <p className="mt-1.5 text-xs text-foreground/80">
                            Out of season: {slot.outOfSeason.join(", ")}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => rerollSlot(index)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                          >
                            <Dices className="size-3.5" />
                            Pick seasonal
                          </button>
                          <button
                            onClick={() => setSwapping(swapping === index ? null : index)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                          >
                            <Shuffle className="size-3.5" />
                            Choose
                          </button>
                        </div>

                        {swapping === index && (
                          <select
                            autoFocus
                            className="mt-3 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                            value={slot.entry.recipeId}
                            onChange={(event) => {
                              swapSlot(index, event.target.value);
                              setSwapping(null);
                            }}
                          >
                            {recipes.map((recipe) => (
                              <option key={recipe.id} value={recipe.id}>
                                {[recipeEmojis(recipe, emojiLimit).join(""), recipe.title].filter(Boolean).join(" ")}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
