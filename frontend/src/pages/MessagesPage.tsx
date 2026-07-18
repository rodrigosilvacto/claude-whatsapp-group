import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { messageAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { Loader, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react'

export default function MessagesPage() {
  const { groupId, startDate, endDate } = useFilterStore()
  const [isSummarizing, setIsSummarizing] = useState(false)

  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['messages', groupId, startDate, endDate],
    queryFn: () => messageAPI.getMessages(groupId, startDate, endDate, 500),
    enabled: !!groupId,
  })

  const summarizeMutation = useMutation({
    mutationFn: () => messageAPI.summarize(groupId, startDate, endDate),
    onSuccess: () => {
      setIsSummarizing(false)
      refetch()
    },
    onError: (error) => {
      setIsSummarizing(false)
      console.error(error)
    },
  })

  const handleSummarize = () => {
    setIsSummarizing(true)
    summarizeMutation.mutate()
  }

  const messages = messagesData?.messages || []
  const processedCount = messages.filter(m => m.is_processed).length

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mensagens Capturadas</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {messages.length} mensagens · {processedCount} processadas · {startDate} a {endDate}
            </p>
          </div>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing || messages.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSummarizing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Resumindo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Resumir Mensagens
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400">Carregando mensagens...</p>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
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

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                      {message.sender_name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                          {message.sender_name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(message.message_timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {message.is_processed && (
                        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs font-medium">Processada</span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed break-words">
                      {message.message_text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Nenhuma mensagem encontrada para o período selecionado
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
