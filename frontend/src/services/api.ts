/// <reference types="vite/client" />
import axios from 'axios'

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://xtrvojnauvkkterogrst.supabase.co'

// Chave anon do Supabase (pública no frontend). Proteção real deve vir via RLS.
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cnZvam5hdXZra3Rlcm9ncnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMDM0MzIsImV4cCI6MjA5ODc3OTQzMn0.FpsKiux4AA7id9CVgVQNysQCGGQspoTJYEL_EJ5ddmg'

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

const api = axios.create({
  baseURL: FUNCTIONS_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
  },
})

export interface WhatsAppGroup {
  id: string
  group_name: string
  group_phone: string
  active: boolean
}

export interface Message {
  id: string
  group_id: string
  sender_name: string
  sender_phone: string
  message_text: string
  message_timestamp: string
  captured_at: string
  is_processed: boolean
}

export interface Topic {
  id: string
  group_id: string
  date_discussed: string
  topic_title: string
  discussion_summary: string
  references_mentioned: string[] | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at: string | null
  message_count: number
  raw_message_ids: string[]
}

/** Extrai o texto legível quando a mensagem veio serializada como JSON. */
export function formatMessageText(text: string): string {
  if (!text) return ''
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed.message === 'string') return parsed.message
    if (typeof parsed === 'string') return parsed
  } catch {
    // texto simples
  }
  return text
}

export const groupAPI = {
  getGroups: async () => {
    const response = await api.get<{ groups: WhatsAppGroup[] }>('/get-groups')
    return response.data.groups
  },
}

export const messageAPI = {
  getMessages: async (groupId: string, startDate: string, endDate: string, limit = 100) => {
    const response = await api.get<{ messages: Message[]; count: number }>('/get-messages', {
      params: { groupId, startDate, endDate, limit },
    })
    return response.data
  },

  summarize: async (groupId: string, startDate: string, endDate: string) => {
    const response = await api.post<{ success: boolean; topics: Topic[]; message?: string }>(
      '/summarize-messages',
      { groupId, startDate, endDate }
    )
    return response.data
  },
}

export const topicAPI = {
  getTopics: async (
    groupId: string,
    status: 'all' | 'pending' | 'approved' | 'rejected' = 'all',
    startDate?: string,
    endDate?: string
  ) => {
    const response = await api.get<{ topics: Topic[] }>('/get-topics', {
      params: { groupId, status, startDate, endDate },
    })
    return response.data.topics
  },

  updateTopic: async (id: string, status: 'approved' | 'rejected') => {
    const response = await api.patch<{ success: boolean; topic: Topic }>(`/update-topic/${id}`, {
      status,
    })
    return response.data.topic
  },
}

export const healthAPI = {
  check: async () => {
    const response = await api.get('/health')
    return response.data
  },
}
