import type { Dream, SearchViewFilters } from '@/types/dream'
import type { TagType } from './tagStats'

export function matchDream(dream: Dream, params: SearchViewFilters): boolean {
  if (params.keyword && !dream.keywords.some((k) => k.toLowerCase().includes(params.keyword.toLowerCase())))
    return false
  if (params.person && !dream.people.some((p) => p.toLowerCase().includes(params.person.toLowerCase())))
    return false
  if (params.place && !dream.places.some((p) => p.toLowerCase().includes(params.place.toLowerCase())))
    return false
  if (params.dateFrom && dream.date < params.dateFrom) return false
  if (params.dateTo && dream.date > params.dateTo) return false
  if (params.text && !dream.text.toLowerCase().includes(params.text.toLowerCase())) return false
  return true
}

export function filterDreamsBySearchParams(dreams: Dream[], params: SearchViewFilters): Dream[] {
  const hasAnyFilter = Object.values(params).some((v) => v !== '')
  if (!hasAnyFilter) return []
  return dreams.filter((d) => matchDream(d, params))
}

export function filterDreamsByTag(dreams: Dream[], tag: string | null): Dream[] {
  if (!tag) return dreams
  return dreams.filter(
    (d) =>
      d.keywords.includes(tag) || d.people.includes(tag) || d.places.includes(tag)
  )
}

export function getDreamsWithTag(dreams: Dream[], tag: string, tagType?: TagType): Dream[] {
  if (tagType) {
    return dreams.filter((d) => d[tagType].includes(tag))
  }
  return dreams.filter(
    (d) =>
      d.people.includes(tag) || d.places.includes(tag) || d.keywords.includes(tag)
  )
}

export function hasAnyFilter(params: SearchViewFilters): boolean {
  return Object.values(params).some((v) => v !== '')
}

export function getSearchViewDescription(view: { filters: SearchViewFilters }): string {
  const parts: string[] = []
  if (view.filters.keyword) parts.push(`关键词: ${view.filters.keyword}`)
  if (view.filters.person) parts.push(`人物: ${view.filters.person}`)
  if (view.filters.place) parts.push(`地点: ${view.filters.place}`)
  if (view.filters.dateFrom || view.filters.dateTo) {
    parts.push(`日期: ${view.filters.dateFrom || '...'} - ${view.filters.dateTo || '...'}`)
  }
  if (view.filters.text) parts.push(`正文: ${view.filters.text}`)
  return parts.join(' · ')
}

export function createEmptySearchParams(): SearchViewFilters {
  return {
    keyword: '',
    person: '',
    place: '',
    dateFrom: '',
    dateTo: '',
    text: '',
  }
}

export function areFiltersEqual(a: SearchViewFilters, b: SearchViewFilters): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
