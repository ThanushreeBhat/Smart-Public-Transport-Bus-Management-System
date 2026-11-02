export const formatDate = (date) => {
  if (!date) return '—'

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatTime = (time) => {
  if (!time) return '—'

  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export const formatPercentage = (value) => {
  return `${Number(value || 0).toFixed(1)}%`
}

export const formatStatus = (status) => {
  if (!status) return 'Unknown'

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}