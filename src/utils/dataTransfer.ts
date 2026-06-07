import type { Dream } from '@/types/dream'
import { isValidDate, isValidWakeTime } from '@/domain/dateFilter'

export interface SuspectedDuplicate {
  dream: Dream
  existingDream: Dream
  similarity: number
  import: boolean
}

export interface ImportPreview {
  newCount: number
  duplicateCount: number
  suspectedDuplicateCount: number
  errorCount: number
  validDreams: Dream[]
  suspectedDuplicates: SuspectedDuplicate[]
  errors: { index: number; reason: string }[]
}

export function isValidDream(item: unknown): item is Dream {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  if (typeof obj.text !== 'string' || !obj.text.trim()) return false
  if (typeof obj.date !== 'string' || !obj.date) return false
  if (typeof obj.wakeTime !== 'string' || !obj.wakeTime) return false
  if (typeof obj.emotionScore !== 'number' || obj.emotionScore < 1 || obj.emotionScore > 5) return false
  if (typeof obj.clarityScore !== 'number' || obj.clarityScore < 1 || obj.clarityScore > 5) return false
  if (!Array.isArray(obj.people) || !obj.people.every((v: unknown) => typeof v === 'string')) return false
  if (!Array.isArray(obj.places) || !obj.places.every((v: unknown) => typeof v === 'string')) return false
  if (!Array.isArray(obj.keywords) || !obj.keywords.every((v: unknown) => typeof v === 'string')) return false
  return true
}

export function describeErrors(item: unknown): string[] {
  if (typeof item !== 'object' || item === null) return ['不是有效的对象']
  const obj = item as Record<string, unknown>
  const reasons: string[] = []
  if (typeof obj.text !== 'string' || !obj.text.trim()) reasons.push('text 缺失或为空')
  if (typeof obj.date !== 'string' || !obj.date) reasons.push('date 缺失')
  if (typeof obj.wakeTime !== 'string' || !obj.wakeTime) reasons.push('wakeTime 缺失')
  if (typeof obj.emotionScore !== 'number') reasons.push('emotionScore 非数字')
  else if (obj.emotionScore < 1 || obj.emotionScore > 5) reasons.push('emotionScore 超出范围(1-5)')
  if (typeof obj.clarityScore !== 'number') reasons.push('clarityScore 非数字')
  else if (obj.clarityScore < 1 || obj.clarityScore > 5) reasons.push('clarityScore 超出范围(1-5)')
  if (!Array.isArray(obj.people)) reasons.push('people 非数组')
  else if (!obj.people.every((v: unknown) => typeof v === 'string')) reasons.push('people 包含非字符串')
  if (!Array.isArray(obj.places)) reasons.push('places 非数组')
  else if (!obj.places.every((v: unknown) => typeof v === 'string')) reasons.push('places 包含非字符串')
  if (!Array.isArray(obj.keywords)) reasons.push('keywords 非数组')
  else if (!obj.keywords.every((v: unknown) => typeof v === 'string')) reasons.push('keywords 包含非字符串')
  return reasons
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  if (a.length > 1000 || b.length > 1000) {
    const shorter = a.length <= b.length ? a : b
    const longer = a.length > b.length ? a : b
    const overlap = longer.slice(0, 1000)
    return levenshteinDistance(shorter, overlap) + Math.abs(longer.length - 1000)
  }
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

export function textSimilarity(a: string, b: string): number {
  if (typeof a !== 'string' || typeof b !== 'string') return 0
  const cleanA = a.trim().toLowerCase().replace(/\s+/g, ' ')
  const cleanB = b.trim().toLowerCase().replace(/\s+/g, ' ')
  if (cleanA === cleanB) return 1
  if (cleanA.length === 0 || cleanB.length === 0) return 0
  const maxLen = Math.max(cleanA.length, cleanB.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(cleanA, cleanB)
  const similarity = 1 - distance / maxLen
  return Math.max(0, Math.min(1, similarity))
}

export function isSuspectedDuplicate(dream: Dream, existing: Dream): { isDuplicate: boolean; similarity: number } {
  if (!isValidDate(dream.date) || !isValidDate(existing.date)) {
    return { isDuplicate: false, similarity: 0 }
  }
  if (dream.date !== existing.date) return { isDuplicate: false, similarity: 0 }
  if (!dream.text.trim() || !existing.text.trim()) {
    return { isDuplicate: false, similarity: 0 }
  }
  const similarity = textSimilarity(dream.text, existing.text)
  const hasValidWakeTime = isValidWakeTime(dream.wakeTime) && isValidWakeTime(existing.wakeTime)
  if (hasValidWakeTime && dream.wakeTime === existing.wakeTime && similarity >= 0.8) {
    return { isDuplicate: true, similarity }
  }
  return { isDuplicate: false, similarity }
}

export function findSuspectedDuplicate(dream: Dream, existingDreams: Dream[]): { existingDream: Dream; similarity: number } | null {
  let bestMatch: { existingDream: Dream; similarity: number } | null = null
  for (const existing of existingDreams) {
    const result = isSuspectedDuplicate(dream, existing)
    if (result.isDuplicate) {
      if (!bestMatch || result.similarity > bestMatch.similarity) {
        bestMatch = { existingDream: existing, similarity: result.similarity }
      }
    }
  }
  return bestMatch
}

export function analyzeImport(data: unknown[], existingDreams: Dream[]): ImportPreview {
  const validDreams: Dream[] = []
  const suspectedDuplicates: SuspectedDuplicate[] = []
  const errors: { index: number; reason: string }[] = []
  let duplicateCount = 0
  const existingIds = new Set(existingDreams.map((d) => d.id))

  data.forEach((item, index) => {
    if (!isValidDream(item)) {
      const reasons = describeErrors(item)
      errors.push({ index: index + 1, reason: reasons.join('；') })
      return
    }
    if (item.id && existingIds.has(item.id)) {
      duplicateCount++
      return
    }
    const dream: Dream = {
      ...item,
      id: item.id || crypto.randomUUID(),
      createdAt: item.createdAt || new Date().toISOString(),
    }
    const suspected = findSuspectedDuplicate(dream, existingDreams)
    if (suspected) {
      suspectedDuplicates.push({
        dream,
        existingDream: suspected.existingDream,
        similarity: suspected.similarity,
        import: false,
      })
    } else {
      validDreams.push(dream)
    }
  })

  return {
    newCount: validDreams.length,
    duplicateCount,
    suspectedDuplicateCount: suspectedDuplicates.length,
    errorCount: errors.length,
    validDreams,
    suspectedDuplicates,
    errors,
  }
}
