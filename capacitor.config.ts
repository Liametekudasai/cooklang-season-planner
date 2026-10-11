import type { CapacitorConfig } from "@capacitor/cli";

// The Android app opens the live MealFlow site (needed for the link import),
// so publish the app and replace this URL with the published address.
const config: CapacitorConfig = {
  appId: "app.lovable.mealflow",
  appName: "MealFlow",
  webDir: "public",
  server: {
    url: "https://id-preview--4aee46cf-9e14-4621-99ae-a5839ca26657.lovable.app?forceHideBadge=true",
    cleartext: false,
  },
};

export default config;
