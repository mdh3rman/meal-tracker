import { FoodItem } from './FoodItem'
import type { FoodEntry, MealName } from '../types'
import { MEAL_LABELS } from '../types'

interface Props {
  meal: MealName
  entries: FoodEntry[]
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
