import type { Page } from '../types'

interface Props {
  current: Page
  onChange: (page: Page) => void
}

const items: { page: Page; label: string; icon: string }[] = [
  { page: 'day', label: 'Today', icon: '📋' },
  { page: 'history', label: 'History', icon: '📊' },
  { page: 'goals', label: 'Goals', icon: '⚙️' },
]

export function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 pb-safe z-10">
      {items.map(({ page, label, icon }) => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`flex flex-col items-center text-xs gap-0.5 px-4 py-1 ${
            current === page ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
