export type ViewMode = 'day' | 'show'

interface DayShowToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export default function DayShowToggle({ mode, onChange }: DayShowToggleProps) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      <button
        onClick={() => onChange('day')}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'day'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        By Day
      </button>
      <button
        onClick={() => onChange('show')}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'show'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        By Show
      </button>
    </div>
  )
}
