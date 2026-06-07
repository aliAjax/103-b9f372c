import { describe, it, expect } from 'vitest'
import type { Dream } from '@/types/dream'
import {
  isValidDream,
  describeErrors,
  levenshteinDistance,
  textSimilarity,
  isSuspectedDuplicate,
  findSuspectedDuplicate,
  analyzeImport,
} from './dataTransfer'
import { isValidDate, isValidWakeTime } from '@/domain/dateFilter'

const createValidDream = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'test-id-1',
  text: '一个美好的梦境，我在天空中飞翔',
  date: '2024-01-15',
  wakeTime: '07:30',
  emotionScore: 4,
  clarityScore: 3,
  people: ['小明', '小红'],
  places: ['公园', '学校'],
  keywords: ['飞翔', '自由'],
  createdAt: '2024-01-15T08:00:00.000Z',
  ...overrides,
})

describe('isValidDream - 导入校验', () => {
  it('应该接受完整且有效的梦境对象', () => {
    const dream = createValidDream()
    expect(isValidDream(dream)).toBe(true)
  })

  it('应该拒绝 null 和非对象', () => {
    expect(isValidDream(null)).toBe(false)
    expect(isValidDream(undefined)).toBe(false)
    expect(isValidDream('string')).toBe(false)
    expect(isValidDream(123)).toBe(false)
    expect(isValidDream([])).toBe(false)
  })

  it('应该拒绝缺失或空 text 的对象', () => {
    expect(isValidDream({ ...createValidDream(), text: '' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), text: '   ' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), text: undefined })).toBe(false)
  })

  it('应该拒绝缺失 date 的对象', () => {
    expect(isValidDream({ ...createValidDream(), date: '' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), date: undefined })).toBe(false)
  })

  it('应该拒绝缺失 wakeTime 的对象', () => {
    expect(isValidDream({ ...createValidDream(), wakeTime: '' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), wakeTime: undefined })).toBe(false)
  })

  it('应该拒绝 emotionScore 不在 1-5 范围内的对象', () => {
    expect(isValidDream({ ...createValidDream(), emotionScore: 0 })).toBe(false)
    expect(isValidDream({ ...createValidDream(), emotionScore: 6 })).toBe(false)
    expect(isValidDream({ ...createValidDream(), emotionScore: -1 })).toBe(false)
    expect(isValidDream({ ...createValidDream(), emotionScore: '3' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), emotionScore: undefined })).toBe(false)
  })

  it('应该拒绝 clarityScore 不在 1-5 范围内的对象', () => {
    expect(isValidDream({ ...createValidDream(), clarityScore: 0 })).toBe(false)
    expect(isValidDream({ ...createValidDream(), clarityScore: 6 })).toBe(false)
    expect(isValidDream({ ...createValidDream(), clarityScore: '3' })).toBe(false)
  })

  it('应该拒绝 people 非数组或包含非字符串的对象', () => {
    expect(isValidDream({ ...createValidDream(), people: 'not array' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), people: [1, 2, 3] })).toBe(false)
    expect(isValidDream({ ...createValidDream(), people: ['valid', 123] })).toBe(false)
  })

  it('应该拒绝 places 非数组或包含非字符串的对象', () => {
    expect(isValidDream({ ...createValidDream(), places: 'not array' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), places: [1, 2, 3] })).toBe(false)
  })

  it('应该拒绝 keywords 非数组或包含非字符串的对象', () => {
    expect(isValidDream({ ...createValidDream(), keywords: 'not array' })).toBe(false)
    expect(isValidDream({ ...createValidDream(), keywords: [1, 2, 3] })).toBe(false)
  })

  it('空数组的 people/places/keywords 应该是有效的', () => {
    expect(isValidDream({ ...createValidDream(), people: [], places: [], keywords: [] })).toBe(true)
  })
})

