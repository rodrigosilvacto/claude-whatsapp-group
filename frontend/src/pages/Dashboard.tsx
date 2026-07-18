import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { messageAPI, topicAPI } from '../services/api'
import { useFilterStore } from '../services/store'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { MessageSquare, CheckCircle2, Clock, FileText, Loader, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const { groupId, startDate, endDate } = useFilterStore()

  const {
    data: messagesData,
    isLoading: loadingMessages,
    isError: errorMessages,
  } = useQuery({
    queryKey: ['messages', groupId, startDate, endDate],
    queryFn: () => messageAPI.getMessages(groupId, startDate, endDate, 500),
    enabled: !!groupId,
  })

  const {
    data: topicsData = [],
    isLoading: loadingTopics,
    isError: errorTopics,
  } = useQuery({
    queryKey: ['topics', groupId, 'all', startDate, endDate],
    queryFn: () => topicAPI.getTopics(groupId, 'all', startDate, endDate),
    enabled: !!groupId,
  })

  const totalMessages = messagesData?.count || 0
  const totalTopics = topicsData.length
  const approvedTopics = topicsData.filter((t) => t.status === 'approved').length
  const pendingTopics = topicsData.filter((t) => t.status === 'pending').length

  const statusData = [
    { name: 'Aprovados', value: approvedTopics, color: '#047857' },
    { name: 'Aguardando aprovação', value: pendingTopics, color: '#b45309' },
  ].filter((item) => item.value > 0)

  const dailyData = useMemo(() => {
    const messages = messagesData?.messages || []
    const byDay = new Map<string, number>()

    for (const message of messages) {
      const day = new Date(message.message_timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
      byDay.set(day, (byDay.get(day) || 0) + 1)
    }

    return Array.from(byDay.entries())
      .map(([day, mensagens]) => ({ day, mensagens }))
      .reverse()
  }, [messagesData])

  const isLoading = loadingMessages || loadingTopics
  const isError = errorMessages || errorTopics

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof MessageSquare
    label: string
    value: number
  }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="p-2.5 rounded-md bg-[#003366]/10">
          <Icon className="w-5 h-5 text-[#003366]" />
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-lg">
        <Loader className="w-7 h-7 animate-spin text-[#003366] mb-3" />
        <p className="text-slate-600 text-sm">Carregando indicadores...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-lg">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-800 text-sm font-medium">Não foi possível carregar o painel</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Mensagens" value={totalMessages} />
        <StatCard icon={FileText} label="Tópicos" value={totalTopics} />
        <StatCard icon={CheckCircle2} label="Aprovados" value={approvedTopics} />
        <StatCard icon={Clock} label="Pendentes" value={pendingTopics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Mensagens por dia</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="mensagens" fill="#003366" radius={[4, 4, 0, 0]} name="Mensagens" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
              Sem dados de mensagens no período selecionado
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Situação dos tópicos</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2 border-t border-slate-100 pt-3">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
              Nenhum tópico no período
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Tópicos recentes</h3>
        {topicsData.length > 0 ? (
          <div className="space-y-2">
            {topicsData.slice(0, 5).map((topic) => (
              <div
                key={topic.id}
                className="flex items-start justify-between gap-4 p-3 rounded-md bg-slate-50 border border-slate-100"
              >
                <div className="min-w-0">
                  <h4 className="font-medium text-slate-900 text-sm">{topic.topic_title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{topic.discussion_summary}</p>
                </div>
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  {topic.status === 'approved' ? 'Aprovado' : 'Aguardando aprovação'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">Nenhum tópico disponível</p>
        )}
      </div>
    </div>
  )
}
