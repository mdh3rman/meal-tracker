interface Props {
  value: number
  max: number
  color: string      // Tailwind bg color class, e.g. 'bg-indigo-600'
  trackColor: string // Tailwind bg color class, e.g. 'bg-indigo-200'
  height?: string    // Tailwind h- class, default 'h-2'
}

export function ProgressBar({ value, max, color, trackColor, height = 'h-2' }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = max > 0 && value > max
  return (
    <div className={`w-full ${trackColor} rounded-full ${height}`}>
      <div
        className={`${over ? 'bg-red-500' : color} rounded-full ${height} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
