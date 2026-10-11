import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { useSettings } from "@/lib/settings";
import { SEASONALITY, normaliseIngredient, type SeasonEntry } from "@/data/seasonality";
import { cn } from "@/lib/utils";

const CATEGORIES: SeasonEntry["category"][] = ["vegetable", "fruit", "herb", "mushroom", "nut"];

export function SeasonsView() {
  const { overrides, setOverride, month, customSeasons, addCustomSeason, removeCustomSeason } = useApp();
  const { t, months: monthNames, language } = useSettings();
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SeasonEntry["category"]>("vegetable");
  const [newMonths, setNewMonths] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const customNames = new Set(customSeasons.map((e) => e.name));
  const allEntries = [...SEASONALITY, ...customSeasons].sort((a, b) =>
    a.name.localeCompare(b.name, language),
  );

  const submitNew = (event: FormEvent) => {
    event.preventDefault();
    const name = normaliseIngredient(newName);
    if (!name) return setFormError(t("enterName"));
    if (!newMonths.length) return setFormError(t("pickMonth"));
    if ([...SEASONALITY, ...customSeasons].some((e) => e.name === name || e.aliases?.includes(name)))
      return setFormError(t("alreadyThere", { name }));
    const plural = name.endsWith("s") ? [] : [`${name}s`];
    addCustomSeason({ name, aliases: plural, months: newMonths, category: newCategory });
    setNewName("");
    setNewMonths([]);
    setFormError(null);
  };

  const monthButton = (m: number, on: boolean, onClick: () => void, highlight = false) => (
    <button
      type="button"
      key={m}
      onClick={onClick}
      className={cn(
        "w-9 rounded border px-1 py-1 text-[0.7rem] capitalize transition-colors",
        on
          ? "border-season bg-season text-season-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
        highlight && "ring-2 ring-ring ring-offset-1",
      )}
    >
      {monthNames[m - 1]!.slice(0, 3)}
    </button>
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl">{t("seasonsTitle")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("seasonsIntro", { month: monthNames[month - 1]! })}
      </p>

      <form onSubmit={submitNew} className="mt-5 space-y-3 rounded-lg border border-border bg-background p-4">
        <p className="text-sm font-medium">{t("addIngredient")}</p>
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
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(c)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1">
          {monthNames.map((_, i) => {
            const m = i + 1;
            const on = newMonths.includes(m);
            return monthButton(m, on, () =>
              setNewMonths(on ? newMonths.filter((x) => x !== m) : [...newMonths, m].sort((a, b) => a - b)),
            );
          })}
        </div>
        {formError && <p className="text-xs text-destructive">{formError}</p>}
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          {t("addToCalendar")}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {allEntries.map((entry) => {
          const months = overrides[entry.name] ?? entry.months;
          const edited = Boolean(overrides[entry.name]);
          return (
            <div key={entry.name} className="flex flex-wrap items-center gap-3 border-b border-border py-2 last:border-0">
              <span className="w-full text-sm capitalize sm:w-44">
                {entry.name}
                {customNames.has(entry.name) && (
                  <span className="ml-2 text-xs normal-case text-muted-foreground">{t("added")}</span>
                )}
              </span>
              <div className="flex flex-wrap gap-1">
                {monthNames.map((_, i) => {
                  const m = i + 1;
                  const on = months.includes(m);
                  return monthButton(
                    m,
                    on,
                    () => setOverride(entry.name, on ? months.filter((x) => x !== m) : [...months, m].sort((a, b) => a - b)),
                    m === month,
                  );
                })}
              </div>
              {edited && (
                <button onClick={() => setOverride(entry.name, null)} className="text-xs text-muted-foreground underline underline-offset-4">
                  {t("reset")}
                </button>
              )}
              {customNames.has(entry.name) && (
                <button onClick={() => removeCustomSeason(entry.name)} aria-label={`Remove ${entry.name}`} className="text-muted-foreground hover:text-foreground">
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
