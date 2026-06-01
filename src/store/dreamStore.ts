import { create } from 'zustand'
import type { Dream } from '@/types/dream'

const STORAGE_KEY = 'dreamscope_dreams'

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

interface DreamStore {
  dreams: Dream[]
  selectedKeyword: string | null
  sidebarOpen: boolean
  addDream: (dream: Omit<Dream, 'id' | 'createdAt'>) => void
  deleteDream: (id: string) => void
  selectKeyword: (keyword: string | null) => void
  setSidebarOpen: (open: boolean) => void
  getFilteredDreams: () => Dream[]
  getRecentTags: (type: 'people' | 'places' | 'keywords') => string[]
}

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: loadDreams(),
  selectedKeyword: null,
  sidebarOpen: false,

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
}))
