# Your recipes

Put your Cooklang recipe files (`.cook`) in this folder. The app reads every
`.cook` file here, pulls out the ingredients, and uses them for meal plans,
shopping lists and the built-in recipe reader.

## Template

```
>> title: Roast Chicken with Root Vegetables
>> servings: 4
>> tags: main, roast
>> time: 1 hour 20 minutes

Heat the #oven{} to 200C.

Rub @chicken{1.6%kg} with @olive oil{2%tbsp}, @salt{1%tsp} and @thyme{3%sprigs}.

Chop @carrot{4} and @parsnip{2} into chunks and scatter in the #roasting tin{}.

Roast for ~{70%minutes} until the juices run clear.
```

- `>> key: value` — recipe information. `title` and `servings` matter most.
- `@ingredient{amount%unit}` — an ingredient. Use `@olive oil{2%tbsp}` for
  multi-word names, `@salt` on its own for "a pinch of".
- `#cookware{}` — a pan, oven, bowl.
- `~{10%minutes}` or `~rest{10%minutes}` — a timer.
- A blank line starts a new step.