describe('describeErrors - 错误描述', () => {
  it('应该为 null 返回非对象错误', () => {
    expect(describeErrors(null)).toContain('不是有效的对象')
  })

  it('应该返回多个错误原因', () => {
    const errors = describeErrors({
      text: '',
      emotionScore: 10,
      people: 'not array',
    })
    expect(errors.length).toBeGreaterThan(1)
    expect(errors).toContain('text 缺失或为空')
    expect(errors).toContain('emotionScore 超出范围(1-5)')
    expect(errors).toContain('people 非数组')
  })

  it('应该正确描述各类错误', () => {
    expect(describeErrors({ text: '' })).toContain('text 缺失或为空')
    expect(describeErrors({ text: 'test', date: '' })).toContain('date 缺失')
    expect(describeErrors({ text: 'test', date: '2024-01-01', wakeTime: '' })).toContain('wakeTime 缺失')
    expect(describeErrors({ text: 'test', date: '2024-01-01', wakeTime: '07:00', emotionScore: 'bad' })).toContain('emotionScore 非数字')
    expect(describeErrors({ text: 'test', date: '2024-01-01', wakeTime: '07:00', emotionScore: 3, clarityScore: 10 })).toContain('clarityScore 超出范围(1-5)')
  })
})

describe('levenshteinDistance - 编辑距离计算', () => {
  it('相同字符串距离为 0', () => {
    expect(levenshteinDistance('abc', 'abc')).toBe(0)
    expect(levenshteinDistance('', '')).toBe(0)
  })

  it('其中一个为空字符串时距离为另一个的长度', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3)
    expect(levenshteinDistance('abc', '')).toBe(3)
  })

  it('应该正确计算编辑距离', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
    expect(levenshteinDistance('flaw', 'lawn')).toBe(2)
    expect(levenshteinDistance('gumbo', 'gambol')).toBe(2)
  })

  it('超长字符串应该有截断处理', () => {
    const longStr1 = 'a'.repeat(1500)
    const longStr2 = 'a'.repeat(1000) + 'b'.repeat(500)
    expect(() => levenshteinDistance(longStr1, longStr2)).not.toThrow()
  })
})

describe('textSimilarity - 文本相似度', () => {
  it('相同文本相似度为 1', () => {
    expect(textSimilarity('hello world', 'hello world')).toBe(1)
  })

  it('完全不同的文本相似度接近 0', () => {
    expect(textSimilarity('abc', 'xyz')).toBeLessThan(0.5)
  })

  it('应该忽略大小写和多余空白', () => {
    expect(textSimilarity('Hello   World', 'hello world')).toBe(1)
  })

  it('空字符串应该正确处理', () => {
    expect(textSimilarity('', '')).toBe(1)
    expect(textSimilarity('test', '')).toBe(0)
    expect(textSimilarity('', 'test')).toBe(0)
  })

  it('非字符串输入返回 0', () => {
    expect(textSimilarity(null as unknown as string, 'test')).toBe(0)
    expect(textSimilarity('test', undefined as unknown as string)).toBe(0)
  })

  it('部分相似的文本应该返回中间值', () => {
    const sim = textSimilarity('hello world', 'hello there')
    expect(sim).toBeGreaterThan(0)
    expect(sim).toBeLessThan(1)
  })
})

describe('isValidDate - 日期格式校验', () => {
  it('应该接受有效的 YYYY-MM-DD 格式', () => {
    expect(isValidDate('2024-01-15')).toBe(true)
    expect(isValidDate('2024-12-31')).toBe(true)
    expect(isValidDate('2020-02-29')).toBe(true)
  })

  it('应该拒绝无效的日期', () => {
    expect(isValidDate('2024-02-30')).toBe(false)
    expect(isValidDate('2024-13-01')).toBe(false)
    expect(isValidDate('2024-00-01')).toBe(false)
    expect(isValidDate('2024-01-32')).toBe(false)
  })

  it('应该拒绝非日期格式字符串', () => {
    expect(isValidDate('')).toBe(false)
    expect(isValidDate('2024/01/15')).toBe(false)
    expect(isValidDate('01-15-2024')).toBe(false)
    expect(isValidDate('2024-1-15')).toBe(false)
    expect(isValidDate('abc')).toBe(false)
  })

  it('应该拒绝非字符串输入', () => {
    expect(isValidDate(null as unknown as string)).toBe(false)
    expect(isValidDate(20240115 as unknown as string)).toBe(false)
  })
})

