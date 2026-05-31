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
