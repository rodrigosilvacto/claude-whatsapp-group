import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topicAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { CheckCircle2, XCircle, Clock, Loader, Sparkles } from 'lucide-react'

export default function TopicsPage() {
  const { groupId, startDate, endDate, status, setStatus } = useFilterStore()
  const queryClient = useQueryClient()

  const { data: topicsData, isLoading } = useQuery({
    queryKey: ['topics', groupId, status, startDate, endDate],
    queryFn: () => topicAPI.getTopics(groupId, status, startDate, endDate),
    enabled: !!groupId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      topicAPI.updateTopic(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, status: 'approved' })
  }

  const handleReject = (id: string) => {
    updateMutation.mutate({ id, status: 'rejected' })
  }

  const topics = topicsData || []

  const statusOptions = [
    { value: 'all', label: 'Todos os Tópicos' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'approved', label: 'Aprovados' },
    { value: 'rejected', label: 'Rejeitados' },
  ]

  const statusBadgeColor: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">Filtrar por Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 md:pt-8">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">{topics.length} tópicos encontrados</span>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400">Carregando tópicos...</p>
          </div>
        ) : topics.length > 0 ? (
          topics.map((topic, idx) => (
            <div
              key={topic.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-200 group"
              style={{ animation: `slideIn 0.4s ease-out ${idx * 50}ms` }}
            >
              <style>{`
                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{topic.topic_title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>{new Date(topic.date_discussed).toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span>{topic.message_count} mensagens</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${statusBadgeColor[topic.status] || 'bg-slate-100 text-slate-700'}`}>
                  {topic.status === 'approved' ? 'Aprovado' : topic.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                </span>
              </div>

              <p className="text-slate-700 dark:text-slate-300 mb-5 leading-relaxed">{topic.discussion_summary}</p>

              {/* References */}
              {topic.references_mentioned && topic.references_mentioned.length > 0 && (
                <div className="mb-5 pb-5 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Referências mencionadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.references_mentioned.map((ref, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full font-medium"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {topic.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(topic.id)}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleReject(topic.id)}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Nenhum tópico encontrado para os filtros selecionados</p>
          </div>
        )}
      </div>
    </div>
  )
}
