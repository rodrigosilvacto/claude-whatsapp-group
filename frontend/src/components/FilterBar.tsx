import { useQuery } from '@tanstack/react-query'
import { groupAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { CalendarDays, RotateCcw, UsersRound } from 'lucide-react'

export default function FilterBar() {
  const { groupId, startDate, endDate, setGroupId, setDateRange, reset } = useFilterStore()

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupAPI.getGroups,
  })

  return (
    <div className="surface-card p-4 sm:p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-ink">O que você quer ver?</p>
          <p className="text-xs text-slate-500 mt-1">
            Escolha o grupo e o período. O restante a gente organiza.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="field-label">
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="w-3.5 h-3.5" />
              Grupo
            </span>
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={isLoading}
            className="field-input"
          >
            {groups.length === 0 && <option value={groupId}>Carregando grupos...</option>}
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.group_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              De
            </span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setDateRange(e.target.value, endDate)}
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Até
            </span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setDateRange(startDate, e.target.value)}
            className="field-input"
          />
        </div>

        <button type="button" onClick={reset} className="btn-secondary w-full xl:w-auto">
          <RotateCcw className="w-4 h-4" />
          Limpar filtros
        </button>
      </div>
    </div>
  )
}
