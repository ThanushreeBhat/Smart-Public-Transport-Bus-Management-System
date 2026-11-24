function StatusBadge({ status }) {
  const normalizedStatus = (status || 'unknown').toLowerCase()

  const colors = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-yellow-100 text-yellow-700',
    delayed: 'bg-orange-100 text-orange-700',
    overcrowded: 'bg-red-100 text-red-700',
    open: 'bg-red-100 text-red-700',
    resolved: 'bg-green-100 text-green-700',
    unknown: 'bg-slate-100 text-slate-600',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        colors[normalizedStatus] || colors.unknown
      }`}
    >
      {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
    </span>
  )
}

export default StatusBadge