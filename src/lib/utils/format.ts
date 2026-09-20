export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDoi(doi: string): string {
  return doi.startsWith('http') ? doi : `https://doi.org/${doi}`
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelativeTime(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeTimeFormatter.format(Math.round(seconds / unitSeconds), unit)
    }
  }
  return relativeTimeFormatter.format(Math.round(seconds), 'second')
}
