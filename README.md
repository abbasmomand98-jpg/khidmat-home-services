# Khidmat — Verified Home Services Finder

**One-line description:** A mobile-first web app where Pakistani users find ID-verified home-service pros (electricians, plumbers, AC technicians, geyser/heater service, carpenters, painters), see fixed upfront prices, book with a total shown before confirming, and check any mistri's quote against market rates with the Insaf Meter.

Live demo: https://abbasmomand98-jpg.github.io/khidmat-home-services/
Repo: https://github.com/abbasmomand98-jpg/khidmat-home-services

> ⚠️ After pushing to GitHub, set the **live demo URL above as the repo's website field** (repo Settings → website) — no repo ships without it.

## Features

- **Home** — winter-prep banner (seasonal: Oct → geyser/heater servicing rush), live search, city + area selector (Lahore, Karachi, Islamabad, Peshawar, Rawalpindi), and a 6-category service grid
- **Pro listing** — 13 realistic pros with verified badges, star ratings, completed-jobs counts, fixed visit fees in PKR, and distance in km; filter by service + city/area, sort by rating, price, or distance
- **Pro detail** — profile with ID-verified + skill-tested badges, bio, 2–3 realistic reviews (Urdu-flavored English), and a transparent price card (visit fee + fixed labour rates per job)
- **Booking flow** — pick a job → describe the problem → see the **upfront estimate** (visit fee + labour + parts) BEFORE confirming → pick a day/time slot → digital receipt with booking ID (`KH-2026-XXXX`)
- **Insaf Meter** — enter any quoted price; the app compares it with the standard market range and gives a verdict: Fair ✓ / Slightly high / Overpriced ✗ (with negotiation advice)
- **My bookings** — saved in localStorage with live status (Booked → On the way → Done), advance-status and cancel options
- Fully offline — no network calls, no frameworks, no build step

## Tech

Pure HTML, CSS, and vanilla JavaScript in five files:

| File | What it does |
|---|---|
| `index.html` | Page skeleton: header, seven views, bottom tab bar |
| `style.css` | Mobile-first styles (trust-blue accent, 480px app column, bottom tab bar) |
| `data.js` | All content: 6 services with market price ranges, 5 cities/areas, 13 pros, reviews |
| `logic.js` | Pure functions: PKR formatting, estimates, fair-price verdicts, filtering/sorting, slot generation, booking IDs — no DOM |
| `app.js` | UI layer: renders views and wires every button |
| `test.js` | Node smoke test for the pure logic (60+ assertions) |

## How to run locally

No build tools needed — the app is fully static:

```bash
# Option 1: just open the file
open index.html        # macOS
xdg-open index.html    # Linux

# Option 2: serve it (recommended, so localStorage behaves like production)
python3 -m http.server 8080
# then visit http://localhost:8080
```

To run the logic tests: `node test.js` (all assertions must pass).

## How it works

**Data model.** Everything lives in `data.js` as plain arrays. Each service carries its standard jobs with a market price AND a low/high fair range (e.g. Geyser servicing: ₨ 1,800, range 1,500–2,200). Each pro has a `priceAdjust` multiplier (0.9–1.15): their fixed job price = standard price × multiplier, rounded to the nearest ₨ 50 — so the same job costs a little more or less per pro, exactly like the real market.

**Upfront estimate.** `calcEstimate(visitFee, labourPrice, partsRaw)` returns `{ visitFee, labour, parts, total }` — the total the customer sees *before* hitting confirm. Parts input is optional (empty → 0); garbage input returns `null` so the UI can show one friendly error instead of a wrong number.

**Insaf Meter verdict bands.** `fairPriceVerdict(quote, low, high)` compares a mistri's quote with the market range: below `low` → "Suspiciously low"; inside the range → "Fair ✓"; up to 25% above `high` → "Slightly high" (with a negotiation target); beyond that → "Overpriced ✗" (advising the standard rate).

**Filtering & sorting.** `filterPros()` narrows by service, city, area, and free-text query (name, shop, area, service name). `sortPros()` returns a NEW sorted array (rating desc / visit-fee asc / distance asc) — the input is never mutated.

**Slot generation.** `genSlots(now)` offers today (only slots whose start hour hasn't passed), tomorrow, and the day after — four daily windows (9–11 AM, 11 AM–1 PM, 3–5 PM, 5–7 PM). The `now` date is injectable so tests get deterministic results.

**Persistence.** Bookings live in `localStorage` (`khidmat_bookings_v1`) — they survive reloads with zero backend. On load, entries are shape-validated so stale or corrupt data can't break rendering. Status advances Booked → On the way → Done via `nextStatus()`; cancelled bookings stay visible as a record.

**Safe rendering.** User-typed text (problem descriptions, search queries) passes through `escapeHTML()` before hitting the DOM, so input can never become executable markup.

## What you can learn from this project

- **Separation of concerns in vanilla JS:** data (`data.js`), pure logic (`logic.js`), and UI (`app.js`) — each testable and editable on its own
- **Writing testable code:** pure functions (same input → same output, no DOM) so a Node test suite can cover every boundary without a browser
- **Price-calculation logic:** estimates as data (`{ visitFee, labour, parts, total }`), multiplier-based per-pro pricing, and nearest-50 rounding like real quotes
- **Verdict/banding logic:** turning a numeric comparison into human-friendly verdicts with explicit boundary rules (the Insaf Meter pattern fits any "is this price fair?" problem)
- **localStorage persistence patterns:** load → validate → render, and save on every change; status machines (`nextStatus`) for order-like flows
- **Filtering + sorting without mutation:** chainable pure functions that return new arrays
- **Deterministic date logic:** inject `now` into time functions so tests never depend on the clock
- **Mobile-first layout:** a centered 480px app column with a fixed bottom tab bar

## Fork it and make it yours

This pattern — verified listings + transparent pricing + upfront estimate + fair-price checker — fits dozens of local problems: car mechanics, tailors, tutors, wedding vendors, dairy/doodh suppliers, property dealers. Fork the repo, swap the `SERVICES` and `PROS` arrays in `data.js` for your own market (keep the `low`/`high` ranges honest), adjust the verdict bands in `fairPriceVerdict()` if your trade works differently, and ship it for your community. 🚀
