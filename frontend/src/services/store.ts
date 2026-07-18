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

function toDateInput(date: Date) {
  return date.toISOString().split('T')[0]
}

const today = new Date()
const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

export const useFilterStore = create<FilterState>((set) => ({
  groupId: 'group-120363429239267932-group',
  startDate: toDateInput(sevenDaysAgo),
  endDate: toDateInput(today),
  status: 'all',

  setGroupId: (id: string) => set({ groupId: id }),
  setDateRange: (start: string, end: string) => set({ startDate: start, endDate: end }),
  setStatus: (status) => set({ status }),

  reset: () =>
    set({
      startDate: toDateInput(sevenDaysAgo),
      endDate: toDateInput(today),
      status: 'all',
    }),
}))
