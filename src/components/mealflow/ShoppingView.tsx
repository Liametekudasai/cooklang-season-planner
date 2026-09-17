import { useMemo } from "react";
import { ShoppingBasket } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { buildShoppingList } from "@/lib/shopping";
import { cn } from "@/lib/utils";

export function ShoppingView() {
  const { plan, recipes, checked, toggleChecked, clearChecked, people } = useApp();

  const groups = useMemo(
    () => (plan ? buildShoppingList(plan, recipes) : []),
    [plan, recipes],
  );

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const done = groups.reduce(
    (sum, group) => sum + group.items.filter((item) => checked.has(item.key)).length,
    0,
  );

  if (!plan) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
        <ShoppingBasket className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Generate a weekly plan first and the shopping list builds itself.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-4">
        <p className="text-sm text-muted-foreground">
          {done} of {total} items ticked off · quantities for {people}{" "}
          {people === 1 ? "person" : "people"}
        </p>
        <button
          onClick={clearChecked}
          className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          Reset list
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group.aisle} className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg">{group.aisle}</h3>
            <ul className="mt-3 divide-y divide-border">
              {group.items.map((item) => {
                const isDone = checked.has(item.key);
                return (
                  <li key={item.key}>
                    <label className="flex cursor-pointer items-start gap-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleChecked(item.key)}
                        className="mt-1 size-4 accent-[var(--primary)]"
                      />
                      <span className="flex-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isDone && "text-muted-foreground line-through",
                          )}
                        >
                          {item.name}
                          {item.amounts.length > 0 && (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              — {item.amounts.join(" + ")}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.usedIn.join(", ")}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