describe('isValidWakeTime - 醒来时间校验', () => {
  it('应该接受有效的 HH:MM 格式', () => {
    expect(isValidWakeTime('00:00')).toBe(true)
    expect(isValidWakeTime('07:30')).toBe(true)
    expect(isValidWakeTime('12:00')).toBe(true)
    expect(isValidWakeTime('23:59')).toBe(true)
  })

  it('应该拒绝无效的时间', () => {
    expect(isValidWakeTime('24:00')).toBe(false)
    expect(isValidWakeTime('25:00')).toBe(false)
    expect(isValidWakeTime('07:60')).toBe(false)
    expect(isValidWakeTime('07:99')).toBe(false)
  })

  it('应该拒绝非时间格式字符串', () => {
    expect(isValidWakeTime('')).toBe(false)
    expect(isValidWakeTime('7:30')).toBe(false)
    expect(isValidWakeTime('0730')).toBe(false)
    expect(isValidWakeTime('07:30:00')).toBe(false)
    expect(isValidWakeTime('abc')).toBe(false)
  })

  it('应该拒绝非字符串输入', () => {
    expect(isValidWakeTime(null as unknown as string)).toBe(false)
    expect(isValidWakeTime(730 as unknown as string)).toBe(false)
  })
})

describe('isSuspectedDuplicate - 疑似重复识别', () => {
  it('同日期同醒来时间高相似度文本应该识别为疑似重复', () => {
    const dream1 = createValidDream({
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '我在天空中飞翔，看到了美丽的云彩',
    })
    const dream2 = createValidDream({
      id: 'test-id-2',
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '我在天空中飞翔，看到了美丽的云朵',
    })
    const result = isSuspectedDuplicate(dream1, dream2)
    expect(result.isDuplicate).toBe(true)
    expect(result.similarity).toBeGreaterThanOrEqual(0.8)
  })

  it('不同日期不应该识别为重复', () => {
    const dream1 = createValidDream({
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '相同的文本内容',
    })
    const dream2 = createValidDream({
      id: 'test-id-2',
      date: '2024-01-16',
      wakeTime: '07:30',
      text: '相同的文本内容',
    })
    expect(isSuspectedDuplicate(dream1, dream2).isDuplicate).toBe(false)
  })

  it('不同醒来时间不应该识别为重复', () => {
    const dream1 = createValidDream({
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '相同的文本内容',
    })
    const dream2 = createValidDream({
      id: 'test-id-2',
      date: '2024-01-15',
      wakeTime: '08:30',
      text: '相同的文本内容',
    })
    expect(isSuspectedDuplicate(dream1, dream2).isDuplicate).toBe(false)
  })

  it('相似度低于阈值不应该识别为重复', () => {
    const dream1 = createValidDream({
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '我梦见自己在天空中飞翔',
    })
    const dream2 = createValidDream({
      id: 'test-id-2',
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '我在深海里潜水，看到了很多鱼',
    })
    expect(isSuspectedDuplicate(dream1, dream2).isDuplicate).toBe(false)
  })

  it('无效日期应该返回非重复', () => {
    const dream1 = createValidDream({ date: 'invalid' })
    const dream2 = createValidDream({ id: 'test-id-2', date: 'invalid' })
    expect(isSuspectedDuplicate(dream1, dream2).isDuplicate).toBe(false)
  })

  it('空文本应该返回非重复', () => {
    const dream1 = createValidDream({ text: '   ' })
    const dream2 = createValidDream({ id: 'test-id-2', text: '   ' })
    expect(isSuspectedDuplicate(dream1, dream2).isDuplicate).toBe(false)
  })
})

describe('findSuspectedDuplicate - 查找疑似重复', () => {
  const existingDreams: Dream[] = [
    createValidDream({
      id: 'existing-1',
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '我在天空中飞翔，看到了美丽的云彩',
    }),
    createValidDream({
      id: 'existing-2',
      date: '2024-01-16',
      wakeTime: '08:00',
      text: '我在海底潜水探险',
    }),
  ]

  it('应该找到最匹配的疑似重复', () => {
    const dream = createValidDream({
      id: 'new-1',
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '我在天空中飞翔，看到了美丽的云朵',
    })
    const result = findSuspectedDuplicate(dream, existingDreams)
    expect(result).not.toBeNull()
    expect(result?.existingDream.id).toBe('existing-1')
    expect(result?.similarity).toBeGreaterThanOrEqual(0.8)
  })

  it('没有疑似重复时返回 null', () => {
    const dream = createValidDream({
      id: 'new-1',
      date: '2024-01-17',
      wakeTime: '09:00',
      text: '我在森林里遇到了一只会说话的鹿',
    })
    expect(findSuspectedDuplicate(dream, existingDreams)).toBeNull()
  })

  it('空的现有梦境列表返回 null', () => {
    const dream = createValidDream()
    expect(findSuspectedDuplicate(dream, [])).toBeNull()
  })
})

