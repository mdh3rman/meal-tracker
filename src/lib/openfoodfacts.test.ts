import { describe, expect, it, vi, beforeEach } from 'vitest'
import { searchOnline } from './openfoodfacts'

beforeEach(() => { vi.restoreAllMocks() })

describe('searchOnline', () => {
  it('returns mapped food suggestions from API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            product_name: 'Chicken Fillet',
            nutriments: {
              'energy-kcal_100g': 165,
              carbohydrates_100g: 0,
              proteins_100g: 31,
              fat_100g: 3.6,
            },
          },
          {
            product_name: '',
            nutriments: {},
          },
          {
            product_name: 'Oat Bar',
            nutriments: { 'energy-kcal_100g': 420 },
          },
        ],
      }),
    }))

    const results = await searchOnline('chicken')
    expect(results).toHaveLength(2)
    expect(results[0].name).toBe('Chicken Fillet')
    expect(results[0].calories).toBe(165)
    expect(results[0].protein).toBe(31)
    expect(results[1].name).toBe('Oat Bar')
    expect(results[1].carbs).toBeUndefined()
  })

  it('returns empty array on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const results = await searchOnline('anything')
    expect(results).toEqual([])
  })
})
