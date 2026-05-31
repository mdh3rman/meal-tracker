import { format, isToday, parseISO } from 'date-fns'

interface Props {
  date: string                      // YYYY-MM-DD
  onBack: () => void
  onForward: () => void
  onDateChange: (date: string) => void
}

export function DateNav({ date, onBack, onForward, onDateChange }: Props) {
  const parsed = parseISO(date)
  const label = isToday(parsed) ? 'Today' : format(parsed, 'EEE, MMM d')

  return (
    <div className="bg-indigo-600 text-white flex items-center justify-between px-4 py-3">
      <button onClick={onBack} className="text-2xl leading-none px-1 active:opacity-60">
        ‹
      </button>
      <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer select-none">
        <span>📅 {label}</span>
        <input
          type="date"
          value={date}
          onChange={e => e.target.value && onDateChange(e.target.value)}
          className="absolute opacity-0 w-0 h-0"
          aria-label="Pick a date"
        />
      </label>
      <button onClick={onForward} className="text-2xl leading-none px-1 active:opacity-60">
        ›
      </button>
    </div>
  )
}
