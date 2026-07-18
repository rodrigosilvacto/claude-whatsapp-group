import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { messageAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { Loader, Send } from 'lucide-react'

export default function MessagesPage() {
  const { groupId, startDate, endDate } = useFilterStore()
  const [isSummarizing, setIsSummarizing] = useState(false)

  // Fetch messages
  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['messages', groupId, startDate, endDate],
    queryFn: () => messageAPI.getMessages(groupId, startDate, endDate, 500),
    enabled: !!groupId,
  })

  // Mutation for summarization
  const summarizeMutation = useMutation({
    mutationFn: () => messageAPI.summarize(groupId, startDate, endDate),
    onSuccess: () => {
      setIsSummarizing(false)
      refetch()
      alert('✅ Summarization completed!')
    },
    onError: (error) => {
      setIsSummarizing(false)
      alert('❌ Error during summarization')
      console.error(error)
    },
  })

  const handleSummarize = () => {
    setIsSummarizing(true)
    summarizeMutation.mutate()
  }

  const messages = messagesData?.messages || []

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Captured Messages</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {messages.length} messages from {startDate} to {endDate}
            </p>
          </div>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing || messages.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSummarizing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Summarize
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {messages.map((message) => (
              <div key={message.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{message.sender_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(message.message_timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    message.is_processed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {message.is_processed ? '✓ Processed' : 'Pending'}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm break-words">{message.message_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500 dark:text-gray-400">No messages found for the selected period</p>
          </div>
        )}
      </div>
    </div>
  )
}
