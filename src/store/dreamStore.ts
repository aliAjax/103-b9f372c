import { create } from 'zustand'
import type { Dream, Backup } from '@/types/dream'

const STORAGE_KEY = 'dreamscope_dreams'
const BACKUP_STORAGE_KEY = 'dreamscope_backups'

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
}

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: loadDreams(),
  selectedKeyword: null,
  sidebarOpen: false,
  backups: loadBackups(),

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

    const { dreams, selectedKeyword } = get()
    const trimmedNewName = newName.trim()

    const updated = dreams.map((dream) => {
      const tags = dream[type]
      if (!tags.includes(oldName)) return dream

      const newTags = tags
        .map((t) => (t === oldName ? trimmedNewName : t))
        .filter((t, i, arr) => arr.indexOf(t) === i)

      return { ...dream, [type]: newTags }
    })

    saveDreams(updated)

    const newSelectedKeyword =
      selectedKeyword === oldName ? trimmedNewName : selectedKeyword

    set({ dreams: updated, selectedKeyword: newSelectedKeyword })
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
}))
