interface DateFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
}

export default function DateFilter({ startDate, endDate, onStartDateChange, onEndDateChange }: DateFilterProps) {
  const today = new Date().toISOString().split('T')[0]

  function handleQuickSelect(days: number) {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + days)
    onStartDateChange(from.toISOString().split('T')[0])
    onEndDateChange(to.toISOString().split('T')[0])
  }

  function clearDates() {
    onStartDateChange('')
    onEndDateChange('')
  }

  const hasDateFilter = startDate || endDate

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Date Range</label>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => handleQuickSelect(0)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Today
        </button>
        <button
          onClick={() => handleQuickSelect(2)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          This Weekend
        </button>
        <button
          onClick={() => handleQuickSelect(7)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Next 7 Days
        </button>
        <button
          onClick={() => handleQuickSelect(30)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Next 30 Days
        </button>
        {hasDateFilter && (
          <button
            onClick={clearDates}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          min={today}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <span className="text-sm text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          min={startDate || today}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
    </div>
  )
}
