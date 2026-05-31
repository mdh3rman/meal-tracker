# Meal Tracker — Design Spec
_Date: 2026-05-31_

## Overview

A personal calorie and macro tracker installable as a PWA (Progressive Web App) from GitHub Pages. No server, no backend — all data lives on-device in IndexedDB. Designed for fast, low-friction daily meal logging on mobile.

---

## Core Concepts

- **Day view** is the primary screen, defaulting to today's date.
- A day contains 5 fixed meals: **Breakfast, Lunch, Snack, Dinner, Supper**.
- Each meal holds 0–N **food entries**. A food entry has:
  - `name` (required, string)
  - `calories` (required, number, kcal)
  - `carbs`, `protein`, `fat` (optional, number, grams)
- Users can navigate to any past or future day (no restrictions).
- **Daily goals** (calories + optional macro targets) are set once in a Goals screen and apply to every day.

---

## Pages (3 total)

### 1. Day View (default / home)
- **Date navigation**: ◀ [Date label] ▶ — arrows step one day, tapping the date label opens a calendar picker.
- **Summary header** (sticky): Calorie progress bar (consumed / target), then 3 macro bars (Carbs, Protein, Fat — each showing consumed/target grams). If no goals set, bars show consumed only.
- **Meal sections** (flat scroll, always visible):
  - Meals with food logged: full opacity, food items listed with name + calories + macros if present.
  - Empty meals: dimmed (opacity ~40%), "Add food to [Meal]" button still tappable.
  - Each meal shows its kcal subtotal.
- **Add food button** per meal — opens add food sheet.
- **Food entry actions**: tap a logged food item to edit it (re-opens the form pre-filled), swipe left (or long-press) to delete it.
- **Bottom nav**: Today | History | Goals.

### 2. History / Weekly Summary
- Default view: current week (Mon–Sun), showing each day's total kcal.
- Can navigate to previous/future weeks.
- Each day row shows: date label, total kcal, and macro totals if logged.
- Tap a day row to jump to that day's Day View.

### 3. Goals Settings
- Set daily calorie target (required to show progress bars as % filled).
- Set optional macro targets: Carbs (g), Protein (g), Fat (g).
- Saved to IndexedDB, applied globally to all days.

---

## Add Food Flow

Triggered by tapping "Add food to [Meal]". A **bottom sheet** slides up:

1. **Search bar** at the top (auto-focused). Shows ~500 bundled common foods immediately, filtered as user types.
2. If online: lazy-loads Open Food Facts API results below bundled results (no visual distinction between bundled and online results — no chips/tags).
3. Tapping a food result **pre-fills the form**: name, calories, and macros (if available in the database).
4. **Form fields**: Food name*, Calories (kcal)*, Carbs (g), Protein (g), Fat (g) — macros optional.
5. All fields editable after pre-fill.
6. **Confirm button** adds the entry to the meal and closes the sheet.
7. For manual entry: skip search, type name + calories directly.

Minimum taps to log a known food: **2** (tap result → tap confirm).

---

## Data Model (IndexedDB)

```
Store: "entries"
  key: [date, meal, id]   // e.g. ["2026-05-31", "breakfast", "uuid"]
  value: { id, date, meal, name, calories, carbs?, protein?, fat?, createdAt }

Store: "goals"
  key: "daily"
  value: { calories, carbs?, protein?, fat? }
```

Dates stored as `YYYY-MM-DD` strings. Meals stored as lowercase strings: `breakfast`, `lunch`, `snack`, `dinner`, `supper`.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Storage | IndexedDB via `idb` |
| PWA | `vite-plugin-pwa` (Workbox) |
| Food DB (bundled) | ~500 foods in a static JSON file |
| Food DB (online) | Open Food Facts API (`world.openfoodfacts.org`) |
| Date handling | `date-fns` |
| Deployment | GitHub Pages via GitHub Actions |

---

## PWA / Deployment

- Deployed to GitHub Pages; Vite `base` config set to the repo name (e.g. `/meal-tracker/`).
- Service worker caches the app shell for full offline use.
- Food search online portion gracefully degrades offline (shows bundled only).
- Manifest configured for standalone display, mobile icons, theme color matching app accent (#4f46e5).
- GitHub Actions workflow: on push to `main` → `vite build` → deploy to `gh-pages` branch.

---

## UI Design Decisions

- **Color accent**: Indigo (`#4f46e5`) for primary actions and the date nav bar.
- **Macro colors**: Carbs = amber, Protein = green, Fat = red (consistent throughout).
- Empty meals dimmed to ~40% opacity — present but visually subordinate.
- No modal overlays — bottom sheet only for add food, fits mobile thumb reach.
- No time-of-day on entries — just the meal category.

---

## Out of Scope (v1)

- User accounts / sync across devices
- Barcode scanner
- Custom meal names
- Meal templates / recurring entries
- Push notifications / reminders
- Export / import
