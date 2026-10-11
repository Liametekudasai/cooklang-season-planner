import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "fr";
export type Theme = "light" | "dark" | "system";

const KEY = "mealflow.settings.v1";

const STRINGS = {
  en: {
    week: "Week", shopping: "Shopping", recipes: "Recipes", more: "More",
    tagline: "Seasonal weekly planner",
    seasons: "Seasons", settings: "Settings", maker: "Recipe maker",
    language: "Language", appearance: "Appearance", light: "Light", dark: "Dark", system: "System",
    settingsNote: "More settings coming soon.",
    recipesFolder: "Recipes folder", changeFolder: "Change folder",
    folderAppOnly: "Available in the Android and desktop apps.",
    seasonsTitle: "Seasonal calendar (Europe)",
    seasonsIntro: "Click a month to correct when something is in season where you live. It is {month} now. Anything not on this list counts as available all year.",
    addIngredient: "Add an ingredient", addToCalendar: "Add to calendar", added: "(added)", reset: "reset",
    enterName: "Enter an ingredient name.", pickMonth: "Pick at least one month.",
    alreadyThere: "\"{name}\" is already in the calendar — edit its months below.",
    importTitle: "Import from a link",
    importIntro: "Paste the link to a recipe page. cook.md turns it into a recipe file, then MealFlow fills in its own details (title, servings, tags, time, source).",
    convert: "Make recipe", converting: "Converting… this can take a few seconds",
    addToRecipes: "Add to my recipes", download: "Download .cook", addedOk: "Added to your recipes.",
    importFailed: "Could not convert this page. Check the link or try again in a moment.",
    badLink: "That doesn't look like a web link.",
    formatTitle: "Writing your own recipes",
    formatIntro: "Recipes are plain text files ending in .cook. Save them in the recipes folder{path} and the app picks them up. You can also drop files in from the Recipes screen.",
    copyTemplate: "Copy template", copied: "Copied",
    hintMeta: "— recipe details. Title and servings matter most.",
    hintIng: "— an ingredient with an amount. Use @olive oil{2%tbsp} for multi-word names and units.",
    hintCookware: "— cookware.", hintTimer: "— a timer.", hintStep: "A blank line starts a new step.",
    vegetable: "Vegetable", fruit: "Fruit", herb: "Herb", mushroom: "Mushroom", nut: "Nut",
  },
  fr: {
    week: "Semaine", shopping: "Courses", recipes: "Recettes", more: "Plus",
    tagline: "Planning de saison",
    seasons: "Saisons", settings: "Réglages", maker: "Créateur de recettes",
    language: "Langue", appearance: "Apparence", light: "Clair", dark: "Sombre", system: "Système",
    settingsNote: "D'autres réglages arrivent bientôt.",
    recipesFolder: "Dossier des recettes", changeFolder: "Changer de dossier",
    folderAppOnly: "Disponible dans l'application Android et ordinateur.",
    seasonsTitle: "Calendrier des saisons (Europe)",
    seasonsIntro: "Cliquez sur un mois pour corriger la saison chez vous. Nous sommes en {month}. Tout ce qui n'est pas listé est disponible toute l'année.",
    addIngredient: "Ajouter un ingrédient", addToCalendar: "Ajouter au calendrier", added: "(ajouté)", reset: "réinitialiser",
    enterName: "Entrez un nom d'ingrédient.", pickMonth: "Choisissez au moins un mois.",
    alreadyThere: "« {name} » est déjà dans le calendrier — modifiez ses mois ci-dessous.",
    importTitle: "Importer depuis un lien",
    importIntro: "Collez le lien d'une page de recette. cook.md la transforme en fichier recette, puis MealFlow remplit ses propres informations (titre, portions, tags, durée, source).",
    convert: "Créer la recette", converting: "Conversion… cela peut prendre quelques secondes",
    addToRecipes: "Ajouter à mes recettes", download: "Télécharger .cook", addedOk: "Ajoutée à vos recettes.",
    importFailed: "Impossible de convertir cette page. Vérifiez le lien ou réessayez dans un instant.",
    badLink: "Ce n'est pas un lien web valide.",
    formatTitle: "Écrire vos propres recettes",
    formatIntro: "Les recettes sont des fichiers texte finissant par .cook. Enregistrez-les dans le dossier recipes{path} et l'application les lit. Vous pouvez aussi les ajouter depuis l'écran Recettes.",
    copyTemplate: "Copier le modèle", copied: "Copié",
    hintMeta: "— infos de la recette. Le titre et les portions comptent le plus.",
    hintIng: "— un ingrédient avec une quantité. Utilisez @olive oil{2%tbsp} pour les noms en plusieurs mots et les unités.",
    hintCookware: "— ustensile.", hintTimer: "— un minuteur.", hintStep: "Une ligne vide commence une nouvelle étape.",
    vegetable: "Légume", fruit: "Fruit", herb: "Herbe", mushroom: "Champignon", nut: "Fruit à coque",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

export const MONTHS: Record<Language, string[]> = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  fr: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],
};

interface Settings {
  language: Language;
  theme: Theme;
  setLanguage: (l: Language) => void;
  setTheme: (t: Theme) => void;
  t: (key: StringKey, vars?: Record<string, string>) => string;
  months: string[];
}

const Ctx = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>;
      if (saved.language === "en" || saved.language === "fr") setLanguage(saved.language);
      if (saved.theme === "light" || saved.theme === "dark" || saved.theme === "system") setTheme(saved.theme);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify({ language, theme }));
    document.documentElement.lang = language;
  }, [language, theme, ready]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const t = (key: StringKey, vars?: Record<string, string>) => {
    let text: string = STRINGS[language][key];
    for (const [k, v] of Object.entries(vars ?? {})) text = text.replace(`{${k}}`, v);
    return text;
  };

  return (
    <Ctx.Provider value={{ language, theme, setLanguage, setTheme, t, months: MONTHS[language] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
