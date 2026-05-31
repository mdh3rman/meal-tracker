# Meal Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PWA calorie + macro tracker with 5 meals/day, food search, daily goals, and history — deployed to GitHub Pages.

**Architecture:** React 18 + TypeScript SPA with Vite. All data lives in IndexedDB via `idb`. Three pages (DayView, History, Goals) managed by a single page state in App.tsx — no router library. PWA service worker caches the app shell for full offline use.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, `idb`, `vite-plugin-pwa`, `date-fns`, Vitest, `fake-indexeddb`

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold project**

```bash
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" — answer yes if prompted, or manually init.

- [ ] **Step 2: Install dependencies**

```bash
npm install idb date-fns
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa fake-indexeddb vitest @testing-library/react @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure Vite**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/meal-tracker/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['foods.json'],
      manifest: {
        name: 'Meal Tracker',
        short_name: 'Meals',
        description: 'Personal calorie and macro tracker',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/meal-tracker/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
  },
})
```

- [ ] **Step 4: Configure Tailwind**

Replace `tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Set up CSS**

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

- [ ] **Step 6: Set up test environment**

Create `src/test-setup.ts`:

```ts
import 'fake-indexeddb/auto'
```

- [ ] **Step 7: Update package.json scripts**

Add `"test": "vitest"` to the `scripts` section in `package.json`.

- [ ] **Step 8: Update index.html**

Replace `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta name="theme-color" content="#4f46e5" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <title>Meal Tracker</title>
    <link rel="icon" type="image/png" href="/meal-tracker/icon-192.png" />
    <link rel="apple-touch-icon" href="/meal-tracker/icon-192.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Verify scaffold builds**

```bash
npm run build
```

Expected: build completes in `dist/` with no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold React + Vite + Tailwind + PWA project"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types**

Create `src/types.ts`:

```ts
export type MealName = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper'

export const MEAL_NAMES: MealName[] = ['breakfast', 'lunch', 'snack', 'dinner', 'supper']

export const MEAL_LABELS: Record<MealName, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  snack: '🍎 Snack',
  dinner: '🌙 Dinner',
  supper: '🌜 Supper',
}

export interface FoodEntry {
  id: string
  date: string       // YYYY-MM-DD
  meal: MealName
  name: string
  calories: number
  carbs?: number
  protein?: number
  fat?: number
  createdAt: number
}

export interface Goals {
  calories: number
  carbs?: number
  protein?: number
  fat?: number
}

export interface FoodSuggestion {
  name: string
  calories: number
  carbs?: number
  protein?: number
  fat?: number
}

export type Page = 'day' | 'history' | 'goals'
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: IndexedDB Layer

**Files:**
- Create: `src/db/index.ts`, `src/db/index.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/db/index.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import {
  addEntry, getEntriesForDate, getEntriesForDateRange,
  updateEntry, deleteEntry, getGoals, saveGoals, closeDB,
} from './index'
import type { FoodEntry, Goals } from '../types'

const entry1: FoodEntry = {
  id: 'e1', date: '2026-05-31', meal: 'breakfast',
  name: 'Oats', calories: 389, carbs: 66, protein: 17, fat: 7, createdAt: 1000,
}
const entry2: FoodEntry = {
  id: 'e2', date: '2026-05-31', meal: 'lunch',
  name: 'Chicken', calories: 165, createdAt: 2000,
}
const entry3: FoodEntry = {
  id: 'e3', date: '2026-06-01', meal: 'breakfast',
  name: 'Banana', calories: 105, createdAt: 3000,
}

afterEach(async () => {
  await closeDB()
  indexedDB.deleteDatabase('meal-tracker')
})

describe('entries', () => {
  it('adds and retrieves entries for a date', async () => {
    await addEntry(entry1)
    await addEntry(entry2)
    await addEntry(entry3)
    const results = await getEntriesForDate('2026-05-31')
    expect(results).toHaveLength(2)
    expect(results.map(e => e.id)).toContain('e1')
    expect(results.map(e => e.id)).toContain('e2')
  })

  it('updates an entry', async () => {
    await addEntry(entry1)
    await updateEntry({ ...entry1, calories: 400 })
    const results = await getEntriesForDate('2026-05-31')
    expect(results[0].calories).toBe(400)
  })

  it('deletes an entry', async () => {
    await addEntry(entry1)
    await deleteEntry('e1')
    const results = await getEntriesForDate('2026-05-31')
    expect(results).toHaveLength(0)
  })

  it('retrieves entries for a date range', async () => {
    await addEntry(entry1)
    await addEntry(entry3)
    const results = await getEntriesForDateRange('2026-05-31', '2026-06-01')
    expect(results).toHaveLength(2)
  })
})

describe('goals', () => {
  it('returns undefined when no goals set', async () => {
    expect(await getGoals()).toBeUndefined()
  })

  it('saves and retrieves goals', async () => {
    const goals: Goals = { calories: 2000, carbs: 180, protein: 150, fat: 65 }
    await saveGoals(goals)
    expect(await getGoals()).toEqual(goals)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --run src/db/index.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the DB layer**

Create `src/db/index.ts`:

```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { FoodEntry, Goals } from '../types'

interface MealTrackerDB extends DBSchema {
  entries: {
    key: string
    value: FoodEntry
    indexes: { 'by-date': string }
  }
  goals: {
    key: string
    value: Goals
  }
}

let _db: IDBPDatabase<MealTrackerDB> | null = null

async function getDB(): Promise<IDBPDatabase<MealTrackerDB>> {
  if (_db) return _db
  _db = await openDB<MealTrackerDB>('meal-tracker', 1, {
    upgrade(db) {
      const store = db.createObjectStore('entries', { keyPath: 'id' })
      store.createIndex('by-date', 'date')
      db.createObjectStore('goals')
    },
  })
  return _db
}

export async function closeDB(): Promise<void> {
  if (_db) { _db.close(); _db = null }
}

export async function addEntry(entry: FoodEntry): Promise<void> {
  const db = await getDB()
  await db.put('entries', entry)
}

export async function updateEntry(entry: FoodEntry): Promise<void> {
  const db = await getDB()
  await db.put('entries', entry)
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('entries', id)
}

