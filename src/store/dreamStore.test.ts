import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDreamStore } from './dreamStore'
import type { Dream, SearchViewFilters } from '@/types/dream'

const createTestDream = (overrides: Partial<Dream> = {}): Omit<Dream, 'id' | 'createdAt'> => ({
  text: '测试梦境内容',
  date: '2024-01-01',
  wakeTime: '07:00',
  emotionScore: 3,
  clarityScore: 4,
  people: ['小明', '小红'],
  places: ['学校', '公园'],
  keywords: ['飞翔', '考试'],
  ...overrides,
})

describe('dreamStore - 梦境增删改', () => {
  beforeEach(() => {
    useDreamStore.setState({
      dreams: [],
      selectedKeyword: null,
      sidebarOpen: false,
      backups: [],
      searchViews: [],
    })
  })

  it('addDream - 应该添加新梦境并生成 id 和 createdAt', () => {
    const { addDream } = useDreamStore.getState()
    const dreamData = createTestDream()

    addDream(dreamData)

    const updatedDreams = useDreamStore.getState().dreams
    expect(updatedDreams.length).toBe(1)
    expect(updatedDreams[0]).toMatchObject(dreamData)
    expect(updatedDreams[0].id).toBeDefined()
    expect(updatedDreams[0].createdAt).toBeDefined()
  })

  it('addDream - 新梦境应该在列表最前面', () => {
    const { addDream } = useDreamStore.getState()

    addDream(createTestDream({ text: '第一个梦' }))
    addDream(createTestDream({ text: '第二个梦' }))

    const dreams = useDreamStore.getState().dreams
    expect(dreams[0].text).toBe('第二个梦')
    expect(dreams[1].text).toBe('第一个梦')
  })

  it('updateDream - 应该更新指定 id 的梦境', () => {
    const { addDream, updateDream } = useDreamStore.getState()

    addDream(createTestDream({ text: '原始内容' }))
    const dream = useDreamStore.getState().dreams[0]

    updateDream(dream.id, { text: '更新后的内容', emotionScore: 5 })

    const updatedDream = useDreamStore.getState().dreams[0]
    expect(updatedDream.text).toBe('更新后的内容')
    expect(updatedDream.emotionScore).toBe(5)
    expect(updatedDream.id).toBe(dream.id)
    expect(updatedDream.createdAt).toBe(dream.createdAt)
  })

  it('updateDream - 不存在的 id 应该不影响任何梦境', () => {
    const { addDream, updateDream } = useDreamStore.getState()

    addDream(createTestDream())
    const originalDreams = [...useDreamStore.getState().dreams]

    updateDream('non-existent-id', { text: '不应被更新' })

    expect(useDreamStore.getState().dreams).toEqual(originalDreams)
  })

  it('deleteDream - 应该删除指定 id 的梦境', () => {
    const { addDream, deleteDream } = useDreamStore.getState()

    addDream(createTestDream({ text: '第一个梦' }))
    addDream(createTestDream({ text: '第二个梦' }))
    const firstDream = useDreamStore.getState().dreams[1]

    deleteDream(firstDream.id)

    const dreams = useDreamStore.getState().dreams
    expect(dreams.length).toBe(1)
    expect(dreams[0].text).toBe('第二个梦')
  })

  it('deleteDream - 不存在的 id 应该不影响任何梦境', () => {
    const { addDream, deleteDream } = useDreamStore.getState()

    addDream(createTestDream())
    const originalDreams = [...useDreamStore.getState().dreams]

    deleteDream('non-existent-id')

    expect(useDreamStore.getState().dreams).toEqual(originalDreams)
  })
})

