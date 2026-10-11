import { useState } from "react";
import { FileText, FolderOpen, Leaf, Monitor, Moon, Settings, Sun } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { useSettings, type Language, type Theme } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { MAX_EMOJI_LIMIT } from "@/lib/recipe-emojis";
import { RecipeMakerView } from "./RecipeMakerView";
import { SeasonsView } from "./SeasonsView";

type Tab = "seasons" | "maker" | "settings";

export function MoreView() {
  const { t } = useSettings();
  const [tab, setTab] = useState<Tab>("seasons");
  const tabs = [
    { id: "seasons" as const, label: t("seasons"), icon: Leaf },
    { id: "maker" as const, label: t("maker"), icon: FileText },
    { id: "settings" as const, label: t("settings"), icon: Settings },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 border-b border-border pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              tab === item.id ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </div>
      {tab === "seasons" && <SeasonsView />}
      {tab === "maker" && <RecipeMakerView />}
      {tab === "settings" && <SettingsView />}
    </div>
  );
}

function SettingsView() {
  const { t, language, setLanguage, theme, setTheme, emojiLimit, setEmojiLimit } = useSettings();
  const { canChooseFolder, chooseRecipesFolder, recipesPath } = useApp();
  const choice = (active: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
    );
  const langs: { id: Language; label: string }[] = [
    { id: "en", label: "English" },
    { id: "fr", label: "Français" },
  ];
  const themes: { id: Theme; icon: typeof Sun }[] = [
    { id: "light", icon: Sun },
    { id: "dark", icon: Moon },
    { id: "system", icon: Monitor },
  ];
  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div>
        <h3 className="text-sm font-medium">{t("language")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {langs.map((l) => (
            <button key={l.id} onClick={() => setLanguage(l.id)} className={choice(language === l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium">{t("appearance")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {themes.map((th) => (
            <button key={th.id} onClick={() => setTheme(th.id)} className={choice(theme === th.id)}>
              <th.icon className="size-4" />
              {t(th.id)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="recipe-emoji-limit" className="block text-sm font-medium">{t("emojiLimit")}</label>
        <input
          id="recipe-emoji-limit"
          type="number"
          min={0}
          max={MAX_EMOJI_LIMIT}
          step={1}
          value={emojiLimit}
          onChange={(event) => {
            if (event.target.value !== "") setEmojiLimit(event.target.valueAsNumber);
          }}
          className="mt-2 w-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium">{t("recipesFolder")}</h3>
        <p className="mt-1 break-all text-xs text-muted-foreground">
          {canChooseFolder ? (recipesPath ?? "—") : t("folderAppOnly")}
        </p>
        <button
          onClick={() => void chooseRecipesFolder()}
          disabled={!canChooseFolder}
          className={cn(choice(false), "mt-2 disabled:opacity-50")}
        >
          <FolderOpen className="size-4" />
          {t("changeFolder")}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{t("settingsNote")}</p>
    </section>
  );
}
