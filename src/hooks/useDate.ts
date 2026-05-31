import { useState } from 'react'
import { format, addDays, subDays } from 'date-fns'

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function useDate(initialDate?: string) {
  const [date, setDate] = useState<string>(initialDate ?? todayStr)

  const goBack = () => setDate(d => format(subDays(new Date(d + 'T00:00:00'), 1), 'yyyy-MM-dd'))
  const goForward = () => setDate(d => format(addDays(new Date(d + 'T00:00:00'), 1), 'yyyy-MM-dd'))
  const goToday = () => setDate(todayStr())

  return { date, setDate, goBack, goForward, goToday }
}