describe('dreamStore - 标签重命名', () => {
  beforeEach(() => {
    useDreamStore.setState({
      dreams: [],
      selectedKeyword: null,
      sidebarOpen: false,
      backups: [],
      searchViews: [],
    })
  })

  it('renameTag - 应该重命名指定类型的标签', () => {
    const { addDream, renameTag } = useDreamStore.getState()

    addDream(createTestDream({ people: ['小明', '小红'], keywords: ['飞翔'] }))
    addDream(createTestDream({ people: ['小明', '小刚'], keywords: ['飞翔', '跑步'] }))

    renameTag('people', '小明', '大明')

    const dreams = useDreamStore.getState().dreams
    expect(dreams[0].people).toContain('大明')
    expect(dreams[0].people).not.toContain('小明')
    expect(dreams[1].people).toContain('大明')
    expect(dreams[1].people).not.toContain('小明')
  })

  it('renameTag - 应该去重重命名后的标签', () => {
    const { addDream, renameTag } = useDreamStore.getState()

    addDream(createTestDream({ people: ['小明', '小红', '大明'] }))

    renameTag('people', '小明', '大明')

    const dreams = useDreamStore.getState().dreams
    expect(dreams[0].people).toEqual(['大明', '小红'])
    expect(dreams[0].people.length).toBe(2)
  })

  it('renameTag - 空字符串或相同名称应该不执行任何操作', () => {
    const { addDream, renameTag } = useDreamStore.getState()

    addDream(createTestDream({ people: ['小明'] }))
    const originalDreams = JSON.parse(JSON.stringify(useDreamStore.getState().dreams))

    renameTag('people', '', '新名称')
    expect(useDreamStore.getState().dreams).toEqual(originalDreams)

    renameTag('people', '小明', '小明')
    expect(useDreamStore.getState().dreams).toEqual(originalDreams)

    renameTag('people', '小明', '  ')
    expect(useDreamStore.getState().dreams).toEqual(originalDreams)
  })

  it('renameTag - 应该同步更新 selectedKeyword', () => {
    const { addDream, renameTag, selectKeyword } = useDreamStore.getState()

    addDream(createTestDream({ keywords: ['飞翔', '跑步'] }))
    selectKeyword('飞翔')

    expect(useDreamStore.getState().selectedKeyword).toBe('飞翔')

    renameTag('keywords', '飞翔', '飞行')

    expect(useDreamStore.getState().selectedKeyword).toBe('飞行')
  })

  it('renameTag - 应该更新搜索视图中的过滤器', () => {
    const { createSearchView, renameTag } = useDreamStore.getState()

    const filters: SearchViewFilters = {
      keyword: '飞翔',
      person: '',
      place: '',
      dateFrom: '',
      dateTo: '',
      text: '',
    }

    createSearchView('测试视图', filters)

    renameTag('keywords', '飞翔', '飞行')

    const searchViews = useDreamStore.getState().searchViews
    expect(searchViews[0].filters.keyword).toBe('飞行')
  })

  it('renameTag - 支持 places 类型标签重命名', () => {
    const { addDream, renameTag } = useDreamStore.getState()

    addDream(createTestDream({ places: ['学校', '公园'] }))

    renameTag('places', '学校', '大学')

    const dreams = useDreamStore.getState().dreams
    expect(dreams[0].places).toContain('大学')
    expect(dreams[0].places).not.toContain('学校')
  })
})

