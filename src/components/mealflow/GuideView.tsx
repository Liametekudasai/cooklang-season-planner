import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { MONTH_NAMES, SEASONALITY } from "@/data/seasonality";
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
  const { overrides, setOverride, month, recipesPath } = useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Writing your own recipes
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Recipes are plain text files ending in <code>.cook</code>. Save them in the{" "}
          <strong>recipes</strong> folder{recipesPath ? ` (${recipesPath})` : ""} and the app
          picks them up, pulls out the ingredients and uses them for plans, shopping lists and
          the reader. You can also drop files in from the Recipes screen.
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 text-[0.8rem] leading-6">
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

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Seasonal calendar (Europe)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Click a month to correct when something is in season where you live. It is{" "}
          {MONTH_NAMES[month - 1]} now. Anything not on this list counts as available all year.
        </p>

        <div className="mt-5 space-y-2">
          {SEASONALITY.map((entry) => {
            const months = overrides[entry.name] ?? entry.months;
            const edited = Boolean(overrides[entry.name]);
            return (
              <div
                key={entry.name}
                className="flex flex-wrap items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <span className="w-44 text-sm capitalize">{entry.name}</span>
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
