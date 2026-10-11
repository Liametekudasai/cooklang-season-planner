import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Download, Link2, Loader2, Plus } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { useSettings } from "@/lib/settings";
import { importFromCookMd } from "@/lib/cookmd.functions";

const TEMPLATE = `>> title: Roast Chicken with Root Vegetables
>> servings: 4
>> tags: main, roast
>> time: 1 hour 20 minutes

Heat the #oven{} to 200C.

Rub @chicken{1.6%kg} with @olive oil{2%tbsp}, @salt{1%tsp} and @thyme{3%sprigs}.

Chop @carrot{4} and @parsnip{2} into chunks and scatter in the #roasting tin{}.

Roast for ~{70%minutes} until the juices run clear.`;

export function RecipeMakerView() {
  const { recipesPath, addRecipe } = useApp();
  const { t } = useSettings();
  const convert = useServerFn(importFromCookMd);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ fileName: string; content: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const parsed = new URL(url.trim());
      if (!parsed.protocol.startsWith("http")) throw new Error();
    } catch {
      return setError(t("badLink"));
    }
    setBusy(true);
    try {
      const res = await convert({ data: { url: url.trim() } });
      if (res.ok) setResult({ fileName: res.fileName, content: res.content });
      else setError(t("importFailed"));
    } catch {
      setError(t("importFailed"));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btn =
    "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl">{t("importTitle")}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("importIntro")}</p>
        <form onSubmit={(e) => void submit(e)} className="mt-4 flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com/recipes/..."
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" disabled={busy || !url.trim()} className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            {t("convert")}
          </button>
        </form>
        {busy && <p className="mt-2 text-xs text-muted-foreground">{t("converting")}</p>}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        {result && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">{result.fileName}</p>
            <textarea
              value={result.content}
              onChange={(e) => setResult({ ...result, content: e.target.value })}
              rows={14}
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-5"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  addRecipe(result.fileName, result.content);
                  setSaved(true);
                }}
                className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}
              >
                <Plus className="size-4" />
                {t("addToRecipes")}
              </button>
              <button onClick={download} className={`${btn} border border-border hover:bg-muted`}>
                <Download className="size-4" />
                {t("download")}
              </button>
              {saved && <span className="text-xs text-muted-foreground">{t("addedOk")}</span>}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl">{t("formatTitle")}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {t("formatIntro", { path: recipesPath ? ` (${recipesPath})` : "" })}
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
              {copied ? t("copied") : t("copyTemplate")}
            </button>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><code className="text-foreground">{">> title: ..."}</code> {t("hintMeta")}</li>
            <li><code className="text-foreground">@carrot{"{4}"}</code> {t("hintIng")}</li>
            <li><code className="text-foreground">#pan{"{}"}</code> {t("hintCookware")}</li>
            <li><code className="text-foreground">~{"{10%minutes}"}</code> {t("hintTimer")}</li>
            <li>{t("hintStep")}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
