import { useState } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { MONTH_NAMES, SEASONALITY, normaliseIngredient, type SeasonEntry } from "@/data/seasonality";
import { cn } from "@/lib/utils";

const TEMPLATE = `>> title: Roast Chicken with Root Vegetables
>> servings: 4
>> tags: main, roast
>> time: 1 hour 20 minutes

Heat the #oven{} to 200C.

Rub @chicken{1.6%kg} with @olive oil{2%tbsp}, @salt{1%tsp} and @thyme{3%sprigs}.

Chop @carrot{4} and @parsnip{2} into chunks and scatter in the #roasting tin{}.

Roast for ~{70%minutes} until the juices run clear.`;

export function GuideView() {
  const { overrides, setOverride, month, recipesPath, customSeasons, addCustomSeason, removeCustomSeason } =
    useApp();
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SeasonEntry["category"]>("vegetable");
  const [newMonths, setNewMonths] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const customNames = new Set(customSeasons.map((e) => e.name));
  const allEntries = [...SEASONALITY, ...customSeasons];

  const submitNew = (event: React.FormEvent) => {
    event.preventDefault();
    const name = normaliseIngredient(newName);
    if (!name) return setFormError("Enter an ingredient name.");
    if (!newMonths.length) return setFormError("Pick at least one month.");
    if (SEASONALITY.some((e) => e.name === name || e.aliases?.includes(name)))
      return setFormError(`"${name}" is already in the calendar — edit its months below.`);
    const plural = name.endsWith("s") ? [] : [`${name}s`];
    addCustomSeason({ name, aliases: plural, months: newMonths, category: newCategory });
    setNewName("");
    setNewMonths([]);
    setFormError(null);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Writing your own recipes
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Recipes are plain text files ending in <code>.cook</code>. Save them in the{" "}
          <strong>recipes</strong> folder{recipesPath ? ` (${recipesPath})` : ""} and the app
          picks them up, pulls out the ingredients and uses them for plans, shopping lists and
          the reader. You can also drop files in from the Recipes screen.
        </p>

        <div className="mt-5 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="relative min-w-0">
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 pt-12 text-[0.75rem] leading-6 sm:text-[0.8rem]">
              {TEMPLATE}
            </pre>
            <button
              onClick={() => void copy()}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy template"}
            </button>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <code className="text-foreground">{">> title: ..."}</code> — recipe details.
              Title and servings matter most.
            </li>
            <li>
              <code className="text-foreground">@carrot{"{4}"}</code> — an ingredient with an
              amount. Use <code className="text-foreground">@olive oil{"{2%tbsp}"}</code> for
              multi-word names and units.
            </li>
            <li>
              <code className="text-foreground">#pan{"{}"}</code> — cookware.
            </li>
            <li>
              <code className="text-foreground">~{"{10%minutes}"}</code> — a timer.
            </li>
            <li>A blank line starts a new step.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Seasonal calendar (Europe)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Click a month to correct when something is in season where you live. It is{" "}
          {MONTH_NAMES[month - 1]} now. Anything not on this list counts as available all year.
        </p>

        <form
          onSubmit={submitNew}
          className="mt-5 space-y-3 rounded-lg border border-border bg-background p-4"
        >
          <p className="text-sm font-medium">Add an ingredient</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. kohlrabi"
              maxLength={40}
              className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as SeasonEntry["category"])}
              className="rounded-md border border-border bg-card px-2 py-2 text-sm"
            >
              <option value="vegetable">Vegetable</option>
              <option value="fruit">Fruit</option>
              <option value="herb">Herb</option>
              <option value="mushroom">Mushroom</option>
              <option value="nut">Nut</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            {MONTH_NAMES.map((name, index) => {
              const m = index + 1;
              const on = newMonths.includes(m);
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() =>
                    setNewMonths(on ? newMonths.filter((x) => x !== m) : [...newMonths, m].sort((a, b) => a - b))
                  }
                  className={cn(
                    "w-9 rounded border px-1 py-1 text-[0.7rem] transition-colors",
                    on
                      ? "border-season bg-season text-season-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Add to calendar
          </button>
        </form>

        <div className="mt-5 space-y-2">
          {allEntries.map((entry) => {
            const months = overrides[entry.name] ?? entry.months;
            const edited = Boolean(overrides[entry.name]);
            return (
              <div
                key={entry.name}
                className="flex flex-wrap items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <span className="w-full text-sm capitalize sm:w-44">
                  {entry.name}
                  {customNames.has(entry.name) && (
                    <span className="ml-2 text-xs normal-case text-muted-foreground">(added)</span>
                  )}
                </span>
                <div className="flex flex-wrap gap-1">
                  {MONTH_NAMES.map((name, index) => {
                    const monthNumber = index + 1;
                    const on = months.includes(monthNumber);
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          const next = on
                            ? months.filter((m) => m !== monthNumber)
                            : [...months, monthNumber].sort((a, b) => a - b);
                          setOverride(entry.name, next);
                        }}
                        className={cn(
                          "w-9 rounded border px-1 py-1 text-[0.7rem] transition-colors",
                          on
                            ? "border-season bg-season text-season-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                          monthNumber === month && "ring-2 ring-ring ring-offset-1",
                        )}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                {edited && (
                  <button
                    onClick={() => setOverride(entry.name, null)}
                    className="text-xs text-muted-foreground underline underline-offset-4"
                  >
                    reset
                  </button>
                )}
                {customNames.has(entry.name) && (
                  <button
                    onClick={() => removeCustomSeason(entry.name)}
                    aria-label={`Remove ${entry.name}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
