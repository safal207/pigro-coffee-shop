# Pigro — cross-project UX/UI/backend audit (17 November 2026)

This is an engineering transfer audit based on **source code and repository documentation**. It is **not** an assertion that other cafés' demo backends are running in production. The objective is to improve Pigro while preserving its original sloth-on-branch brand and verified menu.

| Project | Source-backed strength | Pigro status after transfer | Deliberately out of scope |
|---|---|---|---|
| [Roby’s](https://github.com/safal207/robys-coffee-house-demo) | Smart Choice choice-to-counter, local event schema, transparent optional dessert, QA evidence contracts | 3-question taste finder with explicit product IDs, hard budget/temp constraints, local event names; existing dessert upsell | QR cashier handoff, PWA/service worker, paid receipts, claimed revenue lift |
| [Miora](https://github.com/safal207/miora-coffee) | Mobile photo-led feed, category navigation, several responsive WebP sizes, photo provenance | Feed view, picture-led cards, 15 individually cached local WebP image assets and original photo provenance note | Real owner-approved beverage photos and full responsive srcset matrix |
| [Riva Bella](https://github.com/safal207/riva-bella-revenue) | Atomic combo-validation functions and event tracking, contribution modelling | Atomic all-or-nothing bundles and local allowlisted anonymous UX events | Fictional revenue figures or menu migration |
| [Pocitel](https://github.com/safal207/pocitel-coffee-gazipasa) | Customer preference validation, secure owner-server proof of concept, owner economics and order reconciliation tests | Existing persisted favorites; intentional offline-only recommendations | Authentication, persistent shared customer profile, POS reconciliation, owner portal; needs protected backend |
| [Halk Büfe](https://github.com/safal207/halk-bufe-selinus) | Warm lighting and accessible product treatment, optional local POS CSV margin workbench, order QR | Restrained cafe palette and clear cart-to-barista flow | QR and paid POS receipts, invented metrics |
| [Sefa Beach](https://github.com/safal207/sefa-beach) | Wide catalog, pagination, local sales-lines template/dashboard | Pigro already supports pagination, catalog and basket | Finance dashboard without data |
| [Zenit Alanya](https://github.com/safal207/zenit-alanya-academy) | Quality-gated deployments and strong cross-browser regression strategy | GitHub Actions smoke / product rules / asset contract | Comprehensive Playwright device matrix and physical Safari/Android audit |
| [AI Café Network](https://github.com/safal207/ai-cafe-network) | Community/event funnel concept | Pigro Club stays explicitly *concept* | Event booking, fabricated loyalty points or impact metrics |

## Changes released

- **Product discovery:** three-step temperature/taste/budget guide, deterministic rule-based filtering only against real catalog item IDs, clear empty states, RU/TR/EN.
- **Visual experience:** independent feed view with large photo cards; grid/list remain; feed view persists locally.
- **Link sharing:** one product can be opened with \`?product=<catalog-id>\`; native Web Share API or clipboard fallback.
- **Cart reliability:** pairings now commit only if every catalog line is valid and quantities remain within safe limits; no partially applied bundles.
- **Anonymous UX evidence:** sessionStorage \`pigro.events.v1\` only, allowlisted event names; no names, phone numbers, full orders, precise geolocation or external analytics transmission. These are **not sales transactions**.
- **Performance:** 15 images moved from data URLs to cacheable \`assets/*.webp\`, reducing HTML weight from ~1,041 KB to ~79 KB (about 92%); original brand mark was preserved.
- **CI:** separate logic tests plus build-free HTML and JS syntax checks block the Pages deploy on failure.

## Backend: not yet running

GitHub Pages is static hosting. There is currently **no actual backend for customer orders, payment, inventory, push notifications, loyalty, owner dashboard, or POS integration**. A user-visible 'show to barista' summary is a customer draft, not an accepted or paid sale.

When cafe owners approve a production pilot, the smallest safe backend would have:

1. An owner-approved, versioned canonical catalog (price in integer kuruş, modifiers, allergy flags, availability, approved photography provenance), with auditable change history.
2. A server-validated cart/quote endpoint and idempotent order-draft tokens; never trust browser-only totals as price authority.
3. A staff confirmation step before changing an order to accepted; only POS-confirmed receipts become revenue data.
4. RBAC for staff/owner, HTTPS, credential vault, strict security headers, controlled audit logs and compliant retention under KVKK.
5. Consent-aware analytics \`menu_view → product_view → cart_add → order_draft → counter_confirmed → pos_paid\` and clear separation of anonymous UX events from paid sales.
6. A private owner dashboard joining actual POS lines and confirmed variable costs; contribution is not net profit.

## Owner verification needed before commercial use

Menu prices and product availability, actual brand/trademark rights, business address, allergen claims, original photos vs illustrative photos, order handoff method and legal text must be verified with Pigro's proprietor.

## QA gate

\`node tests/smoke.mjs && node --check experience-addon.js && node --test tests/experience.test.cjs\`

The tests validate deterministic rules, data integrity and static packaging, **not** human usability, accessibility certification, production revenue, physical devices or payment/POS integration.
