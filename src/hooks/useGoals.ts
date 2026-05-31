import { useCallback, useEffect, useState } from 'react'
import { getGoals, saveGoals } from '../db'
import type { Goals } from '../types'

export function useGoals() {
  const [goals, setGoals] = useState<Goals | null>(null)

  const load = useCallback(async () => {
    const g = await getGoals()
    setGoals(g ?? null)
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (goals: Goals) => {
    await saveGoals(goals)
    await load()
  }, [load])

  return { goals, save }
}
