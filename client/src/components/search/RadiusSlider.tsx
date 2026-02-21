import { useLocation } from '../../context/LocationContext'
import { RADIUS_OPTIONS } from '../../lib/constants'

export default function RadiusSlider() {
  const { radius, setRadius } = useLocation()

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Radius: <span className="font-semibold text-indigo-600">{radius} mi</span>
      </label>
      <div className="flex gap-1.5">
        {RADIUS_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              radius === r
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
