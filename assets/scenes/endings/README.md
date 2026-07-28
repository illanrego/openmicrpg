# Ending illustrations

Ending art is **not layered and must not use Canvas composition or an art-recipe manifest**.

Each ending uses one finished, standalone illustration shared by every player avatar. Do not show the selected avatar directly. If a person is useful to the scene, use a generic shadow, silhouette, cropped figure, or no performer at all so the image works for every avatar.

## Required asset model

- One finished illustration for each class ending.
- One finished illustration for each pure-tone ending.
- One finished illustration for each special ending.
- Generic/default and almost endings may use a shared neutral fallback until their own finished art is supplied. Failure uses the dedicated `special/silencio.png` scene.
- Preferred delivery: square `1024×1024` PNG pixel art, authored as a complete scene.
- The ending UI displays the selected finished file directly. It must never merge base, character, tone, structure, lighting, or effect layers at runtime.

## Directory contract

```text
assets/scenes/endings/
  class/<classId>.png
  pure-tone/<toneId>.png
  special/<endingId>.png
  fallback.png
```

The content resolver owns the mapping from ending ID/category to a single image path. The archive stores that resolved image path (or stable ending-art ID), not a bitmap, data URL, Canvas recipe, or layer list.

## Delivered assets

- `class/`: 5 class-ending scenes
- `pure-tone/`: 6 pure-tone scenes
- `special/`: 5 special-ending scenes
- `fallback.png`: shared neutral scene for default, almost, and any unmapped route

All delivered PNGs are `1024×1024` and avatar-neutral.
