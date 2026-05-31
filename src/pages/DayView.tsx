import { useState } from 'react'
import { DateNav } from '../components/DateNav'
import { SummaryHeader } from '../components/SummaryHeader'
import { MealSection } from '../components/MealSection'
import { AddFoodSheet } from '../components/AddFoodSheet'
import { useEntries } from '../hooks/useEntries'
import { useGoals } from '../hooks/useGoals'
import { useDate } from '../hooks/useDate'
import { MEAL_NAMES, type FoodEntry, type MealName } from '../types'

interface Props {
  initialDate?: string
}

export function DayView({ initialDate }: Props) {
  const { date, setDate, goBack, goForward } = useDate(initialDate)
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
