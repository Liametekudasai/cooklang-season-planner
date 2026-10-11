<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The Android app is a Capacitor shell loading the hosted site (server.url), so server functions like the link import keep working; native file access goes through the bridge in src/lib/desktop.ts.
- Ingredient emoji matching lives in a browser-safe helper separate from recipe classification, with its display limit persisted by SettingsProvider, so language-independent presentation never changes planning or seasonality rules.
