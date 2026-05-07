import { createStore } from 'zustand/vanilla'

interface AppState {
  ready: boolean
  totalCount: number
  loadedCount: number
  wallWidth: number
  wallHeight: number
}

export const store = createStore<AppState>(() => ({
  ready: false,
  totalCount: 0,
  loadedCount: 0,
  wallWidth: 40,
  wallHeight: 28,
}))
