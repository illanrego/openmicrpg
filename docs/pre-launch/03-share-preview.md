# Pre-launch recommendation: share preview

## Goal

Make the public release link understandable when shared in a chat or social feed.

## Recommendation

Add page metadata in `index.html` for the official release:

- A concise Portuguese description of Open Mic RPG.
- `og:title`, `og:description`, and `og:image` tags.
- `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` tags.
- A canonical URL matching the deployed `CNAME`: `standupsim.sitedoillan.com.br`.

Use a stable existing game image or create a dedicated share card before launch. Keep the title and description focused on the playable 100-day comedy career and branching endings.

## Acceptance checks

- Metadata has no placeholder or beta wording.
- The image path resolves in the deployed site.
- Preview text names the game and explains the player goal in one glance.
