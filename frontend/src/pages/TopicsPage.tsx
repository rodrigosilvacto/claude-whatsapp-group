import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topicAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader,
  AlertCircle,
  Bookmark,
  Sparkles,
} from 'lucide-react'

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
    { value: 'all', label: 'Todos os resumos' },
    { value: 'pending', label: 'Para revisar' },
    { value: 'approved', label: 'Aprovados' },
  ] as const

  const pendingCount = topics.filter((t) => t.status === 'pending').length

  return (
    <div className="space-y-5">
      <section className="surface-card p-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="w-full max-w-xs">
            <label className="field-label">Mostrar</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | 'pending' | 'approved')}
              className="field-input"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-brand-50 text-brand-700 border-brand-100">
              <Sparkles className="w-3.5 h-3.5" />
              {topics.length} na tela
            </span>
            {pendingCount > 0 && (
              <span className="chip bg-amber-50 text-amber-800 border-amber-100">
                <Clock className="w-3.5 h-3.5" />
                {pendingCount} aguardando sua decisão
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          Ao aprovar, o resumo fica salvo. Ao cancelar, ele some da lista e não aparece mais.
        </p>
      </section>

      <div className="space-y-4">
        {isLoading ? (
          <div className="surface-card flex flex-col items-center justify-center py-20">
            <Loader className="w-7 h-7 animate-spin text-brand-700 mb-3" />
            <p className="text-slate-600 text-sm">Carregando resumos...</p>
          </div>
        ) : isError ? (
          <div className="surface-card flex flex-col items-center justify-center py-20 px-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-ink text-sm font-semibold">Não foi possível carregar os resumos</p>
            <p className="text-slate-500 text-xs mt-2">
              {error instanceof Error ? error.message : 'Tente novamente em instantes.'}
            </p>
          </div>
        ) : topics.length > 0 ? (
          topics.map((topic, index) => (
            <article
              key={topic.id}
              className="surface-card p-5 sm:p-6 hover:border-brand-200 transition-colors"
              style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold text-ink leading-snug">
                    {topic.topic_title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(topic.date_discussed + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {topic.message_count != null && <> · baseada em {topic.message_count} mensagens</>}
                  </p>
                </div>
                <span
                  className={`chip whitespace-nowrap ${
                    topic.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-100'
                  }`}
                >
                  {topic.status === 'approved' ? 'Aprovado' : 'Para revisar'}
                </span>
              </div>

              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap mb-5">
                {topic.discussion_summary}
              </p>

              {topic.references_mentioned && topic.references_mentioned.length > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-sand/70 border border-slate-200/70">
                  <p className="text-xs font-semibold text-slate-600 mb-2 inline-flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" />
                    Referências encontradas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topic.references_mentioned.map((ref, idx) => (
                      <span
                        key={idx}
                        className="chip bg-white text-brand-800 border-brand-100"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {topic.status === 'pending' && (
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={() => updateMutation.mutate({ id: topic.id, nextStatus: 'approved' })}
                    disabled={updateMutation.isPending}
                    className="btn-success"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprovar resumo
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: topic.id, nextStatus: 'rejected' })}
                    disabled={updateMutation.isPending}
                    className="btn-ghost-danger"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="surface-card flex flex-col items-center justify-center py-20 px-6 text-center">
            <Clock className="w-11 h-11 text-slate-300 mb-3" />
            <p className="text-ink text-sm font-semibold">Nenhum resumo por aqui ainda</p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Vá em Conversas e toque em &quot;Gerar resumo com IA&quot; para criar os primeiros.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
