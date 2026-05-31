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
