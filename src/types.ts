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
