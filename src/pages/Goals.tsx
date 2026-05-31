import { useEffect, useRef, useState } from 'react'
import { useGoals } from '../hooks/useGoals'

export function Goals() {
  const { goals, save } = useGoals()
  const hydrated = useRef(false)
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (goals && !hydrated.current) {
      hydrated.current = true
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
