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
      <div className={page === 'day' ? '' : 'hidden'}>
        <DayView initialDate={selectedDate ?? undefined} />
      </div>
      <div className={page === 'history' ? '' : 'hidden'}>
        <History onDaySelect={goToDay} />
      </div>
      <div className={page === 'goals' ? '' : 'hidden'}>
        <Goals />
      </div>
      <BottomNav current={page} onChange={setPage} />
    </div>
  )
}
