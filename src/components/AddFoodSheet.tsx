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
