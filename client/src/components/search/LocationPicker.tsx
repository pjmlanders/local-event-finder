import { useState } from 'react'
import { useLocation } from '../../context/LocationContext'

interface LocationPickerProps {
  /** Use "hero" when inside a dark gradient (e.g. homepage) */
  variant?: 'default' | 'hero'
}

export default function LocationPicker({ variant = 'default' }: LocationPickerProps) {
  const { status, label, method, errorMessage, detectGPS, searchZip, clearLocation } = useLocation()
  const [zipInput, setZipInput] = useState('')

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    searchZip(zipInput)
  }

  const hasLocation = status === 'success'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={detectGPS}
          disabled={status === 'loading'}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
            variant === 'hero'
              ? 'bg-white text-indigo-700 hover:bg-white/90'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {status === 'loading' ? 'Detecting...' : 'Use My Location'}
        </button>

        <span className={`text-sm ${variant === 'hero' ? 'text-white/60' : 'text-slate-400'}`}>or</span>

        <form onSubmit={handleZipSubmit} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="ZIP code"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className={`w-28 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              variant === 'hero'
                ? 'border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20'
                : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
          />
          <button
            type="submit"
            disabled={zipInput.length < 5 || status === 'loading'}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              variant === 'hero'
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-slate-800 text-white hover:bg-slate-900'
            }`}
          >
            Go
          </button>
        </form>
      </div>

      {hasLocation && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {method === 'gps' ? 'GPS' : label}
          </span>
          <button onClick={clearLocation} className={variant === 'hero' ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-600'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
