import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INBOX_MESSAGES, InboxMessage } from './inboxData'

export interface ActiveMessage {
  id: string           // unique instance id
  templateId: string   // which INBOX_MESSAGES template
  receivedAt: number
  expiresAt: number
  read: boolean
  answered: 'accept' | 'reject' | null
  outcome?: string     // result text
}

interface InboxStore {
  messages: ActiveMessage[]
  lastSenderCooldowns: Record<string, number>  // templateId -> last received ts
  unreadCount: number
  addMessage: (templateId: string) => void
  markRead: (id: string) => void
  answer: (id: string, choice: 'accept' | 'reject', outcome?: string) => void
  clearExpired: () => void
  getUnread: () => ActiveMessage[]
}

export const useInboxStore = create<InboxStore>()(
  persist(
    (set, get) => ({
      messages: [],
      lastSenderCooldowns: {},
      unreadCount: 0,

      addMessage: (templateId) => {
        const now = Date.now()
        const template = INBOX_MESSAGES.find(m => m.id === templateId)
        if (!template) return
        const lastSent = get().lastSenderCooldowns[templateId] ?? 0
        if (now - lastSent < template.cooldownMs) return
        const msg: ActiveMessage = {
          id: templateId + '_' + now,
          templateId,
          receivedAt: now,
          expiresAt: now + (template.expireMs ?? 300000),
          read: false,
          answered: null,
        }
        set(s => ({
          messages: [msg, ...s.messages].slice(0, 50),
          lastSenderCooldowns: { ...s.lastSenderCooldowns, [templateId]: now },
          unreadCount: s.unreadCount + 1,
        }))
      },

      markRead: (id) => set(s => ({
        messages: s.messages.map(m => m.id === id ? { ...m, read: true } : m),
        unreadCount: Math.max(0, s.unreadCount - (s.messages.find(m => m.id === id)?.read ? 0 : 1)),
      })),

      answer: (id, choice, outcome) => set(s => ({
        messages: s.messages.map(m => m.id === id ? { ...m, answered: choice, outcome } : m),
      })),

      clearExpired: () => {
        const now = Date.now()
        set(s => ({
          messages: s.messages.filter(m => m.answered !== null || now < m.expiresAt),
        }))
      },

      getUnread: () => get().messages.filter(m => !m.read && !m.answered),
    }),
    { name: 'tickr-inbox-state' }
  )
)
