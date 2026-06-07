import type { Dream } from '@/types/dream'

export type TagType = 'people' | 'places' | 'keywords'

export interface TagCount {
  name: string
  count: number
}

export interface AllTags {
  people: TagCount[]
  places: TagCount[]
  keywords: TagCount[]
}

export interface LowFreqTag extends TagCount {
  dreams: Array<{ id: string; date: string; text: string }>
}

export interface LowFreqTags {
  people: LowFreqTag[]
  places: LowFreqTag[]
  keywords: LowFreqTag[]
}

function mapToSortedArray(map: Map<string, number>): TagCount[] {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function getAllTags(dreams: Dream[]): AllTags {
  const peopleMap = new Map<string, number>()
  const placesMap = new Map<string, number>()
  const keywordsMap = new Map<string, number>()

  dreams.forEach((d) => {
    d.people.forEach((tag) => {
      peopleMap.set(tag, (peopleMap.get(tag) || 0) + 1)
    })
    d.places.forEach((tag) => {
      placesMap.set(tag, (placesMap.get(tag) || 0) + 1)
    })
    d.keywords.forEach((tag) => {
      keywordsMap.set(tag, (keywordsMap.get(tag) || 0) + 1)
    })
  })

  return {
    people: mapToSortedArray(peopleMap),
    places: mapToSortedArray(placesMap),
    keywords: mapToSortedArray(keywordsMap),
  }
}

export function getRecentTags(dreams: Dream[], type: TagType, limit: number = 20): string[] {
  const tagMap = new Map<string, number>()
  dreams.forEach((d) => {
    d[type].forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
    })
  })
  return Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

export function buildLowFreqTags(dreams: Dream[], allTags: AllTags, maxCount: number = 2): LowFreqTags {
  const buildLowFreq = (type: TagType): LowFreqTag[] => {
    const tags = allTags[type].filter((t) => t.count <= maxCount)
    return tags.map((tag) => {
      const relatedDreams = dreams
        .filter((d) => d[type].includes(tag.name))
        .map((d) => ({ id: d.id, date: d.date, text: d.text }))
      return { name: tag.name, count: tag.count, dreams: relatedDreams } as LowFreqTag
    })
  }

  return {
    people: buildLowFreq('people'),
    places: buildLowFreq('places'),
    keywords: buildLowFreq('keywords'),
  }
}

export function filterTagsByName<T extends { name: string }>(tags: T[], searchText: string): T[] {
  if (!searchText.trim()) return tags
  const query = searchText.toLowerCase()
  return tags.filter((t) => t.name.toLowerCase().includes(query))
}

export function getTagSuggestions(
  allTags: AllTags,
  type: TagType,
  query: string,
  limit: number = 5
): string[] {
  if (!query.trim()) return []
  const lowerQuery = query.toLowerCase()
  return allTags[type]
    .filter((t) => t.name.toLowerCase().includes(lowerQuery))
    .slice(0, limit)
    .map((t) => t.name)
}

export function getTotalTagCount(allTags: AllTags): number {
  return allTags.people.length + allTags.places.length + allTags.keywords.length
}

export function getTotalTagUsage(allTags: AllTags): number {
  return (
    allTags.people.reduce((sum, t) => sum + t.count, 0) +
    allTags.places.reduce((sum, t) => sum + t.count, 0) +
    allTags.keywords.reduce((sum, t) => sum + t.count, 0)
  )
}

export function getLowFreqTagCount(lowFreqTags: LowFreqTags): number {
  return lowFreqTags.people.length + lowFreqTags.places.length + lowFreqTags.keywords.length
}
