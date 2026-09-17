// Bridge to the Electron main process (present only in the packaged desktop app).

export interface DesktopFile {
  name: string;
  content: string;
}

export interface DesktopBridge {
  readRecipes: () => Promise<DesktopFile[]>;
  recipesPath: () => Promise<string>;
  openRecipesFolder: () => Promise<void>;
}

declare global {
  interface Window {
    mealflow?: DesktopBridge;
  }
}

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return window.mealflow ?? null;
}

export const isDesktop = (): boolean => getDesktopBridge() !== null;
