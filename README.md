# Pigro Coffee Shop · Gazipaşa

Independent mobile-first digital menu prototype for Pigro Coffee Shop in Gazipaşa, Türkiye.

**Status:** Concept / prototype pending owner approval. The sloth branch brand mark is adapted from the photographed menu. Drinks imagery is illustrative, not real product photography. Prices are transcribed from the menu photograph and should be confirmed.

## Features

- Mobile-first responsive coffee-shop design with cozy natural lighting and restrained colorful category accents.
- 66 menu positions priced in Turkish lira (₺), subject to review.
- TR / RU / EN interface; categories, search, and multiple menu view layouts.
- Favorites, product options, editable quantities, live order cart and local persistence.
- "Show to barista" generates an order summary; it does not transmit an order or charge payment.
- Core app uses standalone `index.html` plus `experience-addon.js` and `experience-addon.css`; 15 compressed cacheable WebP assets live under `assets/`. No npm dependencies or external image CDN are required.
- Three-step deterministic taste finder, visual photo feed, direct product links (`?product=<id>`), safe all-or-nothing combinations, and local-only anonymous UX events.

## Deployment

GitHub Pages workflow: `.github/workflows/pages.yml`.
Enable GitHub Pages source **GitHub Actions** under **Settings → Pages**.
Expected production URL: https://safal207.github.io/pigro-coffee-shop/

Run `node tests/smoke.mjs && node --check experience-addon.js && node --test tests/experience.test.cjs`. CI: `.github/workflows/check.yml`.

See `docs/cross-project-audit.md` for sourced comparisons, transfer limitations, and safe backend roadmap.

## Before commercial launch

Confirm item names, prices, ingredient availability, exact business location/contact links, and rights to the original logo with the café owners. Generated concept photographs should not be presented as photos of the actual served dishes or customer reviews. No online payment, POS, order delivery, account creation or real loyalty points are available yet.
