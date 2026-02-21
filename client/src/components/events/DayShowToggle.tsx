export type ViewMode = 'day' | 'show'

interface DayShowToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export default function DayShowToggle({ mode, onChange }: DayShowToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => onChange('day')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === 'day'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        By Day
      </button>
      <button
        onClick={() => onChange('show')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === 'show'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        By Show
      </button>
    </div>
  )
}