describe('analyzeImport - 综合导入分析', () => {
  const existingDreams: Dream[] = [
    createValidDream({
      id: 'existing-1',
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '已存在的梦境内容',
    }),
  ]

  it('应该正确识别全新的有效梦境', () => {
    const newDream = createValidDream({
      id: 'new-1',
      date: '2024-01-20',
      wakeTime: '08:00',
      text: '全新的梦境内容，完全不同',
    })
    const result = analyzeImport([newDream], existingDreams)
    expect(result.newCount).toBe(1)
    expect(result.duplicateCount).toBe(0)
    expect(result.suspectedDuplicateCount).toBe(0)
    expect(result.errorCount).toBe(0)
    expect(result.validDreams.length).toBe(1)
  })

  it('应该跳过 ID 重复的梦境', () => {
    const duplicateIdDream = createValidDream({
      id: 'existing-1',
      text: '用了相同的 ID',
    })
    const result = analyzeImport([duplicateIdDream], existingDreams)
    expect(result.newCount).toBe(0)
    expect(result.duplicateCount).toBe(1)
    expect(result.errorCount).toBe(0)
  })

  it('应该识别同日期同醒来时间高相似度的疑似重复', () => {
    const suspectedDream = createValidDream({
      id: 'suspected-1',
      date: '2024-01-15',
      wakeTime: '07:30',
      text: '已存在的梦境内容',
    })
    const result = analyzeImport([suspectedDream], existingDreams)
    expect(result.suspectedDuplicateCount).toBe(1)
    expect(result.newCount).toBe(0)
    expect(result.suspectedDuplicates[0].import).toBe(false)
  })

  it('应该标记格式错误的条目', () => {
    const invalidItems = [
      null,
      { text: '', date: '2024-01-01' },
      { ...createValidDream(), emotionScore: 10 },
    ]
    const result = analyzeImport(invalidItems, existingDreams)
    expect(result.errorCount).toBe(3)
    expect(result.errors.length).toBe(3)
    expect(result.errors[0].index).toBe(1)
    expect(result.errors[1].index).toBe(2)
  })

  it('应该正确处理混合情况：新的、重复的、疑似重复的、错误的', () => {
    const data = [
      createValidDream({ id: 'new-1', date: '2024-02-01', text: '全新内容' }),
      createValidDream({ id: 'existing-1' }),
      createValidDream({
        id: 'suspected-1',
        date: '2024-01-15',
        wakeTime: '07:30',
        text: '已存在的梦境内容',
      }),
      { invalid: 'data' },
    ]
    const result = analyzeImport(data, existingDreams)
    expect(result.newCount).toBe(1)
    expect(result.duplicateCount).toBe(1)
    expect(result.suspectedDuplicateCount).toBe(1)
    expect(result.errorCount).toBe(1)
    expect(result.validDreams.length).toBe(1)
    expect(result.suspectedDuplicates.length).toBe(1)
    expect(result.errors.length).toBe(1)
  })

  it('对于没有 id 的有效梦境应该自动生成 id', () => {
    const dreamWithoutId = {
      text: '没有 ID 的梦境',
      date: '2024-01-20',
      wakeTime: '09:00',
      emotionScore: 3,
      clarityScore: 4,
      people: [],
      places: [],
      keywords: [],
    }
    const result = analyzeImport([dreamWithoutId], existingDreams)
    expect(result.newCount).toBe(1)
    expect(result.validDreams[0].id).toBeDefined()
    expect(result.validDreams[0].createdAt).toBeDefined()
  })
})
