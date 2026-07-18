import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import TopicsPage from './pages/TopicsPage'
import MessagesPage from './pages/MessagesPage'
import { MessageSquare, BarChart3, Sparkles } from 'lucide-react'

const queryClient = new QueryClient()

type Page = 'dashboard' | 'topics' | 'messages'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const navItems = [
    { id: 'dashboard' as const, label: 'Visão Geral', icon: BarChart3 },
    { id: 'messages' as const, label: 'Mensagens', icon: MessageSquare },
    { id: 'topics' as const, label: 'Tópicos', icon: Sparkles },
  ]

  return (
    <QueryClientProvider client={queryClient}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .gradient-bg {
          background: linear-gradient(135deg, #f0f7ff 0%, #e0f4ff 50%, #f0e7ff 100%);
        }

        .nav-item-active {
          color: #0066CC;
          border-bottom-color: #0066CC;
          font-weight: 600;
        }

        .card-elevated {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 102, 204, 0.08);
        }
      `}</style>

      <div className="min-h-screen gradient-bg dark:bg-slate-950">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resumidor de Grupo</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sincronização inteligente de mensagens WhatsApp</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Ativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                        isActive
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'messages' && <MessagesPage />}
          {currentPage === 'topics' && <TopicsPage />}
        </main>
      </div>
    </QueryClientProvider>
  )
}
