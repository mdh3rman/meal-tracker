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
