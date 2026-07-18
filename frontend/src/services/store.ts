import { create } from 'zustand'

interface FilterState {
  groupId: string
  startDate: string
  endDate: string
  status: 'all' | 'pending' | 'approved' | 'rejected'
  setGroupId: (id: string) => void
  setDateRange: (start: string, end: string) => void
  setStatus: (status: 'all' | 'pending' | 'approved' | 'rejected') => void
  reset: () => void
}

const today = new Date()
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

export const useFilterStore = create<FilterState>((set) => ({
  groupId: '559999999999-1234567890@g.us', // Default group (substitua com o seu)
  startDate: yesterday.toISOString().split('T')[0],
  endDate: today.toISOString().split('T')[0],
  status: 'pending',

  setGroupId: (id: string) => set({ groupId: id }),
  setDateRange: (start: string, end: string) => set({ startDate: start, endDate: end }),
  setStatus: (status) => set({ status }),

  reset: () => set({
    startDate: yesterday.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    status: 'pending',
  }),
}))
