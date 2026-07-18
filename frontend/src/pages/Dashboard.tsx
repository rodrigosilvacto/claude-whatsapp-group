import { useQuery } from '@tanstack/react-query'
import { messageAPI, topicAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { MessageSquare, CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { groupId, startDate, endDate } = useFilterStore()

  const { data: messagesData } = useQuery({
    queryKey: ['messages', groupId, startDate, endDate],
    queryFn: () => messageAPI.getMessages(groupId, startDate, endDate),
    enabled: !!groupId,
  })

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
    { name: 'Aprovados', value: approvedTopics, color: '#10B981' },
    { name: 'Pendentes', value: pendingTopics, color: '#F59E0B' },
    { name: 'Rejeitados', value: rejectedTopics, color: '#EF4444' },
  ]

  const dailyData = [
    { day: 'Seg', mensagens: 45, topicos: 5 },
    { day: 'Ter', mensagens: 52, topicos: 6 },
    { day: 'Qua', mensagens: 48, topicos: 4 },
    { day: 'Qui', mensagens: 61, topicos: 7 },
    { day: 'Sex', mensagens: 55, topicos: 5 },
  ]

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">{label}</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'approved': return 'Aprovado'
      case 'pending': return 'Pendente'
      case 'rejected': return 'Rejeitado'
      default: return status
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={MessageSquare} label="Total de Mensagens" value={totalMessages} color="bg-blue-600" />
        <StatCard icon={Zap} label="Tópicos Totais" value={totalTopics} color="bg-purple-600" />
        <StatCard icon={CheckCircle2} label="Aprovados" value={approvedTopics} color="bg-emerald-600" />
        <StatCard icon={Clock} label="Pendentes" value={pendingTopics} color="bg-amber-600" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Atividade Diária */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Atividade Diária</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              <Bar dataKey="mensagens" fill="#0066CC" radius={[8, 8, 0, 0]} />
              <Bar dataKey="topicos" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Distribuição de Status */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Status dos Tópicos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Topics */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tópicos Recentes</h3>
        {topicsData && topicsData.length > 0 ? (
          <div className="space-y-3">
            {topicsData.slice(0, 5).map((topic) => (
              <div key={topic.id} className="flex items-start justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{topic.topic_title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{topic.discussion_summary}</p>
                  {topic.message_count && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      {topic.message_count} mensagens
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${statusColors[topic.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700'}`}>
                  {getStatusLabel(topic.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum tópico encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
