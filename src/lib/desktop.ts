// Bridge to the native shell: Electron (window.mealflow) or the Android app (Capacitor).
import { Capacitor } from "@capacitor/core";

export interface DesktopFile {
  name: string;
  content: string;
}

export interface DesktopBridge {
  readRecipes: () => Promise<DesktopFile[]>;
  recipesPath: () => Promise<string>;
  openRecipesFolder: () => Promise<void>;
  /** Let the user pick a new recipes folder. Resolves to the new path, or null if cancelled. */
  chooseRecipesFolder?: () => Promise<string | null>;
}

declare global {
  interface Window {
    mealflow?: DesktopBridge;
  }
}

const ANDROID_DIR_KEY = "mealflow.recipesDir";
const DEFAULT_ANDROID_DIR = "MealFlow/recipes";

const androidDir = () => localStorage.getItem(ANDROID_DIR_KEY) || DEFAULT_ANDROID_DIR;

// Recipes live inside the phone's Documents folder, at a path the user can change.
const androidBridge: DesktopBridge = {
  async readRecipes() {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const path = androidDir();
    await Filesystem.mkdir({ path, directory: Directory.Documents, recursive: true }).catch(() => {});
    const { files } = await Filesystem.readdir({ path, directory: Directory.Documents });
    const cook = files.filter((f) => f.type === "file" && f.name.endsWith(".cook"));
    return Promise.all(
      cook.map(async (f) => {
        const res = await Filesystem.readFile({
          path: `${path}/${f.name}`,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return { name: f.name, content: typeof res.data === "string" ? res.data : "" };
      }),
    );
  },
  async recipesPath() {
    return `Documents/${androidDir()}`;
  },
  async openRecipesFolder() {
    /* Android has no generic "open folder" action */
  },
  async chooseRecipesFolder() {
    const next = window.prompt("Folder inside Documents", androidDir());
    if (next === null) return null;
    const clean = next.trim().replace(/^\/+|\/+$/g, "") || DEFAULT_ANDROID_DIR;
    localStorage.setItem(ANDROID_DIR_KEY, clean);
    return `Documents/${clean}`;
  },
};

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  if (window.mealflow) return window.mealflow;
  if (Capacitor.isNativePlatform()) return androidBridge;
  return null;
}

export const isDesktop = (): boolean => getDesktopBridge() !== null;
