import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import TopicsPage from './pages/TopicsPage'
import MessagesPage from './pages/MessagesPage'

const queryClient = new QueryClient()

type Page = 'dashboard' | 'topics' | 'messages'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-blue-600">📱 WhatsApp Summarizer</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Powered by Supabase Edge Functions</p>
              </div>
              <div className="text-xs text-gray-500">
                🚀 Deployed
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentPage === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('messages')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentPage === 'messages'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                💬 Messages
              </button>
              <button
                onClick={() => setCurrentPage('topics')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentPage === 'topics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                🎯 Topics
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'messages' && <MessagesPage />}
          {currentPage === 'topics' && <TopicsPage />}
        </main>
      </div>
    </QueryClientProvider>
  )
}
