import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topicAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { CheckCircle2, XCircle, Clock, Loader, AlertCircle } from 'lucide-react'

export default function TopicsPage() {
  const { groupId, startDate, endDate, status, setStatus } = useFilterStore()
  const queryClient = useQueryClient()

  const { data: topics = [], isLoading, isError, error } = useQuery({
    queryKey: ['topics', groupId, status, startDate, endDate],
    queryFn: () => topicAPI.getTopics(groupId, status, startDate, endDate),
    enabled: !!groupId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'approved' | 'rejected' }) =>
      topicAPI.updateTopic(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'approved', label: 'Aprovados' },
    { value: 'rejected', label: 'Rejeitados' },
  ] as const

  const statusBadgeColor: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    rejected: 'bg-red-50 text-red-700 border-red-100',
  }

  const statusLabel = (value: string) => {
    if (value === 'approved') return 'Aprovado'
    if (value === 'pending') return 'Pendente'
    if (value === 'rejected') return 'Rejeitado'
    return value
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="w-full max-w-xs">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Situação
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{topics.length}</span> tópico(s) encontrado(s)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-lg">
            <Loader className="w-7 h-7 animate-spin text-[#003366] mb-3" />
            <p className="text-slate-600 text-sm">Carregando tópicos...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-lg px-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-slate-800 text-sm font-medium">Não foi possível carregar os tópicos</p>
            <p className="text-slate-500 text-xs mt-2">
              {error instanceof Error ? error.message : 'Erro de comunicação com o servidor.'}
            </p>
          </div>
        ) : topics.length > 0 ? (
          topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{topic.topic_title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(topic.date_discussed + 'T12:00:00').toLocaleDateString('pt-BR')}
                    {topic.message_count != null && <> · {topic.message_count} mensagem(ns)</>}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold border whitespace-nowrap ${
                    statusBadgeColor[topic.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {statusLabel(topic.status)}
                </span>
              </div>

              <p className="text-slate-700 text-sm leading-relaxed mb-4">{topic.discussion_summary}</p>

              {topic.references_mentioned && topic.references_mentioned.length > 0 && (
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Referências
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topic.references_mentioned.map((ref, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {topic.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateMutation.mutate({ id: topic.id, nextStatus: 'approved' })}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: topic.id, nextStatus: 'rejected' })}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-lg">
            <Clock className="w-11 h-11 text-slate-300 mb-3" />
            <p className="text-slate-700 text-sm font-medium">Nenhum tópico encontrado</p>
            <p className="text-slate-500 text-xs mt-1">
              Utilize a opção &quot;Gerar resumo&quot; na tela de mensagens para consolidar discussões.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
