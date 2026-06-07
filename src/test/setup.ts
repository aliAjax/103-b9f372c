import { beforeEach } from 'vitest'

class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  get length(): number {
    return Object.keys(this.store).length
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] || null
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
})

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    configurable: true,
  })
}

let uuidCounter = 0
globalThis.crypto.randomUUID = () => {
  uuidCounter++
  return `00000000-0000-4000-8000-${uuidCounter.toString().padStart(12, '0')}` as `${string}-${string}-${string}-${string}-${string}`
}

beforeEach(() => {
  window.localStorage.clear()
  uuidCounter = 0
})
