import { Link } from 'react-router-dom'
import EventTypeChips from '../search/EventTypeChips'

interface MapFilterBarProps {
  selectedType: string
  onTypeChange: (type: string) => void
}

export default function MapFilterBar({ selectedType, onTypeChange }: MapFilterBarProps) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur-sm border border-gray-200">
        <EventTypeChips selected={selectedType} onChange={onTypeChange} />
      </div>
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-sm border border-gray-200 hover:bg-white transition-colors w-fit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        List view
      </Link>
    </div>
  )
}
