import { useState } from 'react'
import { DayView } from './pages/DayView'
import { History } from './pages/History'
import { Goals } from './pages/Goals'
import { BottomNav } from './components/BottomNav'
import type { Page } from './types'

export default function App() {
  const [page, setPage] = useState<Page>('day')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  function goToDay(date: string) {
    setSelectedDate(date)
    setPage('day')
  }

  return (
    <div className="max-w-md mx-auto relative">
      {page === 'day' && <DayView initialDate={selectedDate ?? undefined} />}
      {page === 'history' && <History onDaySelect={goToDay} />}
      {page === 'goals' && <Goals />}
      <BottomNav current={page} onChange={setPage} />
    </div>
  )
}
