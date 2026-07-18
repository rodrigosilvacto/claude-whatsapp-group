import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import TopicsPage from './pages/TopicsPage'
import MessagesPage from './pages/MessagesPage'
import FilterBar from './components/FilterBar'
import { MessageSquare, LayoutDashboard, Sparkles } from 'lucide-react'

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
    { id: 'dashboard' as const, label: 'Visão geral', icon: LayoutDashboard },
    { id: 'messages' as const, label: 'Conversas', icon: MessageSquare },
    { id: 'topics' as const, label: 'Resumos', icon: Sparkles },
  ]

  const pageTitles: Record<Page, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Como está o grupo hoje',
      subtitle: 'Um panorama rápido das conversas e dos resumos que precisam da sua atenção.',
    },
    messages: {
      title: 'Conversas recebidas',
      subtitle: 'Acompanhe o que o grupo está falando e peça um resumo com inteligência artificial.',
    },
    topics: {
      title: 'Resumos para revisão',
      subtitle: 'Confira o que a IA encontrou. Aprove o que faz sentido ou cancele o que não for relevante.',
    },
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-800/95 backdrop-blur-md text-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-semibold truncate">
                    Resumidor WhatsApp
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/75 truncate">
                    Entenda o grupo sem ler mensagem por mensagem
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/15 border border-emerald-300/25">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                </span>
                <span className="text-xs font-semibold text-emerald-100">Acompanhando o grupo</span>
              </div>
            </div>
          </div>

          <nav className="border-t border-white/10 bg-brand-900/40">
            <div className="max-w-6xl mx-auto px-5 sm:px-6">
              <div className="flex gap-1 overflow-x-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? 'border-amber-300 text-white'
                          : 'border-transparent text-blue-100/65 hover:text-white'
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

        <main className="max-w-6xl mx-auto px-5 sm:px-6 py-8">
          <div className="mb-6 animate-fadeUp">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              {pageTitles[currentPage].title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
              {pageTitles[currentPage].subtitle}
            </p>
          </div>

          <FilterBar />

          <div className="animate-fadeUp" style={{ animationDelay: '80ms' }}>
            {currentPage === 'dashboard' && (
              <Dashboard onGoToTopics={() => setCurrentPage('topics')} />
            )}
            {currentPage === 'messages' && (
              <MessagesPage onGoToTopics={() => setCurrentPage('topics')} />
            )}
            {currentPage === 'topics' && <TopicsPage />}
          </div>
        </main>

        <footer className="border-t border-slate-200/80 mt-10">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-5 text-xs text-slate-500">
            Resumidor WhatsApp · Uso interno
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  )
}