describe('dreamStore - 搜索视图更新', () => {
  beforeEach(() => {
    useDreamStore.setState({
      dreams: [],
      selectedKeyword: null,
      sidebarOpen: false,
      backups: [],
      searchViews: [],
    })
  })

  const testFilters: SearchViewFilters = {
    keyword: '飞翔',
    person: '小明',
    place: '',
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
    text: '',
  }

  it('createSearchView - 应该创建新的搜索视图', () => {
    const { createSearchView } = useDreamStore.getState()

    createSearchView('我的视图', testFilters)

    const searchViews = useDreamStore.getState().searchViews
    expect(searchViews.length).toBe(1)
    expect(searchViews[0].name).toBe('我的视图')
    expect(searchViews[0].filters).toEqual(testFilters)
    expect(searchViews[0].id).toBeDefined()
    expect(searchViews[0].createdAt).toBeDefined()
    expect(searchViews[0].updatedAt).toBeDefined()
  })

  it('createSearchView - 应该自动 trim 名称', () => {
    const { createSearchView } = useDreamStore.getState()

    createSearchView('  带空格的名称  ', testFilters)

    const searchViews = useDreamStore.getState().searchViews
    expect(searchViews[0].name).toBe('带空格的名称')
  })

  it('updateSearchView - 应该更新搜索视图名称和过滤器', () => {
    const { createSearchView, updateSearchView } = useDreamStore.getState()

    const view = createSearchView('旧名称', testFilters)
    const originalUpdatedAt = view.updatedAt

    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)

    updateSearchView(view.id, {
      name: '新名称',
      filters: { ...testFilters, keyword: '游泳' },
    })

    const updatedView = useDreamStore.getState().searchViews[0]
    expect(updatedView.name).toBe('新名称')
    expect(updatedView.filters.keyword).toBe('游泳')
    expect(updatedView.updatedAt).not.toBe(originalUpdatedAt)

    vi.useRealTimers()
  })

  it('updateSearchView - 不存在的 id 应该不影响任何视图', () => {
    const { createSearchView, updateSearchView } = useDreamStore.getState()

    createSearchView('测试视图', testFilters)
    const originalViews = JSON.parse(JSON.stringify(useDreamStore.getState().searchViews))

    updateSearchView('non-existent-id', { name: '不应更新' })

    expect(useDreamStore.getState().searchViews).toEqual(originalViews)
  })

  it('deleteSearchView - 应该删除指定的搜索视图', () => {
    const { createSearchView, deleteSearchView } = useDreamStore.getState()

    const view1 = createSearchView('视图1', testFilters)
    createSearchView('视图2', testFilters)

    deleteSearchView(view1.id)

    const searchViews = useDreamStore.getState().searchViews
    expect(searchViews.length).toBe(1)
    expect(searchViews[0].name).toBe('视图2')
  })

  it('deleteSearchView - 不存在的 id 应该不影响任何视图', () => {
    const { createSearchView, deleteSearchView } = useDreamStore.getState()

    createSearchView('测试视图', testFilters)
    const originalViews = [...useDreamStore.getState().searchViews]

    deleteSearchView('non-existent-id')

    expect(useDreamStore.getState().searchViews).toEqual(originalViews)
  })
})

