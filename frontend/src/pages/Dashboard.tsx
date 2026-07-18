import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { messageAPI, topicAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
  const { groupId, startDate, endDate } = useFilterStore()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch messages
  const { data: messagesData } = useQuery({
    queryKey: ['messages', groupId, startDate, endDate],
    queryFn: () => messageAPI.getMessages(groupId, startDate, endDate),
    enabled: !!groupId,
  })

  // Fetch topics
  const { data: topicsData } = useQuery({
    queryKey: ['topics', groupId, 'all', startDate, endDate],
    queryFn: () => topicAPI.getTopics(groupId, 'all', startDate, endDate),
    enabled: !!groupId,
  })

  const totalMessages = messagesData?.count || 0
  const totalTopics = topicsData?.length || 0
  const approvedTopics = topicsData?.filter(t => t.status === 'approved').length || 0
  const pendingTopics = topicsData?.filter(t => t.status === 'pending').length || 0
  const rejectedTopics = topicsData?.filter(t => t.status === 'rejected').length || 0

  const statusData = [
    { name: 'Approved', value: approvedTopics, color: '#10B981' },
    { name: 'Pending', value: pendingTopics, color: '#F59E0B' },
    { name: 'Rejected', value: rejectedTopics, color: '#EF4444' },
  ]

  const dailyData = [
    { day: 'Mon', messages: 45, topics: 5 },
    { day: 'Tue', messages: 52, topics: 6 },
    { day: 'Wed', messages: 48, topics: 4 },
    { day: 'Thu', messages: 61, topics: 7 },
    { day: 'Fri', messages: 55, topics: 5 },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Messages</p>
              <p className="text-3xl font-bold mt-2">{totalMessages}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-blue-500 opacity-10" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Approved Topics</p>
              <p className="text-3xl font-bold mt-2">{approvedTopics}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-10" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pending Topics</p>
              <p className="text-3xl font-bold mt-2">{pendingTopics}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-10" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Topics</p>
              <p className="text-3xl font-bold mt-2">{totalTopics}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-500 opacity-10" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="messages" fill="#3B82F6" />
              <Bar dataKey="topics" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Topics Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={() => ''} outerRadius={100} fill="#8884d8" dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Topics */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Topics</h3>
        {topicsData && topicsData.length > 0 ? (
          <div className="space-y-4">
            {topicsData.slice(0, 5).map((topic) => (
              <div key={topic.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{topic.topic_title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{topic.discussion_summary}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${
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
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No topics found</p>
        )}
      </div>
    </div>
  )
}
