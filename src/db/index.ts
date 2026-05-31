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
