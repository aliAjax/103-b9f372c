import { create } from 'zustand'
import type { Dream, Backup, SearchView, SearchViewFilters } from '@/types/dream'

const STORAGE_KEY = 'dreamscope_dreams'
const BACKUP_STORAGE_KEY = 'dreamscope_backups'
const SEARCH_VIEWS_STORAGE_KEY = 'dreamscope_search_views'

function loadDreams(): Dream[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDreams(dreams: Dream[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams))
}

function loadBackups(): Backup[] {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveBackups(backups: Backup[]) {
  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups))
}

function loadSearchViews(): SearchView[] {
  try {
    const raw = localStorage.getItem(SEARCH_VIEWS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSearchViews(views: SearchView[]) {
  localStorage.setItem(SEARCH_VIEWS_STORAGE_KEY, JSON.stringify(views))
}

interface TagCount {
  name: string
  count: number
}

interface AllTags {
  people: TagCount[]
  places: TagCount[]
  keywords: TagCount[]
}

interface DreamStore {
  dreams: Dream[]
  selectedKeyword: string | null
  sidebarOpen: boolean
  addDream: (dream: Omit<Dream, 'id' | 'createdAt'>) => void
  updateDream: (id: string, updates: Omit<Partial<Dream>, 'id' | 'createdAt'>) => void
  deleteDream: (id: string) => void
  selectKeyword: (keyword: string | null) => void
  setSidebarOpen: (open: boolean) => void
  getFilteredDreams: () => Dream[]
  getRecentTags: (type: 'people' | 'places' | 'keywords') => string[]
  getAllTags: () => AllTags
  renameTag: (type: 'people' | 'places' | 'keywords', oldName: string, newName: string) => void
  importDreams: (dreams: Dream[]) => void
  backups: Backup[]
  createBackup: (name: string) => Backup
  deleteBackup: (id: string) => void
  restoreBackup: (id: string) => void
  refreshBackups: () => void
  searchViews: SearchView[]
  createSearchView: (name: string, filters: SearchViewFilters) => SearchView
  updateSearchView: (id: string, updates: Partial<Pick<SearchView, 'name' | 'filters'>>) => void
  deleteSearchView: (id: string) => void
  refreshSearchViews: () => void
}

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: loadDreams(),
  selectedKeyword: null,
  sidebarOpen: false,
  backups: loadBackups(),
  searchViews: loadSearchViews(),

  addDream: (dream) => {
    const newDream: Dream = {
      ...dream,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    const updated = [newDream, ...get().dreams]
    saveDreams(updated)
    set({ dreams: updated })
  },

  updateDream: (id, updates) => {
    const updated = get().dreams.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    )
    saveDreams(updated)
    set({ dreams: updated })
  },

  deleteDream: (id) => {
    const updated = get().dreams.filter((d) => d.id !== id)
    saveDreams(updated)
    set({ dreams: updated })
  },

  selectKeyword: (keyword) => {
    set({ selectedKeyword: keyword, sidebarOpen: keyword !== null })
  },

  setSidebarOpen: (open) => {
    if (!open) {
      set({ sidebarOpen: false, selectedKeyword: null })
    } else {
      set({ sidebarOpen: true })
    }
  },

  getFilteredDreams: () => {
    const { dreams, selectedKeyword } = get()
    if (!selectedKeyword) return dreams
    return dreams.filter(
      (d) =>
        d.keywords.includes(selectedKeyword) ||
        d.people.includes(selectedKeyword) ||
        d.places.includes(selectedKeyword)
    )
  },

  getRecentTags: (type) => {
    const dreams = get().dreams
    const tagMap = new Map<string, number>()
    dreams.forEach((d) => {
      d[type].forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag)
  },

  getAllTags: () => {
    const dreams = get().dreams
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

    const mapToSortedArray = (map: Map<string, number>): TagCount[] =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    return {
      people: mapToSortedArray(peopleMap),
      places: mapToSortedArray(placesMap),
      keywords: mapToSortedArray(keywordsMap),
    }
  },

  renameTag: (type, oldName, newName) => {
    if (!oldName.trim() || !newName.trim() || oldName === newName) return

    const { dreams, selectedKeyword, searchViews } = get()
    const trimmedNewName = newName.trim()
    const trimmedOldName = oldName.trim()

    const updated = dreams.map((dream) => {
      const tags = dream[type]
      if (!tags.includes(trimmedOldName)) return dream

      const newTags = tags
        .map((t) => (t === trimmedOldName ? trimmedNewName : t))
        .filter((t, i, arr) => arr.indexOf(t) === i)

      return { ...dream, [type]: newTags }
    })

    const filterFieldMap: Record<string, keyof SearchViewFilters> = {
      people: 'person',
      places: 'place',
      keywords: 'keyword',
    }
    const filterField = filterFieldMap[type]

    const updatedViews = searchViews.map((view) => {
      const filterValue = view.filters[filterField]
      if (!filterValue) return view

      if (filterValue.toLowerCase().includes(trimmedOldName.toLowerCase())) {
        const newValue = filterValue.replace(
          new RegExp(trimmedOldName, 'i'),
          trimmedNewName
        )
        return {
          ...view,
          filters: { ...view.filters, [filterField]: newValue },
          updatedAt: new Date().toISOString(),
        }
      }
      return view
    })

    saveDreams(updated)
    saveSearchViews(updatedViews)

    const newSelectedKeyword =
      selectedKeyword === trimmedOldName ? trimmedNewName : selectedKeyword

    set({ dreams: updated, selectedKeyword: newSelectedKeyword, searchViews: updatedViews })
  },

  importDreams: (dreams) => {
    const existingIds = new Set(get().dreams.map((d) => d.id))
    const newDreams = dreams
      .filter((d) => !existingIds.has(d.id))
      .map((d) => ({
        ...d,
        id: d.id || crypto.randomUUID(),
        createdAt: d.createdAt || new Date().toISOString(),
      }))
    const updated = [...newDreams, ...get().dreams]
    saveDreams(updated)
    set({ dreams: updated })
  },

  createBackup: (name) => {
    const { dreams, backups } = get()
    const newBackup: Backup = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      dreamCount: dreams.length,
      dreams: JSON.parse(JSON.stringify(dreams)),
    }
    const updatedBackups = [newBackup, ...backups]
    saveBackups(updatedBackups)
    set({ backups: updatedBackups })
    return newBackup
  },

  deleteBackup: (id) => {
    const updatedBackups = get().backups.filter((b) => b.id !== id)
    saveBackups(updatedBackups)
    set({ backups: updatedBackups })
  },

  restoreBackup: (id) => {
    const backup = get().backups.find((b) => b.id === id)
    if (!backup) return
    const restoredDreams = JSON.parse(JSON.stringify(backup.dreams))
    saveDreams(restoredDreams)
    set({ dreams: restoredDreams, selectedKeyword: null, sidebarOpen: false })
  },

  refreshBackups: () => {
    set({ backups: loadBackups() })
  },

  createSearchView: (name, filters) => {
    const { searchViews } = get()
    const now = new Date().toISOString()
    const newView: SearchView = {
      id: crypto.randomUUID(),
      name: name.trim(),
      filters: { ...filters },
      createdAt: now,
      updatedAt: now,
    }
    const updated = [newView, ...searchViews]
    saveSearchViews(updated)
    set({ searchViews: updated })
    return newView
  },

  updateSearchView: (id, updates) => {
    const { searchViews } = get()
    const updated = searchViews.map((view) =>
      view.id === id
        ? {
            ...view,
            ...(updates.name ? { name: updates.name.trim() } : {}),
            ...(updates.filters ? { filters: { ...updates.filters } } : {}),
            updatedAt: new Date().toISOString(),
          }
        : view
    )
    saveSearchViews(updated)
    set({ searchViews: updated })
  },

  deleteSearchView: (id) => {
    const { searchViews } = get()
    const updated = searchViews.filter((v) => v.id !== id)
    saveSearchViews(updated)
    set({ searchViews: updated })
  },

  refreshSearchViews: () => {
    set({ searchViews: loadSearchViews() })
  },
}))
