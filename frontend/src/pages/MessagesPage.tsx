import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatMessageText, messageAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import {
  Loader,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock3,
} from 'lucide-react'

type Props = {
  onGoToTopics: () => void
}

export default function MessagesPage({ onGoToTopics }: Props) {
  const { groupId, startDate, endDate } = useFilterStore()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  )
  const [createdCount, setCreatedCount] = useState(0)

  const { data: messagesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['messages', groupId, startDate, endDate],
    queryFn: () => messageAPI.getMessages(groupId, startDate, endDate, 500),
    enabled: !!groupId,
  })

  const summarizeMutation = useMutation({
    mutationFn: () => messageAPI.summarize(groupId, startDate, endDate),
    onSuccess: (data) => {
      const count = data.topics?.length || 0
      setCreatedCount(count)
      setFeedback({
        type: count > 0 ? 'success' : 'info',
        text: data.message || 'Resumo concluído.',
      })
      refetch()
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
    onError: (err) => {
      const axiosMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setFeedback({
        type: 'error',
        text: axiosMsg || (err instanceof Error ? err.message : 'Não conseguimos gerar o resumo agora.'),
      })
    },
  })

  const messages = messagesData?.messages || []
  const processedCount = messages.filter((m) => m.is_processed).length
  const pendingCount = messages.length - processedCount
  const isSummarizing = summarizeMutation.isPending

  return (
    <div className="space-y-5">
      <section className="surface-card p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-brand-50 to-transparent pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-brand-50 text-brand-700 border-brand-100">
                <MessageSquare className="w-3.5 h-3.5" />
                {messagesData?.count ?? messages.length} mensagens
              </span>
              <span className="chip bg-amber-50 text-amber-800 border-amber-100">
                <Clock3 className="w-3.5 h-3.5" />
                {pendingCount} aguardando resumo
              </span>
              <span className="chip bg-emerald-50 text-emerald-800 border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {processedCount} já resumidas
              </span>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">Quer um resumo inteligente?</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                A IA lê as conversas novas, organiza os assuntos e destaca referências importantes
                para você decidir o que aprovar.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFeedback(null)
              setCreatedCount(0)
              summarizeMutation.mutate()
            }}
            disabled={isSummarizing || pendingCount === 0}
            className="btn-primary min-w-[200px]"
          >
            {isSummarizing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                A IA está lendo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar resumo com IA
              </>
            )}
          </button>
        </div>

        {feedback && (
          <div
            className={`relative mt-5 rounded-xl px-4 py-3 text-sm border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                : feedback.type === 'error'
                  ? 'bg-red-50 border-red-100 text-red-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p>{feedback.text}</p>
              {feedback.type === 'success' && createdCount > 0 && (
                <button onClick={onGoToTopics} className="btn-secondary shrink-0">
                  Ver resumos
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-7 h-7 animate-spin text-brand-700 mb-3" />
            <p className="text-slate-600 text-sm">Buscando conversas do grupo...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-ink text-sm font-semibold">Não foi possível carregar as conversas</p>
            <p className="text-slate-500 text-xs mt-2 max-w-md">
              {error instanceof Error ? error.message : 'Tente novamente em instantes.'}
            </p>
            <button onClick={() => refetch()} className="btn-secondary mt-4">
              Tentar novamente
            </button>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {messages.map((message, index) => (
              <article
                key={message.id}
                className="p-5 hover:bg-slate-50/70 transition-colors"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-brand-700 text-white font-semibold text-sm flex items-center justify-center">
                    {(message.sender_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div>
                        <h4 className="font-semibold text-ink text-sm">
                          {message.sender_name || 'Participante'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(message.message_timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {message.is_processed ? (
                        <span className="chip bg-emerald-50 text-emerald-700 border-emerald-100">
                          Já resumida
                        </span>
                      ) : (
                        <span className="chip bg-amber-50 text-amber-800 border-amber-100">
                          Nova
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {formatMessageText(message.message_text)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <MessageSquare className="w-11 h-11 text-slate-300 mb-3" />
            <p className="text-ink text-sm font-semibold">Ainda não há conversas neste período</p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Assim que o grupo receber mensagens, elas aparecerão aqui automaticamente.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
