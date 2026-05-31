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
