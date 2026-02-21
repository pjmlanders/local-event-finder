import { EVENT_TYPES } from '../../lib/constants'

const TYPE_ICONS: Record<string, string> = {
  music: '\u{1F3B5}',
  sports: '\u{1F3C6}',
  theatre: '\u{1F3AD}',
  musical: '\u{1F3A4}',
  comedy: '\u{1F923}',
  family: '\u{1F46A}',
  film: '\u{1F3AC}',
}

interface EventTypeChipsProps {
  selected: string
  onChange: (value: string) => void
}

export default function EventTypeChips({ selected, onChange }: EventTypeChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('')}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selected === ''
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All Events
      </button>
      {EVENT_TYPES.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value === selected ? '' : type.value)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selected === type.value
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>{TYPE_ICONS[type.value]}</span>
          {type.label}
        </button>
      ))}
    </div>
  )
}
