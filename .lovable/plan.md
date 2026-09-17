# MealFlow Weekly Planner — Desktop App

Build a seasonal weekly meal planner that reads your own Cooklang recipes from a folder on your computer, generates balanced weekly menus, flags dishes when an ingredient goes out of season, and produces one consolidated shopping list. Ships as a clickable desktop app.

## Two things to settle up front

**The MealFlow repo is Python/Flask.** It can't run or be extended inside this project, which builds JavaScript apps. What I'll do is reuse its concepts (recipe → ingredients → pantry → shopping list) and rebuild them here. When the app is working I can push the result to a branch on your `MealFlow` fork so everything lives in one place. Nothing in the existing repo gets overwritten.

**Windows, Linux and Android are not equal.** Windows and Linux are straightforward: I package the app with Electron and you get a file you double-click, with a real window and access to your recipes folder. Android is a different build system entirely and can't read a normal folder the same way — so I propose we do Windows + Linux first and treat Android as a later, separate step (recipes would be imported through a file picker there instead of a watched folder).

## How it works for you

1. Drop `.cook` files into a `recipes/` folder next to the app. On launch the app scans that folder, parses each recipe, and loads it into its library. Re-scan any time with a button.
2. A "Recipe template" screen shows the Cooklang format with an example you can copy, so new recipes are written correctly.
3. Pick the number of people and hit **Generate week**. You get 7 days (lunch + dinner, adjustable) chosen for balance and for what's in season this month in Europe.
4. Swap any single dish — pick from the library or let the app roll a random seasonal one. Everything else stays put.
5. The plan is saved and stays identical between visits. When the month rolls over, any dish using an out-of-season ingredient is outlined in the plan with the offending ingredient named, plus a "replace" prompt.
6. The shopping list adds up ingredients across the week, scaled to your headcount, grouped by aisle, with tick-off checkboxes.
7. Click a dish to open it in a built-in Cooklang reader: steps, timers, ingredient list per step — rendered from the original file.

## Balance and seasonality

- **Seasonal data**: a built-in table of European produce by month (roughly 80–120 common fruits and vegetables). Ingredient names in your recipes are matched against it; anything unmatched is treated as year-round (pasta, oil, spices). You can override any item's months in a settings screen.
- **Balance**: recipes get lightweight tags inferred from ingredients (protein type, grain/starch, vegetable-heavy). The generator avoids repeating the same protein two days running and spreads variety across the week. If your recipe set is small it relaxes the rules rather than failing.

## Build order

1. Cooklang parser + recipe folder scanning + recipe library screen
2. Cooklang reader view
3. European seasonality table + ingredient matching
4. Week generator, headcount scaling, swap/reroll, saved plan persistence
5. Out-of-season detection and replacement prompts
6. Shopping list with aisle grouping
7. Recipe template/help screen
8. Electron packaging → Windows `.zip` and Linux `.tar.gz` you can run

## Technical notes

- React + TypeScript UI, packaged with Electron (`@electron/packager`); `vite.config.ts` gets `base: './'` for `file://` loading.
- Electron main process reads `recipes/` from the app directory over IPC; renderer stays sandboxed (`contextIsolation: true`).
- Recipes parsed with `@cooklang/cooklang-ts`; parsed output cached, original file text kept for the reader.
- Plans, pantry state, list tick-offs and seasonality overrides persist in local storage on disk — no account, no server, works offline.
- Seasonality table as a versioned JSON data file so it's easy to correct.
- During development the app also runs in the preview here, using a bundled sample recipe set in place of the folder scan.
