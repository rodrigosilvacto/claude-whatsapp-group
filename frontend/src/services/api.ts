import axios from 'axios'

// Supabase Edge Functions URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xtrvojnauvkkterogrst.supabase.co'
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

const api = axios.create({
  baseURL: FUNCTIONS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

export const messageAPI = {
  getMessages: async (groupId: string, startDate: string, endDate: string, limit = 100) => {
    const response = await api.get<{ messages: Message[]; count: number }>('/get-messages', {
      params: { groupId, startDate, endDate, limit },
    })
    return response.data
  },

  summarize: async (groupId: string, startDate: string, endDate: string) => {
    const response = await api.post<{ success: boolean; topics: Topic[] }>('/summarize-messages', {
      groupId,
      startDate,
      endDate,
    })
    return response.data
  },
}

export const topicAPI = {
  getTopics: async (groupId: string, status: 'all' | 'pending' | 'approved' | 'rejected' = 'all', startDate?: string, endDate?: string) => {
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
