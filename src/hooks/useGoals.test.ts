import { afterEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGoals } from './useGoals'
import { closeDB } from '../db'

afterEach(async () => {
  await closeDB()
  indexedDB.deleteDatabase('meal-tracker')
})

describe('useGoals', () => {
  it('starts with null goals', async () => {
    const { result } = renderHook(() => useGoals())
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    expect(result.current.goals).toBeNull()
  })

  it('saves and reads goals', async () => {
    const { result } = renderHook(() => useGoals())
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    await act(async () => {
      await result.current.save({ calories: 2000, protein: 150 })
    })
    expect(result.current.goals?.calories).toBe(2000)
    expect(result.current.goals?.protein).toBe(150)
  })
})
