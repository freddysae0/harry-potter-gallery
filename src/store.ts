import { create } from 'zustand'

interface AppState {
  rotationSpeed: number
  setRotationSpeed: (speed: number) => void
}

export const useStore = create<AppState>((set) => ({
  rotationSpeed: 1,
  setRotationSpeed: (speed: number) => set({ rotationSpeed: speed }),
}))
