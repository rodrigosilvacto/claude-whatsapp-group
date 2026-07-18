import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import TopicsPage from './pages/TopicsPage'
import MessagesPage from './pages/MessagesPage'
import FilterBar from './components/FilterBar'
import { MessageSquare, BarChart3, FileText } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

type Page = 'dashboard' | 'topics' | 'messages'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('messages')

  const navItems = [
    { id: 'dashboard' as const, label: 'Painel', icon: BarChart3 },
    { id: 'messages' as const, label: 'Mensagens', icon: MessageSquare },
    { id: 'topics' as const, label: 'Tópicos', icon: FileText },
  ]

  const pageTitles: Record<Page, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Painel gerencial',
      subtitle: 'Indicadores de captura e análise de discussões',
    },
    messages: {
      title: 'Mensagens capturadas',
      subtitle: 'Registro das comunicações recebidas dos grupos monitorados',
    },
    topics: {
      title: 'Tópicos sumarizados',
      subtitle: 'Discussões consolidadas para aprovação e acompanhamento',
    },
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#f4f6f8]">
        <header className="bg-[#003366] text-white sticky top-0 z-40 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-white/10 border border-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Central de Monitoramento WhatsApp
                  </h1>
                  <p className="text-xs text-blue-100/80">
                    Captura, resumo e aprovação de discussões
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/15 border border-emerald-400/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-100">Sistema ativo</span>
              </div>
            </div>
          </div>

          <nav className="border-t border-white/10 bg-[#002952]">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-white text-white'
                          : 'border-transparent text-blue-100/70 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {pageTitles[currentPage].title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {pageTitles[currentPage].subtitle}
            </p>
          </div>

          <FilterBar />

          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'messages' && <MessagesPage />}
          {currentPage === 'topics' && <TopicsPage />}
        </main>

        <footer className="border-t border-slate-200 bg-white mt-8">
          <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-slate-500">
            Uso interno · Central de Monitoramento WhatsApp
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  )
}