export async function getEntriesForDate(date: string): Promise<FoodEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex('entries', 'by-date', date)
}

export async function getEntriesForDateRange(start: string, end: string): Promise<FoodEntry[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(start, end)
  return db.getAllFromIndex('entries', 'by-date', range)
}

export async function getGoals(): Promise<Goals | undefined> {
  const db = await getDB()
  return db.get('goals', 'daily')
}

export async function saveGoals(goals: Goals): Promise<void> {
  const db = await getDB()
  await db.put('goals', goals, 'daily')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --run src/db/index.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/
git commit -m "feat: add IndexedDB layer with CRUD for entries and goals"
```

---

## Task 4: Custom Hooks

**Files:**
- Create: `src/hooks/useEntries.ts`, `src/hooks/useGoals.ts`, `src/hooks/useDate.ts`
- Create: `src/hooks/useEntries.test.ts`, `src/hooks/useGoals.test.ts`

- [ ] **Step 1: Write failing tests for useEntries**

Create `src/hooks/useEntries.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEntries } from './useEntries'
import { closeDB } from '../db'

afterEach(async () => {
  await closeDB()
  indexedDB.deleteDatabase('meal-tracker')
})

describe('useEntries', () => {
  it('starts with empty entries', async () => {
    const { result } = renderHook(() => useEntries('2026-05-31'))
    // wait for initial load
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    expect(result.current.entries).toEqual([])
  })

  it('adds an entry and reflects in entries', async () => {
    const { result } = renderHook(() => useEntries('2026-05-31'))
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    await act(async () => {
      await result.current.add('breakfast', { name: 'Oats', calories: 389, carbs: 66, protein: 17, fat: 7 })
    })
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].name).toBe('Oats')
    expect(result.current.entries[0].meal).toBe('breakfast')
    expect(result.current.entries[0].date).toBe('2026-05-31')
  })

  it('removes an entry', async () => {
    const { result } = renderHook(() => useEntries('2026-05-31'))
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    await act(async () => {
      await result.current.add('lunch', { name: 'Rice', calories: 130 })
    })
    const id = result.current.entries[0].id
    await act(async () => { await result.current.remove(id) })
    expect(result.current.entries).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Write failing tests for useGoals**

Create `src/hooks/useGoals.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGoals } from './useGoals'
import { closeDB } from '../db'

afterEach(async () => {
  await closeDB()
  indexedDB.deleteDatabase('meal-tracker')
})

describe('useGoals', () => {
  it('starts with null goals', async () => {
    const { result } = renderHook(() => useGoals())
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    expect(result.current.goals).toBeNull()
  })

  it('saves and reads goals', async () => {
    const { result } = renderHook(() => useGoals())
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    await act(async () => {
      await result.current.save({ calories: 2000, protein: 150 })
    })
    expect(result.current.goals?.calories).toBe(2000)
    expect(result.current.goals?.protein).toBe(150)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- --run src/hooks/
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement useEntries**

Create `src/hooks/useEntries.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import { addEntry, deleteEntry, getEntriesForDate, updateEntry } from '../db'
import type { FoodEntry, MealName } from '../types'

type NewFood = Omit<FoodEntry, 'id' | 'date' | 'meal' | 'createdAt'>

export function useEntries(date: string) {
  const [entries, setEntries] = useState<FoodEntry[]>([])

  const load = useCallback(async () => {
    const data = await getEntriesForDate(date)
    setEntries(data)
  }, [date])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (meal: MealName, food: NewFood) => {
    const entry: FoodEntry = {
      ...food,
      id: crypto.randomUUID(),
      date,
      meal,
      createdAt: Date.now(),
    }
    await addEntry(entry)
    await load()
  }, [date, load])

  const update = useCallback(async (entry: FoodEntry) => {
    await updateEntry(entry)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteEntry(id)
    await load()
  }, [load])

  return { entries, add, update, remove }
}
```

- [ ] **Step 5: Implement useGoals**

Create `src/hooks/useGoals.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import { getGoals, saveGoals } from '../db'
import type { Goals } from '../types'

export function useGoals() {
  const [goals, setGoals] = useState<Goals | null>(null)

  const load = useCallback(async () => {
    const g = await getGoals()
    setGoals(g ?? null)
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (goals: Goals) => {
    await saveGoals(goals)
    await load()
  }, [load])

  return { goals, save }
}
```

- [ ] **Step 6: Implement useDate**

Create `src/hooks/useDate.ts`:

```ts
import { useState } from 'react'
import { format, addDays, subDays } from 'date-fns'

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function useDate() {
  const [date, setDate] = useState<string>(todayStr)

  const goBack = () => setDate(d => format(subDays(new Date(d + 'T00:00:00'), 1), 'yyyy-MM-dd'))
  const goForward = () => setDate(d => format(addDays(new Date(d + 'T00:00:00'), 1), 'yyyy-MM-dd'))
  const goToday = () => setDate(todayStr())

  return { date, setDate, goBack, goForward, goToday }
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npm test -- --run src/hooks/
```

Expected: all 5 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useEntries, useGoals, useDate hooks"
```

---

## Task 5: Bundled Foods Data

**Files:**
- Create: `public/foods.json`

- [ ] **Step 1: Create the bundled foods JSON**

Create `public/foods.json`:

```json
[
  {"name":"Oats (100g)","calories":389,"carbs":66,"protein":17,"fat":7},
  {"name":"Banana (medium)","calories":105,"carbs":27,"protein":1,"fat":0},
  {"name":"Apple (medium)","calories":95,"carbs":25,"protein":0.5,"fat":0.3},
  {"name":"Orange (medium)","calories":62,"carbs":15,"protein":1.2,"fat":0.2},
  {"name":"Strawberries (100g)","calories":32,"carbs":7.7,"protein":0.7,"fat":0.3},
  {"name":"Blueberries (100g)","calories":57,"carbs":14,"protein":0.7,"fat":0.3},
  {"name":"Watermelon (100g)","calories":30,"carbs":7.6,"protein":0.6,"fat":0.2},
  {"name":"Avocado (half)","calories":114,"carbs":6,"protein":1.3,"fat":10.5},
  {"name":"Chicken breast (100g)","calories":165,"carbs":0,"protein":31,"fat":3.6},
  {"name":"Turkey breast (100g)","calories":135,"carbs":0,"protein":30,"fat":1},
  {"name":"Beef, ground 80/20 (100g)","calories":254,"carbs":0,"protein":17,"fat":20},
  {"name":"Pork chop (100g)","calories":231,"carbs":0,"protein":25,"fat":14},
  {"name":"Lamb chop (100g)","calories":282,"carbs":0,"protein":19,"fat":23},
  {"name":"Salmon (100g)","calories":208,"carbs":0,"protein":20,"fat":13},
  {"name":"Tuna, canned in water (100g)","calories":116,"carbs":0,"protein":25,"fat":1},
  {"name":"Tuna, canned in oil (100g)","calories":198,"carbs":0,"protein":29,"fat":9},
  {"name":"Shrimp (100g)","calories":99,"carbs":0.2,"protein":24,"fat":0.3},
  {"name":"Egg (large)","calories":78,"carbs":0.6,"protein":6,"fat":5},
  {"name":"Scrambled eggs (2 eggs)","calories":166,"carbs":1.6,"protein":11,"fat":12},
  {"name":"Bacon (2 strips)","calories":87,"carbs":0.1,"protein":6,"fat":6.8},
  {"name":"Ham (28g)","calories":37,"carbs":0.3,"protein":5.5,"fat":1.4},
  {"name":"Sausage, pork (100g)","calories":301,"carbs":0,"protein":11,"fat":27},
  {"name":"White rice, cooked (100g)","calories":130,"carbs":28,"protein":2.7,"fat":0.3},
  {"name":"Brown rice, cooked (100g)","calories":116,"carbs":22,"protein":2.6,"fat":0.9},
  {"name":"Pasta, cooked (100g)","calories":158,"carbs":31,"protein":6,"fat":0.9},
  {"name":"Quinoa, cooked (100g)","calories":120,"carbs":21,"protein":4.4,"fat":1.9},
  {"name":"Bread, white (1 slice)","calories":67,"carbs":12.5,"protein":2,"fat":0.8},
  {"name":"Bread, whole wheat (1 slice)","calories":69,"carbs":11.6,"protein":3.6,"fat":1},
  {"name":"Bagel, plain","calories":270,"carbs":53,"protein":10,"fat":1.1},
  {"name":"Pita bread (57g)","calories":165,"carbs":33,"protein":5.5,"fat":1},
  {"name":"Corn tortilla (28g)","calories":58,"carbs":12,"protein":1.5,"fat":0.7},
  {"name":"Flour tortilla (45g)","calories":146,"carbs":26,"protein":3.9,"fat":3.2},
  {"name":"Croissant","calories":231,"carbs":26,"protein":4.7,"fat":12},
  {"name":"Pancake (1 medium)","calories":86,"carbs":15,"protein":2.6,"fat":1.6},
  {"name":"Waffle (1 large)","calories":218,"carbs":30,"protein":5.3,"fat":8.5},
  {"name":"Granola (100g)","calories":471,"carbs":64,"protein":12,"fat":20},
  {"name":"Muesli (100g)","calories":363,"carbs":66,"protein":11,"fat":6.5},
  {"name":"Cereal, cornflakes (30g)","calories":114,"carbs":25,"protein":2,"fat":0.1},
  {"name":"Whole milk (240ml)","calories":149,"carbs":12,"protein":8,"fat":8},
  {"name":"Milk, 2% (240ml)","calories":122,"carbs":12,"protein":8,"fat":4.8},
  {"name":"Greek yogurt, plain (100g)","calories":59,"carbs":3.6,"protein":10,"fat":0.4},
  {"name":"Greek yogurt, 0% (100g)","calories":56,"carbs":3.6,"protein":10,"fat":0.4},
  {"name":"Cottage cheese (100g)","calories":98,"carbs":3.4,"protein":11,"fat":4.3},
  {"name":"Cheddar cheese (28g)","calories":114,"carbs":0.4,"protein":7,"fat":9.4},
  {"name":"Butter (10g)","calories":72,"carbs":0,"protein":0,"fat":8.1},
  {"name":"Olive oil (15ml)","calories":119,"carbs":0,"protein":0,"fat":14},
  {"name":"Mayonnaise (1 tbsp)","calories":94,"carbs":0.1,"protein":0.1,"fat":10},
  {"name":"Peanut butter (2 tbsp)","calories":188,"carbs":6,"protein":8,"fat":16},
  {"name":"Hummus (2 tbsp)","calories":70,"carbs":6,"protein":2,"fat":5},
  {"name":"Honey (1 tbsp)","calories":64,"carbs":17,"protein":0,"fat":0},
  {"name":"Sugar (1 tsp)","calories":16,"carbs":4,"protein":0,"fat":0},
  {"name":"Potato, boiled (100g)","calories":87,"carbs":20,"protein":1.9,"fat":0.1},
  {"name":"Sweet potato (100g)","calories":86,"carbs":20,"protein":1.6,"fat":0.1},
  {"name":"Broccoli (100g)","calories":34,"carbs":7,"protein":2.8,"fat":0.4},
  {"name":"Spinach (100g)","calories":23,"carbs":3.6,"protein":2.9,"fat":0.4},
  {"name":"Kale (100g)","calories":49,"carbs":8.8,"protein":4.3,"fat":0.9},
  {"name":"Carrot (100g)","calories":41,"carbs":9.6,"protein":0.9,"fat":0.2},
  {"name":"Tomato (medium)","calories":22,"carbs":4.8,"protein":1.1,"fat":0.2},
  {"name":"Cucumber (100g)","calories":16,"carbs":3.6,"protein":0.7,"fat":0.1},
  {"name":"Bell pepper (100g)","calories":31,"carbs":6,"protein":1,"fat":0.3},
  {"name":"Mushrooms (100g)","calories":22,"carbs":3.3,"protein":3.1,"fat":0.3},
  {"name":"Onion (100g)","calories":40,"carbs":9.3,"protein":1.1,"fat":0.1},
  {"name":"Lentils, cooked (100g)","calories":116,"carbs":20,"protein":9,"fat":0.4},
  {"name":"Chickpeas, cooked (100g)","calories":164,"carbs":27,"protein":8.9,"fat":2.6},
  {"name":"Black beans, cooked (100g)","calories":132,"carbs":24,"protein":8.9,"fat":0.5},
  {"name":"Edamame (100g)","calories":122,"carbs":9.9,"protein":11,"fat":5.2},
  {"name":"Tofu (100g)","calories":76,"carbs":1.9,"protein":8,"fat":4.8},
  {"name":"Almonds (28g)","calories":164,"carbs":6,"protein":6,"fat":14},
  {"name":"Walnuts (28g)","calories":185,"carbs":3.9,"protein":4.3,"fat":18.5},
  {"name":"Cashews (28g)","calories":157,"carbs":9.4,"protein":5.2,"fat":12.4},
  {"name":"Pumpkin seeds (28g)","calories":151,"carbs":5,"protein":7,"fat":13},
  {"name":"Protein shake (30g powder)","calories":120,"carbs":3,"protein":24,"fat":1.5},
  {"name":"Orange juice (240ml)","calories":112,"carbs":26,"protein":1.7,"fat":0.5},
  {"name":"Coffee, black (240ml)","calories":2,"carbs":0,"protein":0,"fat":0},
  {"name":"Coffee with milk (240ml)","calories":30,"carbs":4,"protein":1.5,"fat":1},
  {"name":"Coca-Cola (355ml)","calories":140,"carbs":39,"protein":0,"fat":0},
  {"name":"Beer (355ml)","calories":153,"carbs":12.6,"protein":1.6,"fat":0},
  {"name":"Wine, red (150ml)","calories":125,"carbs":3.8,"protein":0.1,"fat":0},
  {"name":"Pizza, cheese (1 slice)","calories":285,"carbs":36,"protein":12,"fat":10},
  {"name":"Hamburger (medium)","calories":300,"carbs":30,"protein":15,"fat":12},
  {"name":"Potato chips (28g)","calories":149,"carbs":15,"protein":2,"fat":9.5},
  {"name":"Popcorn (28g)","calories":106,"carbs":21,"protein":3.3,"fat":1.2},
  {"name":"Ice cream (100g)","calories":207,"carbs":24,"protein":3.5,"fat":11},
  {"name":"Chocolate, dark 70% (30g)","calories":170,"carbs":13,"protein":2.5,"fat":12},
  {"name":"Cookie, chocolate chip","calories":78,"carbs":10.5,"protein":0.9,"fat":3.7},
  {"name":"Muffin, blueberry","calories":158,"carbs":27,"protein":2.8,"fat":3.7}
]
```

- [ ] **Step 2: Commit**

```bash
git add public/foods.json
git commit -m "feat: add bundled common foods database"
```

---

## Task 6: Open Food Facts API Client

**Files:**
- Create: `src/lib/openfoodfacts.ts`, `src/lib/openfoodfacts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/openfoodfacts.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { searchOnline } from './openfoodfacts'

beforeEach(() => { vi.restoreAllMocks() })

describe('searchOnline', () => {
  it('returns mapped food suggestions from API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            product_name: 'Chicken Fillet',
            nutriments: {
              'energy-kcal_100g': 165,
              carbohydrates_100g: 0,
              proteins_100g: 31,
              fat_100g: 3.6,
            },
          },
          {
            product_name: '',       // should be filtered out
            nutriments: {},
          },
          {
            product_name: 'Oat Bar',
            nutriments: { 'energy-kcal_100g': 420 },
          },
        ],
      }),
    }))

    const results = await searchOnline('chicken')
    expect(results).toHaveLength(2)
    expect(results[0].name).toBe('Chicken Fillet')
    expect(results[0].calories).toBe(165)
    expect(results[0].protein).toBe(31)
    expect(results[1].name).toBe('Oat Bar')
    expect(results[1].carbs).toBeUndefined()
  })

  it('returns empty array on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const results = await searchOnline('anything')
    expect(results).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/lib/openfoodfacts.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

Create `src/lib/openfoodfacts.ts`:

```ts
import type { FoodSuggestion } from '../types'

interface OFFProduct {
  product_name?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    carbohydrates_100g?: number
    proteins_100g?: number
    fat_100g?: number
  }
}

interface OFFResponse {
  products: OFFProduct[]
}

export async function searchOnline(query: string): Promise<FoodSuggestion[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms=${encodeURIComponent(query)}&json=1&page_size=20&fields=product_name,nutriments`
    const res = await fetch(url)
    if (!res.ok) return []
    const data: OFFResponse = await res.json()
    return data.products
      .filter(p => p.product_name && p.product_name.trim().length > 0)
      .map(p => {
        const n = p.nutriments ?? {}
        const kcal = n['energy-kcal_100g']
        if (!kcal) return null
        return {
          name: p.product_name!.trim(),
          calories: Math.round(kcal),
          carbs: n.carbohydrates_100g != null ? Math.round(n.carbohydrates_100g * 10) / 10 : undefined,
          protein: n.proteins_100g != null ? Math.round(n.proteins_100g * 10) / 10 : undefined,
          fat: n.fat_100g != null ? Math.round(n.fat_100g * 10) / 10 : undefined,
        } satisfies FoodSuggestion
      })
      .filter((s): s is FoodSuggestion => s !== null)
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/lib/openfoodfacts.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add Open Food Facts API client"
```

---

## Task 7: ProgressBar + BottomNav Components

**Files:**
- Create: `src/components/ProgressBar.tsx`, `src/components/BottomNav.tsx`

- [ ] **Step 1: Create ProgressBar**

Create `src/components/ProgressBar.tsx`:

```tsx
interface Props {
  value: number
  max: number
  color: string      // Tailwind bg color class, e.g. 'bg-indigo-600'
  trackColor: string // Tailwind bg color class, e.g. 'bg-indigo-200'
  height?: string    // Tailwind h- class, default 'h-2'
}

export function ProgressBar({ value, max, color, trackColor, height = 'h-2' }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = max > 0 && value > max
  return (
    <div className={`w-full ${trackColor} rounded-full ${height}`}>
      <div
        className={`${over ? 'bg-red-500' : color} rounded-full ${height} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create BottomNav**

Create `src/components/BottomNav.tsx`:

```tsx
import type { Page } from '../types'

interface Props {
  current: Page
  onChange: (page: Page) => void
}

const items: { page: Page; label: string; icon: string }[] = [
  { page: 'day', label: 'Today', icon: '📋' },
  { page: 'history', label: 'History', icon: '📊' },
  { page: 'goals', label: 'Goals', icon: '⚙️' },
]

export function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 pb-safe z-10">
      {items.map(({ page, label, icon }) => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`flex flex-col items-center text-xs gap-0.5 px-4 py-1 ${
            current === page ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/BottomNav.tsx
git commit -m "feat: add ProgressBar and BottomNav components"
```

---

## Task 8: DateNav Component

**Files:**
- Create: `src/components/DateNav.tsx`

- [ ] **Step 1: Create DateNav**

Create `src/components/DateNav.tsx`:

```tsx
import { format, isToday, parseISO } from 'date-fns'

interface Props {
  date: string                      // YYYY-MM-DD
  onBack: () => void
  onForward: () => void
  onDateChange: (date: string) => void
}

export function DateNav({ date, onBack, onForward, onDateChange }: Props) {
  const parsed = parseISO(date)
  const label = isToday(parsed) ? 'Today' : format(parsed, 'EEE, MMM d')

  return (
    <div className="bg-indigo-600 text-white flex items-center justify-between px-4 py-3">
      <button onClick={onBack} className="text-2xl leading-none px-1 active:opacity-60">
        ‹
      </button>
      <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer select-none">
        <span>📅 {label}</span>
        <input
          type="date"
          value={date}
          onChange={e => e.target.value && onDateChange(e.target.value)}
          className="absolute opacity-0 w-0 h-0"
          aria-label="Pick a date"
        />
      </label>
      <button onClick={onForward} className="text-2xl leading-none px-1 active:opacity-60">
        ›
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DateNav.tsx
git commit -m "feat: add DateNav component"
```

---

## Task 9: SummaryHeader Component

**Files:**
- Create: `src/components/SummaryHeader.tsx`

- [ ] **Step 1: Create SummaryHeader**

Create `src/components/SummaryHeader.tsx`:

```tsx
import { ProgressBar } from './ProgressBar'
import type { FoodEntry, Goals } from '../types'

interface Props {
  entries: FoodEntry[]
  goals: Goals | null
}

function sum(entries: FoodEntry[], field: keyof FoodEntry): number {
  return entries.reduce((acc, e) => acc + ((e[field] as number | undefined) ?? 0), 0)
}

export function SummaryHeader({ entries, goals }: Props) {
  const totalCal = sum(entries, 'calories')
  const totalCarbs = sum(entries, 'carbs')
  const totalProtein = sum(entries, 'protein')
  const totalFat = sum(entries, 'fat')

  return (
    <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-3 space-y-2">
      {/* Calories */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-bold text-indigo-700">Calories</span>
          <span className="text-gray-700">
            <strong>{Math.round(totalCal)}</strong>
            {goals ? ` / ${goals.calories} kcal` : ' kcal'}
          </span>
        </div>
        <ProgressBar value={totalCal} max={goals?.calories ?? 0} color="bg-indigo-600" trackColor="bg-indigo-200" />
      </div>

      {/* Macros row */}
      <div className="grid grid-cols-3 gap-2">
        <MacroBar label="Carbs" value={totalCarbs} target={goals?.carbs} color="bg-amber-400" trackColor="bg-amber-100" textColor="text-amber-600" />
        <MacroBar label="Protein" value={totalProtein} target={goals?.protein} color="bg-emerald-500" trackColor="bg-emerald-100" textColor="text-emerald-700" />
        <MacroBar label="Fat" value={totalFat} target={goals?.fat} color="bg-red-400" trackColor="bg-red-100" textColor="text-red-600" />
      </div>
    </div>
  )
}

interface MacroBarProps {
  label: string
  value: number
  target?: number
  color: string
  trackColor: string
  textColor: string
}

function MacroBar({ label, value, target, color, trackColor, textColor }: MacroBarProps) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-bold ${textColor}`}>{label}</span>
        <span className="text-gray-500">
          {Math.round(value * 10) / 10}{target ? `/${target}g` : 'g'}
        </span>
      </div>
      <ProgressBar value={value} max={target ?? 0} color={color} trackColor={trackColor} height="h-1.5" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SummaryHeader.tsx
git commit -m "feat: add SummaryHeader with calorie and macro progress bars"
```

---

## Task 10: FoodItem + MealSection Components

**Files:**
- Create: `src/components/FoodItem.tsx`, `src/components/MealSection.tsx`

- [ ] **Step 1: Create FoodItem**

Create `src/components/FoodItem.tsx`:

```tsx
import { useState } from 'react'
import type { FoodEntry } from '../types'

interface Props {
  entry: FoodEntry
  onEdit: (entry: FoodEntry) => void
  onDelete: (id: string) => void
}

export function FoodItem({ entry, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-1">
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full flex justify-between items-center px-3 py-2 text-left"
      >
        <span className="text-sm font-medium text-gray-900 truncate">{entry.name}</span>
        <span className="text-xs text-gray-500 ml-2 shrink-0">
          {Math.round(entry.calories)} kcal
          {entry.carbs != null ? ` · C:${entry.carbs}g` : ''}
          {entry.protein != null ? ` P:${entry.protein}g` : ''}
          {entry.fat != null ? ` F:${entry.fat}g` : ''}
        </span>
      </button>
      {expanded && (
        <div className="flex gap-2 px-3 pb-2">
          <button
            onClick={() => { setExpanded(false); onEdit(entry) }}
            className="flex-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md py-1.5"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md py-1.5"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create MealSection**

Create `src/components/MealSection.tsx`:

```tsx
import { FoodItem } from './FoodItem'
import type { FoodEntry, MealName, Goals } from '../types'
import { MEAL_LABELS } from '../types'

interface Props {
  meal: MealName
  entries: FoodEntry[]
  goals: Goals | null
  onAddFood: (meal: MealName) => void
  onEdit: (entry: FoodEntry) => void
  onDelete: (id: string) => void
}

export function MealSection({ meal, entries, onAddFood, onEdit, onDelete }: Props) {
  const mealEntries = entries.filter(e => e.meal === meal)
  const total = mealEntries.reduce((acc, e) => acc + e.calories, 0)
  const isEmpty = mealEntries.length === 0

  return (
    <div className={isEmpty ? 'opacity-40' : ''}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-bold text-gray-800 text-sm">{MEAL_LABELS[meal]}</span>
        {isEmpty
          ? <span className="text-gray-400 text-xs">—</span>
          : <span className="text-indigo-600 font-semibold text-xs">{Math.round(total)} kcal</span>
        }
      </div>
      {mealEntries.map(entry => (
        <FoodItem key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
      ))}
      <button
        onClick={() => onAddFood(meal)}
        className={`w-full text-xs border rounded-lg py-1.5 mb-3 ${
          isEmpty
            ? 'border-dashed border-gray-300 text-gray-400'
            : 'border-dashed border-indigo-300 text-indigo-600'
        }`}
      >
        + Add food to {MEAL_LABELS[meal].split(' ')[1]}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FoodItem.tsx src/components/MealSection.tsx
git commit -m "feat: add FoodItem and MealSection components"
```

---

## Task 11: AddFoodSheet Component

**Files:**
- Create: `src/components/AddFoodSheet.tsx`

- [ ] **Step 1: Create AddFoodSheet**

Create `src/components/AddFoodSheet.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import type { FoodEntry, FoodSuggestion, MealName } from '../types'
import { MEAL_LABELS } from '../types'
import { searchOnline } from '../lib/openfoodfacts'

interface Props {
  meal: MealName
  editEntry?: FoodEntry        // set when editing an existing entry
  onConfirm: (food: Omit<FoodEntry, 'id' | 'date' | 'meal' | 'createdAt'>) => void
  onClose: () => void
}

interface FormState {
  name: string
  calories: string
  carbs: string
  protein: string
  fat: string
}

function emptyForm(): FormState {
  return { name: '', calories: '', carbs: '', protein: '', fat: '' }
}

function entryToForm(e: FoodEntry): FormState {
  return {
    name: e.name,
    calories: String(e.calories),
    carbs: e.carbs != null ? String(e.carbs) : '',
    protein: e.protein != null ? String(e.protein) : '',
    fat: e.fat != null ? String(e.fat) : '',
  }
}

function suggestionToForm(s: FoodSuggestion): FormState {
  return {
    name: s.name,
    calories: String(s.calories),
    carbs: s.carbs != null ? String(s.carbs) : '',
    protein: s.protein != null ? String(s.protein) : '',
    fat: s.fat != null ? String(s.fat) : '',
  }
}

export function AddFoodSheet({ meal, editEntry, onConfirm, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [bundled, setBundled] = useState<FoodSuggestion[]>([])
  const [online, setOnline] = useState<FoodSuggestion[]>([])
  const [loadingOnline, setLoadingOnline] = useState(false)
  const [form, setForm] = useState<FormState>(() => editEntry ? entryToForm(editEntry) : emptyForm())
  const [showForm, setShowForm] = useState(!!editEntry)
  const searchRef = useRef<HTMLInputElement>(null)
  const onlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load bundled foods on mount
  useEffect(() => {
    fetch('/meal-tracker/foods.json')
      .then(r => r.json())
      .then((foods: FoodSuggestion[]) => setBundled(foods))
      .catch(() => {})
    if (!editEntry) searchRef.current?.focus()
  }, [editEntry])

  // Filter bundled foods and lazy-load online
  useEffect(() => {
    if (onlineTimer.current) clearTimeout(onlineTimer.current)
    setOnline([])
    if (query.trim().length < 2) return

    onlineTimer.current = setTimeout(async () => {
      setLoadingOnline(true)
      const results = await searchOnline(query.trim())
      setOnline(results)
      setLoadingOnline(false)
    }, 600)

    return () => { if (onlineTimer.current) clearTimeout(onlineTimer.current) }
  }, [query])

  const filteredBundled = query.trim().length >= 1
    ? bundled.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : bundled.slice(0, 20)

  function pickSuggestion(s: FoodSuggestion) {
    setForm(suggestionToForm(s))
    setShowForm(true)
    setQuery('')
  }

  function handleField(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleConfirm() {
    if (!form.name.trim() || !form.calories) return
    const calories = parseFloat(form.calories)
    if (isNaN(calories) || calories <= 0) return
    const parse = (v: string) => { const n = parseFloat(v); return isNaN(n) ? undefined : n }
    onConfirm({
      name: form.name.trim(),
      calories,
      carbs: parse(form.carbs),
      protein: parse(form.protein),
      fat: parse(form.fat),
    })
  }

  const suggestions = [
    ...filteredBundled,
    ...online.filter(o => !filteredBundled.some(b => b.name.toLowerCase() === o.name.toLowerCase())),
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-20" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-2 font-bold text-gray-900 text-sm border-b border-gray-100">
          {editEntry ? 'Edit food' : `Add food to ${MEAL_LABELS[meal].split(' ')[1]}`}
        </div>

        {!showForm ? (
          <>
            {/* Search bar */}
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <span className="text-gray-400">🔍</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search food or type manually…"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-gray-400 text-xs">✕</button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => pickSuggestion(s)}
                  className="w-full flex justify-between items-center px-4 py-2.5 border-b border-gray-50 text-left active:bg-indigo-50"
                >
                  <span className="text-sm text-gray-900">{s.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{s.calories} kcal</span>
                </button>
              ))}
              {loadingOnline && (
                <div className="text-xs text-center text-gray-400 py-2">Searching online…</div>
              )}
              <button
                onClick={() => setShowForm(true)}
                className="w-full px-4 py-3 text-sm text-indigo-600 font-medium text-center border-t border-gray-100"
              >
                Enter manually →
              </button>
            </div>
          </>
        ) : (
          /* Form */
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Food name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => handleField('name', e.target.value)}
                placeholder="e.g. Chicken breast"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Calories (kcal) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={form.calories}
                onChange={e => handleField('calories', e.target.value)}
                placeholder="e.g. 165"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Macros — optional</div>

            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'carbs' as const, label: 'Carbs (g)', color: 'focus:border-amber-400' },
                { key: 'protein' as const, label: 'Protein (g)', color: 'focus:border-emerald-400' },
                { key: 'fat' as const, label: 'Fat (g)', color: 'focus:border-red-400' },
              ]).map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form[key]}
                    onChange={e => handleField(key, e.target.value)}
                    placeholder="0"
                    className={`w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none ${color}`}
                  />
                </div>
              ))}
            </div>

            {!editEntry && (
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm()) }}
                className="text-xs text-indigo-600"
              >
                ← Back to search
              </button>
            )}

            <button
              onClick={handleConfirm}
              disabled={!form.name.trim() || !form.calories}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40 active:bg-indigo-700"
            >
              {editEntry ? '✓ Save changes' : '✓ Add to meal'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AddFoodSheet.tsx
git commit -m "feat: add AddFoodSheet with search + manual entry"
```

---

## Task 12: DayView Page

**Files:**
- Create: `src/pages/DayView.tsx`

- [ ] **Step 1: Create DayView**

Create `src/pages/DayView.tsx`:

```tsx
import { useState } from 'react'
import { DateNav } from '../components/DateNav'
import { SummaryHeader } from '../components/SummaryHeader'
import { MealSection } from '../components/MealSection'
import { AddFoodSheet } from '../components/AddFoodSheet'
import { useEntries } from '../hooks/useEntries'
import { useGoals } from '../hooks/useGoals'
import { useDate } from '../hooks/useDate'
import { MEAL_NAMES, type FoodEntry, type MealName } from '../types'

export function DayView() {
  const { date, setDate, goBack, goForward } = useDate()
  const { entries, add, update, remove } = useEntries(date)
  const { goals } = useGoals()

  const [sheet, setSheet] = useState<{ meal: MealName; editEntry?: FoodEntry } | null>(null)

  function openAdd(meal: MealName) {
    setSheet({ meal })
  }

  function openEdit(entry: FoodEntry) {
    setSheet({ meal: entry.meal, editEntry: entry })
  }

  function handleConfirm(food: Omit<FoodEntry, 'id' | 'date' | 'meal' | 'createdAt'>) {
    if (!sheet) return
    if (sheet.editEntry) {
      update({ ...sheet.editEntry, ...food })
    } else {
      add(sheet.meal, food)
    }
    setSheet(null)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <DateNav date={date} onBack={goBack} onForward={goForward} onDateChange={setDate} />
      <SummaryHeader entries={entries} goals={goals} />

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        {MEAL_NAMES.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            entries={entries}
            goals={goals}
            onAddFood={openAdd}
            onEdit={openEdit}
            onDelete={remove}
          />
        ))}
      </div>

      {sheet && (
        <AddFoodSheet
          meal={sheet.meal}
          editEntry={sheet.editEntry}
          onConfirm={handleConfirm}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DayView.tsx
git commit -m "feat: add DayView page"
```

---

## Task 13: Goals Page

**Files:**
- Create: `src/pages/Goals.tsx`

- [ ] **Step 1: Create Goals page**

Create `src/pages/Goals.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useGoals } from '../hooks/useGoals'

export function Goals() {
  const { goals, save } = useGoals()
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (goals) {
      setCalories(String(goals.calories))
      setCarbs(goals.carbs != null ? String(goals.carbs) : '')
      setProtein(goals.protein != null ? String(goals.protein) : '')
      setFat(goals.fat != null ? String(goals.fat) : '')
    }
  }, [goals])

  async function handleSave() {
    const cal = parseFloat(calories)
    if (isNaN(cal) || cal <= 0) return
    const parse = (v: string) => { const n = parseFloat(v); return isNaN(n) ? undefined : n }
    await save({ calories: cal, carbs: parse(carbs), protein: parse(protein), fat: parse(fat) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-indigo-600 text-white px-4 py-3 font-bold text-sm">⚙️ Daily Goals</div>

      <div className="px-4 py-6 space-y-5 pb-24">
        <p className="text-xs text-gray-500">
          Set your daily calorie and macro targets. These show as progress bars on the day view.
        </p>

        <Field
          label="Calories (kcal)"
          required
          value={calories}
          onChange={setCalories}
          placeholder="e.g. 2000"
        />

        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-2">
          Macro targets — optional
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Carbs (g)" value={carbs} onChange={setCarbs} placeholder="180" />
          <Field label="Protein (g)" value={protein} onChange={setProtein} placeholder="150" />
          <Field label="Fat (g)" value={fat} onChange={setFat} placeholder="65" />
        </div>

        <button
          onClick={handleSave}
          disabled={!calories}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40 active:bg-indigo-700"
        >
          {saved ? '✓ Saved!' : 'Save goals'}
        </button>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  required?: boolean
}

function Field({ label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400"
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Goals.tsx
git commit -m "feat: add Goals settings page"
```

---

## Task 14: History Page

**Files:**
- Create: `src/pages/History.tsx`

- [ ] **Step 1: Create History page**

Create `src/pages/History.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, parseISO } from 'date-fns'
import { getEntriesForDateRange } from '../db'
import { useGoals } from '../hooks/useGoals'
import { ProgressBar } from '../components/ProgressBar'
import type { FoodEntry } from '../types'

interface Props {
  onDaySelect: (date: string) => void
}

export function History({ onDaySelect }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [entriesByDate, setEntriesByDate] = useState<Record<string, FoodEntry[]>>({})
  const { goals } = useGoals()

  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) })

  useEffect(() => {
    const start = format(weekStart, 'yyyy-MM-dd')
    const end = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    getEntriesForDateRange(start, end).then(entries => {
      const grouped: Record<string, FoodEntry[]> = {}
      for (const entry of entries) {
        if (!grouped[entry.date]) grouped[entry.date] = []
        grouped[entry.date].push(entry)
      }
      setEntriesByDate(grouped)
    })
  }, [weekStart])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-indigo-600 text-white flex items-center justify-between px-4 py-3">
        <button onClick={() => setWeekStart(w => subWeeks(w, 1))} className="text-2xl leading-none px-1">‹</button>
        <span className="font-bold text-sm">
          {format(weekStart, 'MMM d')} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
        </span>
        <button onClick={() => setWeekStart(w => addWeeks(w, 1))} className="text-2xl leading-none px-1">›</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEntries = entriesByDate[dateStr] ?? []
          const totalCal = dayEntries.reduce((acc, e) => acc + e.calories, 0)
          const totalCarbs = dayEntries.reduce((acc, e) => acc + (e.carbs ?? 0), 0)
          const totalProtein = dayEntries.reduce((acc, e) => acc + (e.protein ?? 0), 0)
          const totalFat = dayEntries.reduce((acc, e) => acc + (e.fat ?? 0), 0)
          const today = isToday(parseISO(dateStr))

          return (
            <button
              key={dateStr}
              onClick={() => onDaySelect(dateStr)}
              className={`w-full px-4 py-3 border-b border-gray-100 text-left ${today ? 'bg-indigo-50' : ''} active:bg-gray-50`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-sm font-semibold ${today ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {today ? 'Today — ' : ''}{format(parseISO(dateStr), 'EEE, MMM d')}
                </span>
                <span className="text-sm font-bold text-gray-700">{Math.round(totalCal)} kcal</span>
              </div>
              {goals && totalCal > 0 && (
                <ProgressBar value={totalCal} max={goals.calories} color="bg-indigo-500" trackColor="bg-indigo-100" height="h-1" />
              )}
              {totalCal > 0 && (
                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                  {totalCarbs > 0 && <span className="text-amber-600">C: {Math.round(totalCarbs)}g</span>}
                  {totalProtein > 0 && <span className="text-emerald-600">P: {Math.round(totalProtein)}g</span>}
                  {totalFat > 0 && <span className="text-red-500">F: {Math.round(totalFat)}g</span>}
                </div>
              )}
              {totalCal === 0 && (
                <div className="text-xs text-gray-400">Nothing logged</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/History.tsx
git commit -m "feat: add History weekly summary page"
```

---

## Task 15: App Shell + Routing

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Update App.tsx**

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react'
import { DayView } from './pages/DayView'
import { History } from './pages/History'
import { Goals } from './pages/Goals'
import { BottomNav } from './components/BottomNav'
import type { Page } from './types'

export default function App() {
  const [page, setPage] = useState<Page>('day')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  function goToDay(date: string) {
    setSelectedDate(date)
    setPage('day')
  }

  return (
    <div className="max-w-md mx-auto relative">
      {page === 'day' && <DayView initialDate={selectedDate ?? undefined} />}
      {page === 'history' && <History onDaySelect={goToDay} />}
      {page === 'goals' && <Goals />}
      <BottomNav current={page} onChange={setPage} />
    </div>
  )
}
```

- [ ] **Step 2: Update DayView to accept initialDate prop**

Modify `src/pages/DayView.tsx` — update the component signature and `useDate` initialization:

```tsx
// Change the Props interface and component signature:
interface Props {
  initialDate?: string
}

export function DayView({ initialDate }: Props) {
  const { date, setDate, goBack, goForward } = useDate(initialDate)
  // ... rest unchanged
```

- [ ] **Step 3: Update useDate to accept initial date**

Modify `src/hooks/useDate.ts` — update function signature:

```ts
export function useDate(initialDate?: string) {
  const [date, setDate] = useState<string>(initialDate ?? todayStr)
  // ... rest unchanged
```

- [ ] **Step 4: Update main.tsx**

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/pages/DayView.tsx src/hooks/useDate.ts
git commit -m "feat: add App shell with page routing"
```

---

## Task 16: PWA Icons

**Files:**
- Create: `public/icon-192.png`, `public/icon-512.png`
- Create: `scripts/generate-icons.mjs`

- [ ] **Step 1: Install sharp**

```bash
npm install -D sharp
```

- [ ] **Step 2: Create icon generation script**

Create `scripts/generate-icons.mjs`:

```js
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

// Create a simple SVG icon — indigo background with fork+knife emoji style
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#4f46e5"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" font-family="system-ui">🍽️</text>
</svg>`

const svgBuf = Buffer.from(svg)

await sharp(svgBuf).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svgBuf).resize(512, 512).png().toFile('public/icon-512.png')
console.log('Icons generated.')
```

- [ ] **Step 3: Run the script**

```bash
node scripts/generate-icons.mjs
```

Expected: `public/icon-192.png` and `public/icon-512.png` created.

- [ ] **Step 4: Commit**

```bash
git add public/icon-192.png public/icon-512.png scripts/generate-icons.mjs
git commit -m "feat: add PWA icons"
```

---

## Task 17: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: node scripts/generate-icons.mjs
      - run: npm run build

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages in the repo settings**

Go to your GitHub repo → Settings → Pages → Source: select **GitHub Actions**.

- [ ] **Step 3: Commit and push**

```bash
git add .github/
git commit -m "ci: add GitHub Actions deploy to GitHub Pages"
git push origin main
```

Expected: Action runs, site deploys to `https://<username>.github.io/meal-tracker/`.

---

## Task 18: End-to-End Verification

- [ ] **Step 1: Run all tests**

```bash
npm test -- --run
```

Expected: All tests pass (DB layer: 5, hooks: 5, API client: 2 = 12 total).

- [ ] **Step 2: Build locally**

```bash
npm run build
npm run preview
```

Open `http://localhost:4173/meal-tracker/`. Verify:
- Day view loads with today's date
- Navigate to previous/future days with arrows; tap date to open picker
- Tap "+ Add food to Breakfast" → sheet opens → type "chicken" → bundled results appear → tap a result → form pre-fills → tap "Add to meal" → food appears in Breakfast
- Tap the logged food → Edit / Delete buttons appear → edit works → delete removes it
- Macros show in summary header bars
- Navigate to Goals page → enter 2000 kcal, 180g carbs, 150g protein, 65g fat → save → return to day view → progress bars reflect targets
- Navigate to History page → current week shows with totals → tap a day row → goes to that day's Day View

- [ ] **Step 3: Test PWA install on mobile**

After GitHub Actions deploys:
1. Open `https://<username>.github.io/meal-tracker/` in Chrome (Android) or Safari (iOS)
2. Chrome: tap "Add to Home Screen" in browser menu
3. Safari: tap Share → "Add to Home Screen"
4. Launch the installed app — it should open in standalone mode (no browser chrome)
5. Turn off Wi-Fi — verify the app still loads and existing entries are accessible

- [ ] **Step 4: Add .gitignore entry for superpowers brainstorm artifacts**

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore superpowers brainstorm artifacts"
```
