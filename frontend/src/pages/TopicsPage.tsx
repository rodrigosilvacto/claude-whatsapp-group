import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topicAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function TopicsPage() {
  const { groupId, startDate, endDate, status, setStatus } = useFilterStore()
  const queryClient = useQueryClient()

  // Fetch topics
  const { data: topicsData, isLoading } = useQuery({
    queryKey: ['topics', groupId, status, startDate, endDate],
    queryFn: () => topicAPI.getTopics(groupId, status, startDate, endDate),
    enabled: !!groupId,
  })

  // Mutation for updating topic
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-2 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Topics</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-6">
            <span>{topics.length} topics found</span>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : topics.length > 0 ? (
          topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{topic.topic_title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(topic.date_discussed).toLocaleDateString('pt-BR')} • {topic.message_count} messages
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                    topic.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : topic.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {topic.status}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">{topic.discussion_summary}</p>

              {/* References */}
              {topic.references_mentioned && topic.references_mentioned.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">References:</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.references_mentioned.map((ref, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {topic.status === 'pending' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleApprove(topic.id)
                    }}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReject(topic.id)
                    }}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-lg shadow">
            <Clock className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No topics found for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
