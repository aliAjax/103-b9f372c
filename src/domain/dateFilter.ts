import type { Dream } from '@/types/dream'

export type DashboardTimeRange = '7d' | '30d' | '90d' | 'all'

export type RelationshipTimeRange = 'all' | '30days' | '90days' | 'month' | 'custom'

export interface DateRange {
  from: string | null
  to: string | null
}

export interface RelationshipFilterState {
  timeRange: RelationshipTimeRange
  selectedMonth: string
  dateFrom: string
  dateTo: string
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function filterDreamsByDate(dreams: Dream[], from: string | null, to: string | null): Dream[] {
  return dreams.filter((d) => {
    if (from && d.date < from) return false
    if (to && d.date > to) return false
    return true
  })
}

export function getDashboardDateRange(range: DashboardTimeRange, today: Date = new Date()): DateRange {
  if (range === 'all') return { from: null, to: null }

  const now = new Date(today)
  now.setHours(0, 0, 0, 0)
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  return { from: formatLocalDate(cutoff), to: null }
}

export function filterDreamsByDashboardRange(dreams: Dream[], range: DashboardTimeRange, today?: Date): Dream[] {
  const { from, to } = getDashboardDateRange(range, today)
  return filterDreamsByDate(dreams, from, to)
}

export function getRelationshipDateRange(
  filters: RelationshipFilterState,
  today: Date = new Date()
): DateRange {
  const { timeRange, selectedMonth, dateFrom, dateTo } = filters

  switch (timeRange) {
    case 'all':
      return { from: null, to: null }
    case '30days': {
      const from = new Date(today)
      from.setDate(from.getDate() - 30)
      return { from: formatISODate(from), to: formatISODate(today) }
    }
    case '90days': {
      const from = new Date(today)
      from.setDate(from.getDate() - 90)
      return { from: formatISODate(from), to: formatISODate(today) }
    }
    case 'month': {
      if (!selectedMonth) return { from: null, to: null }
      const [year, month] = selectedMonth.split('-').map(Number)
      const from = new Date(year, month - 1, 1)
      const to = new Date(year, month, 0)
      return { from: formatISODate(from), to: formatISODate(to) }
    }
    case 'custom': {
      return {
        from: dateFrom || null,
        to: dateTo || null,
      }
    }
    default:
      return { from: null, to: null }
  }
}

export function filterDreamsByRelationshipRange(
  dreams: Dream[],
  filters: RelationshipFilterState,
  today?: Date
): Dream[] {
  const { from, to } = getRelationshipDateRange(filters, today)
  return filterDreamsByDate(dreams, from, to)
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function isValidWakeTime(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)
}
