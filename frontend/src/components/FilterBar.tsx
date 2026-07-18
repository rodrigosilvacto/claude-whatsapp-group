import { useQuery } from '@tanstack/react-query'
import { groupAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { CalendarRange, RefreshCw, Users } from 'lucide-react'

export default function FilterBar() {
  const { groupId, startDate, endDate, setGroupId, setDateRange, reset } = useFilterStore()

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupAPI.getGroups,
  })

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            <Users className="w-3.5 h-3.5" />
            Grupo monitorado
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366]"
          >
            {groups.length === 0 && (
              <option value={groupId}>Grupo padrão</option>
            )}
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.group_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            <CalendarRange className="w-3.5 h-3.5" />
            Data inicial
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setDateRange(e.target.value, endDate)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366]"
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            <CalendarRange className="w-3.5 h-3.5" />
            Data final
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setDateRange(startDate, e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366]"
          />
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Redefinir
        </button>
      </div>
    </div>
  )
}
