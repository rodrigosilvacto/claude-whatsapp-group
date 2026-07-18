import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatMessageText, messageAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { Loader, Sparkles, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react'

export default function MessagesPage() {
  const { groupId, startDate, endDate } = useFilterStore()
  const queryClient = useQueryClient()
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data: messagesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['messages', groupId, startDate, endDate],
    queryFn: () => messageAPI.getMessages(groupId, startDate, endDate, 500),
    enabled: !!groupId,
  })

  const summarizeMutation = useMutation({
    mutationFn: () => messageAPI.summarize(groupId, startDate, endDate),
    onSuccess: (data) => {
      setIsSummarizing(false)
      setFeedback(data.message || 'Resumo gerado com sucesso.')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
    onError: (err) => {
      setIsSummarizing(false)
      const axiosMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setFeedback(axiosMsg || (err instanceof Error ? err.message : 'Falha ao gerar o resumo.'))
    },
  })

  const handleSummarize = () => {
    setFeedback(null)
    setIsSummarizing(true)
    summarizeMutation.mutate()
  }

  const messages = messagesData?.messages || []
  const processedCount = messages.filter((m) => m.is_processed).length
  const pendingCount = messages.length - processedCount

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{messagesData?.count ?? messages.length}</span>{' '}
              mensagem(ns) ·{' '}
              <span className="font-semibold text-slate-900">{pendingCount}</span> pendente(s) de resumo ·{' '}
              <span className="font-semibold text-slate-900">{processedCount}</span> processada(s)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Período: {new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')} a{' '}
              {new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing || pendingCount === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] hover:bg-[#002952] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSummarizing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Gerando resumo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar resumo
              </>
            )}
          </button>
        </div>
        {feedback && (
          <p className="mt-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
            {feedback}
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-7 h-7 animate-spin text-[#003366] mb-3" />
            <p className="text-slate-600 text-sm">Carregando mensagens...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-slate-800 text-sm font-medium">Não foi possível carregar as mensagens</p>
            <p className="text-slate-500 text-xs mt-2 max-w-md">
              {error instanceof Error ? error.message : 'Erro de comunicação com o servidor.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 text-sm font-medium text-[#003366] border border-[#003366]/30 rounded-md hover:bg-[#003366]/5"
            >
              Tentar novamente
            </button>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {messages.map((message) => (
              <div key={message.id} className="p-5 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center text-white font-semibold text-sm">
                    {(message.sender_name || '?').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {message.sender_name || 'Remetente não identificado'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(message.message_timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {message.is_processed && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs font-medium">Processada</span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {formatMessageText(message.message_text)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare className="w-11 h-11 text-slate-300 mb-3" />
            <p className="text-slate-700 text-sm font-medium">Nenhuma mensagem encontrada</p>
            <p className="text-slate-500 text-xs mt-1">
              Ajuste o grupo ou o período selecionado e tente novamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