describe('dreamStore - 备份创建恢复', () => {
  beforeEach(() => {
    useDreamStore.setState({
      dreams: [],
      selectedKeyword: null,
      sidebarOpen: false,
      backups: [],
      searchViews: [],
    })
  })

  it('createBackup - 应该创建包含当前梦境的备份', () => {
    const { addDream, createBackup } = useDreamStore.getState()

    addDream(createTestDream({ text: '梦境1' }))
    addDream(createTestDream({ text: '梦境2' }))

    const backup = createBackup('测试备份')

    expect(backup.name).toBe('测试备份')
    expect(backup.dreamCount).toBe(2)
    expect(backup.dreams.length).toBe(2)
    expect(backup.id).toBeDefined()
    expect(backup.createdAt).toBeDefined()

    const backups = useDreamStore.getState().backups
    expect(backups.length).toBe(1)
    expect(backups[0]).toEqual(backup)
  })

  it('createBackup - 应该自动 trim 名称', () => {
    const { createBackup } = useDreamStore.getState()

    createBackup('  带空格的备份  ')

    const backups = useDreamStore.getState().backups
    expect(backups[0].name).toBe('带空格的备份')
  })

  it('createBackup - 备份应该是深拷贝，不随原数据变化', () => {
    const { addDream, createBackup, updateDream } = useDreamStore.getState()

    addDream(createTestDream({ text: '原始内容' }))
    const dream = useDreamStore.getState().dreams[0]

    const backup = createBackup('备份')
    updateDream(dream.id, { text: '更新内容' })

    expect(backup.dreams[0].text).toBe('原始内容')
    expect(useDreamStore.getState().dreams[0].text).toBe('更新内容')
  })

  it('restoreBackup - 应该恢复指定备份的梦境数据', () => {
    const { addDream, createBackup, restoreBackup, deleteDream } = useDreamStore.getState()

    addDream(createTestDream({ text: '梦境1' }))
    addDream(createTestDream({ text: '梦境2' }))
    const backup = createBackup('我的备份')

    const dreams = useDreamStore.getState().dreams
    deleteDream(dreams[0].id)
    expect(useDreamStore.getState().dreams.length).toBe(1)

    restoreBackup(backup.id)

    const restoredDreams = useDreamStore.getState().dreams
    expect(restoredDreams.length).toBe(2)
    expect(restoredDreams.map((d) => d.text)).toContain('梦境1')
    expect(restoredDreams.map((d) => d.text)).toContain('梦境2')
  })

  it('restoreBackup - 恢复后应该重置选中关键词和侧边栏', () => {
    const { addDream, createBackup, restoreBackup, selectKeyword, setSidebarOpen } = useDreamStore.getState()

    addDream(createTestDream())
    const backup = createBackup('备份')

    selectKeyword('飞翔')
    setSidebarOpen(true)
    expect(useDreamStore.getState().selectedKeyword).toBe('飞翔')
    expect(useDreamStore.getState().sidebarOpen).toBe(true)

    restoreBackup(backup.id)

    expect(useDreamStore.getState().selectedKeyword).toBeNull()
    expect(useDreamStore.getState().sidebarOpen).toBe(false)
  })

  it('restoreBackup - 不存在的备份 id 应该不执行任何操作', () => {
    const { addDream, restoreBackup } = useDreamStore.getState()

    addDream(createTestDream())
    const originalDreams = [...useDreamStore.getState().dreams]

    restoreBackup('non-existent-id')

    expect(useDreamStore.getState().dreams).toEqual(originalDreams)
  })

  it('deleteBackup - 应该删除指定的备份', () => {
    const { createBackup, deleteBackup } = useDreamStore.getState()

    const backup1 = createBackup('备份1')
    createBackup('备份2')

    deleteBackup(backup1.id)

    const backups = useDreamStore.getState().backups
    expect(backups.length).toBe(1)
    expect(backups[0].name).toBe('备份2')
  })
})

describe('dreamStore - 持久化到 localStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useDreamStore.setState({
      dreams: [],
      selectedKeyword: null,
      sidebarOpen: false,
      backups: [],
      searchViews: [],
    })
  })

  it('应该持久化梦境数据到 localStorage', () => {
    const { addDream } = useDreamStore.getState()

    addDream(createTestDream({ text: '持久化测试' }))

    const stored = localStorage.getItem('dreamscope_dreams')
    expect(stored).toBeDefined()
    const parsed = JSON.parse(stored!)
    expect(parsed.length).toBe(1)
    expect(parsed[0].text).toBe('持久化测试')
  })

  it('应该持久化备份数据到 localStorage', () => {
    const { addDream, createBackup } = useDreamStore.getState()

    addDream(createTestDream())
    createBackup('测试备份')

    const stored = localStorage.getItem('dreamscope_backups')
    expect(stored).toBeDefined()
    const parsed = JSON.parse(stored!)
    expect(parsed.length).toBe(1)
    expect(parsed[0].name).toBe('测试备份')
  })

  it('应该持久化搜索视图到 localStorage', () => {
    const { createSearchView } = useDreamStore.getState()

    const filters: SearchViewFilters = {
      keyword: '测试',
      person: '',
      place: '',
      dateFrom: '',
      dateTo: '',
      text: '',
    }
    createSearchView('测试视图', filters)

    const stored = localStorage.getItem('dreamscope_search_views')
    expect(stored).toBeDefined()
    const parsed = JSON.parse(stored!)
    expect(parsed.length).toBe(1)
    expect(parsed[0].name).toBe('测试视图')
  })
})
