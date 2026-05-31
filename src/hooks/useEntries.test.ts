import { afterEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEntries } from './useEntries'
import { closeDB } from '../db'

afterEach(async () => {
  await closeDB()
  indexedDB.deleteDatabase('meal-tracker')
})

describe('useEntries', () => {
  it('starts with empty entries', async () => {
    const { result } = renderHook(() => useEntries('2026-05-31'))
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    expect(result.current.entries).toEqual([])
  })

  it('adds an entry and reflects in entries', async () => {
    const { result } = renderHook(() => useEntries('2026-05-31'))
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    await act(async () => {
      await result.current.add('breakfast', { name: 'Oats', calories: 389, carbs: 66, protein: 17, fat: 7 })
    })
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].name).toBe('Oats')
    expect(result.current.entries[0].meal).toBe('breakfast')
    expect(result.current.entries[0].date).toBe('2026-05-31')
  })

  it('removes an entry', async () => {
    const { result } = renderHook(() => useEntries('2026-05-31'))
    await act(async () => { await new Promise(r => setTimeout(r, 50)) })
    await act(async () => {
      await result.current.add('lunch', { name: 'Rice', calories: 130 })
    })
    const id = result.current.entries[0].id
    await act(async () => { await result.current.remove(id) })
    expect(result.current.entries).toHaveLength(0)
  })
})
