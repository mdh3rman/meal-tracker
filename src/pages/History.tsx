import { useEffect, useState } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, parseISO } from 'date-fns'
import { getEntriesForDateRange } from '../db'
import { useGoals } from '../hooks/useGoals'
import { ProgressBar } from '../components/ProgressBar'
import type { FoodEntry } from '../types'

interface Props {
  onDaySelect: (date: string) => void
}

export function History({ onDaySelect }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [entriesByDate, setEntriesByDate] = useState<Record<string, FoodEntry[]>>({})
  const { goals } = useGoals()

  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) })

  useEffect(() => {
    let cancelled = false
    const start = format(weekStart, 'yyyy-MM-dd')
    const end = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    getEntriesForDateRange(start, end).then(entries => {
      if (cancelled) return
      const grouped: Record<string, FoodEntry[]> = {}
      for (const entry of entries) {
        if (!grouped[entry.date]) grouped[entry.date] = []
        grouped[entry.date].push(entry)
      }
      setEntriesByDate(grouped)
    })
    return () => { cancelled = true }
  }, [weekStart])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-indigo-600 text-white flex items-center justify-between px-4 py-3">
        <button aria-label="Previous week" onClick={() => setWeekStart(w => subWeeks(w, 1))} className="text-2xl leading-none px-1">‹</button>
        <span className="font-bold text-sm">
          {format(weekStart, 'MMM d')} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
        </span>
        <button aria-label="Next week" onClick={() => setWeekStart(w => addWeeks(w, 1))} className="text-2xl leading-none px-1">›</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEntries = entriesByDate[dateStr] ?? []
          const totalCal = dayEntries.reduce((acc, e) => acc + e.calories, 0)
          const totalCarbs = dayEntries.reduce((acc, e) => acc + (e.carbs ?? 0), 0)
          const totalProtein = dayEntries.reduce((acc, e) => acc + (e.protein ?? 0), 0)
          const totalFat = dayEntries.reduce((acc, e) => acc + (e.fat ?? 0), 0)
          const today = isToday(parseISO(dateStr))

          return (
            <button
              key={dateStr}
              onClick={() => onDaySelect(dateStr)}
              className={`w-full px-4 py-3 border-b border-gray-100 text-left ${today ? 'bg-indigo-50' : ''} active:bg-gray-50`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-sm font-semibold ${today ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {today ? 'Today — ' : ''}{format(parseISO(dateStr), 'EEE, MMM d')}
                </span>
                <span className="text-sm font-bold text-gray-700">{Math.round(totalCal)} kcal</span>
              </div>
              {goals && totalCal > 0 && (
                <ProgressBar value={totalCal} max={goals.calories} color="bg-indigo-500" trackColor="bg-indigo-100" height="h-1" />
              )}
              {totalCal > 0 && (
                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                  {totalCarbs > 0 && <span className="text-amber-600">C: {Math.round(totalCarbs)}g</span>}
                  {totalProtein > 0 && <span className="text-emerald-600">P: {Math.round(totalProtein)}g</span>}
                  {totalFat > 0 && <span className="text-red-500">F: {Math.round(totalFat)}g</span>}
                </div>
              )}
              {totalCal === 0 && (
                <div className="text-xs text-gray-400">Nothing logged</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
