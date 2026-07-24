# Show result art

No runtime layering for show results. Each outcome is a finished image per avatar.

## Contract

- PNG, `1024x1024` (square)
- Pixel art matching the existing comedy-club look
- One full image per result × avatar pair
- 5 results × 6 avatars = **30 images**

## Result tiers (game labels)

| id | label | nota |
|----|-------|------|
| `deu-agua` | Deu água | 1 |
| `risinhos` | Risinhos | 2 |
| `segurou` | Segurou | 3 |
| `matou` | Matou | 4 |
| `explodiu` | Explodiu | 5 |

## Paths

```text
assets/scenes/results/
  avatar1/
    deu-agua.png
    risinhos.png
    segurou.png
    matou.png
    explodiu.png
  avatar2/
    deu-agua.png
    risinhos.png
    segurou.png
    matou.png
    explodiu.png
  avatar3/
    deu-agua.png
    risinhos.png
    segurou.png
    matou.png
    explodiu.png
  avatar4/
    deu-agua.png
    risinhos.png
    segurou.png
    matou.png
    explodiu.png
  avatar5/
    deu-agua.png
    risinhos.png
    segurou.png
    matou.png
    explodiu.png
  avatar6/
    deu-agua.png
    risinhos.png
    segurou.png
    matou.png
    explodiu.png
```

Lookup: `assets/scenes/results/<avatarId>/<resultId>.png`

The active full scenes in `assets/scenes/performance/` define the five result concepts and remain runtime fallbacks if a personalized image cannot load.

The files under `base/`, `examples/`, and `overlays/` are not runtime or visual references for this matrix.
