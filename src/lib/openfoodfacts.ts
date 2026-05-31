import type { FoodSuggestion } from '../types'

interface OFFProduct {
  product_name?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    carbohydrates_100g?: number
    proteins_100g?: number
    fat_100g?: number
  }
}

interface OFFResponse {
  products: OFFProduct[]
}

export async function searchOnline(query: string): Promise<FoodSuggestion[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms=${encodeURIComponent(query)}&json=1&page_size=20&fields=product_name,nutriments`
    const res = await fetch(url)
    if (!res.ok) return []
    const data: OFFResponse = await res.json()
    return data.products
      .filter(p => p.product_name && p.product_name.trim().length > 0)
      .map((p): FoodSuggestion | null => {
        const n = p.nutriments ?? {}
        const kcal = n['energy-kcal_100g']
        if (!kcal) return null
        return {
          name: p.product_name!.trim(),
          calories: Math.round(kcal),
          carbs: n.carbohydrates_100g != null ? Math.round(n.carbohydrates_100g * 10) / 10 : undefined,
          protein: n.proteins_100g != null ? Math.round(n.proteins_100g * 10) / 10 : undefined,
          fat: n.fat_100g != null ? Math.round(n.fat_100g * 10) / 10 : undefined,
        }
      })
      .filter((s): s is FoodSuggestion => s !== null)
  } catch {
    return []
  }
}
