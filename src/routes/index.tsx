import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MealFlowApp, type View } from "@/components/mealflow/MealFlowApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MealFlow — Seasonal Weekly Meal Planner" },
      {
        name: "description",
        content:
          "Plan a balanced week of meals from your own Cooklang recipes, follow the seasons and get a ready-made shopping list.",
      },
      { property: "og:title", content: "MealFlow — Seasonal Weekly Meal Planner" },
      {
        property: "og:description",
        content:
          "Plan a balanced week of meals from your own Cooklang recipes, follow the seasons and get a ready-made shopping list.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
  ssr: false,
});

function Index() {
  const [view, setView] = useState<View>("planner");
  return <MealFlowApp view={view} onNavigate={setView} />;
}
