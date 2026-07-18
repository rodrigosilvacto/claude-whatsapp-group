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
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  FileText,
  Loader,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

type Props = {
  onGoToTopics: () => void
}

export default function Dashboard({ onGoToTopics }: Props) {
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
    { name: 'Para revisar', value: pendingTopics, color: '#b45309' },
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

  if (isLoading) {
    return (
      <div className="surface-card flex flex-col items-center justify-center py-24">
        <Loader className="w-7 h-7 animate-spin text-brand-700 mb-3" />
        <p className="text-slate-600 text-sm">Montando a visão geral...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="surface-card flex flex-col items-center justify-center py-24">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-ink text-sm font-semibold">Não foi possível carregar a visão geral</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pendingTopics > 0 && (
        <section className="surface-card p-5 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                Você tem {pendingTopics} resumo{pendingTopics > 1 ? 's' : ''} para revisar
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Dê uma olhada rápida e aprove o que importa para o time.
              </p>
            </div>
            <button onClick={onGoToTopics} className="btn-primary">
              Revisar agora
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: 'Mensagens no período', value: totalMessages },
          { icon: FileText, label: 'Resumos gerados', value: totalTopics },
          { icon: CheckCircle2, label: 'Aprovados', value: approvedTopics },
          { icon: Clock, label: 'Para revisar', value: pendingTopics },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">{item.label}</p>
                  <p className="font-display text-3xl font-semibold text-ink">{item.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 surface-card p-5">
          <h3 className="font-display text-lg font-semibold text-ink mb-4">Movimento do grupo</h3>
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
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="mensagens" fill="#123f5f" radius={[8, 8, 0, 0]} name="Mensagens" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
              Ainda sem mensagens neste período
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <h3 className="font-display text-lg font-semibold text-ink mb-4">Situação dos resumos</h3>
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
                    <span className="font-semibold text-ink">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-slate-500 text-center px-4">
              Gere o primeiro resumo nas Conversas para ver o painel preenchido
            </div>
          )}
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-display text-lg font-semibold text-ink">Últimos resumos</h3>
          <button onClick={onGoToTopics} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Ver todos
          </button>
        </div>
        {topicsData.length > 0 ? (
          <div className="space-y-2">
            {topicsData.slice(0, 5).map((topic) => (
              <div
                key={topic.id}
                className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-ink text-sm">{topic.topic_title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{topic.discussion_summary}</p>
                  {topic.references_mentioned && topic.references_mentioned.length > 0 && (
                    <p className="text-xs text-brand-700 mt-2 font-medium">
                      {topic.references_mentioned.length} referência(s)
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                  {topic.status === 'approved' ? 'Aprovado' : 'Para revisar'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">Nenhum resumo disponível ainda</p>
        )}
      </div>
    </div>
  )
}
