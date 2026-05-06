'use client'
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store'
import { useInboxStore } from '@/lib/inboxStore'
import { useNewsStore } from '@/lib/newsStore'
import { INBOX_MESSAGES, InboxMessage, MessageConsequence } from '@/lib/inboxData'
import { HISTORICAL_EVENTS } from '@/lib/achievementsData'

export function useInbox() {
  const store = useGameStore()
  const inbox = useInboxStore()
  const addNews = useNewsStore(s => s.addNews)
  const lastCheck = useRef(0)

  // ── Trigger new messages based on game state ──────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now()
      if (now - lastCheck.current < 8000) return
      lastCheck.current = now

      const wealth = store.getTotalWealth()

      // Clear expired messages
      inbox.clearExpired()

      // Check each template
      INBOX_MESSAGES.forEach(template => {
        if (Math.random() > template.probability) return
        if (template.minWealth && wealth < template.minWealth) return
        if (template.maxWealth && wealth > template.maxWealth) return
        if (template.minLv && store.lv < template.minLv) return
        inbox.addMessage(template.id)
      })
    }, 8000)

    return () => clearInterval(iv)
  }, [store, inbox])

  // ── Apply consequences when a message is answered ─────────
  // This is called from the InboxTab component
}

export function applyConsequence(
  consequence: MessageConsequence,
  store: ReturnType<typeof useGameStore.getState>,
  addNews: (msg: string) => void
) {
  const set = useGameStore.setState

  // Balance change (fixed)
  if (consequence.balChange) {
    set(s => ({ bal: Math.max(0, s.bal + consequence.balChange!) }))
  }

  // Balance change (percentage)
  if (consequence.balPct) {
    set(s => ({ bal: Math.max(0, s.bal + s.bal * consequence.balPct!) }))
  }

  // XP gain
  if (consequence.xp) {
    store.gainXP(consequence.xp)
  }

  // Stock market shock
  if (consequence.stockShock) {
    const { sector, mult, duration } = consequence.stockShock
    if (sector === 'ALL') {
      ;(globalThis as any).__tickrEventMults = { ALL: mult }
    } else {
      ;(globalThis as any).__tickrEventMults = { [sector]: mult }
    }
    setTimeout(() => { ;(globalThis as any).__tickrEventMults = {} }, duration)
  }

  // Loan rate change
  if (consequence.loanRateChange && store.activeLoan) {
    set(s => s.activeLoan
      ? { activeLoan: { ...s.activeLoan, rate: s.activeLoan.rate * consequence.loanRateChange! } }
      : s
    )
  }

  // Hack protect
  if (consequence.hackProtectChange !== undefined) {
    set(s => ({ hackProtect: Math.max(0, Math.min(1, s.hackProtect + consequence.hackProtectChange!)) }))
  }

  // News
  if (consequence.addNews) {
    addNews(consequence.addNews)
  }

  // Special effects
  if (consequence.special) {
    switch (consequence.special) {

      case 'stock_tip': {
        // Random sector gets a boost
        const sectors = ['TECH', 'AI', 'CRYPTO', 'ENERGY', 'FINANCE']
        const sector = sectors[Math.floor(Math.random() * sectors.length)]
        ;(globalThis as any).__tickrEventMults = { [sector]: 1.06 }
        setTimeout(() => { ;(globalThis as any).__tickrEventMults = {} }, 30000)
        addNews(`💡 Tip de insider confirmado: ${sector} moviéndose. Ventana de 30 segundos.`)
        break
      }

      case 'rival_broke': {
        // 50/50: either gain or lose depending on rival's "performance"
        const won = Math.random() > 0.5
        if (won) {
          const gain = 30000 + Math.random() * 70000
          set(s => ({ bal: s.bal + gain }))
          addNews(`💰 La apuesta sale bien. +${Math.round(gain/1000)}k€ ingresados.`)
        } else {
          const loss = 20000 + Math.random() * 40000
          set(s => ({ bal: Math.max(0, s.bal - loss) }))
          addNews(`❌ El resultado no fue el esperado. -${Math.round(loss/1000)}k€.`)
        }
        break
      }

      case 'double_rent': {
        set(s => ({ rentBonus: s.rentBonus * 2 }))
        setTimeout(() => set(s => ({ rentBonus: s.rentBonus / 2 })), 300000)
        addNews(`🏠 Rentas del Lifestyle duplicadas durante 5 minutos.`)
        break
      }

      case 'loan_forgiven': {
        if (store.activeLoan) {
          set(() => ({ activeLoan: null }))
          addNews(`🎉 Deuda perdonada. El préstamo ha sido cancelado.`)
        }
        break
      }

      case 'market_crash': {
        ;(globalThis as any).__tickrEventMults = { ALL: 0.92 }
        setTimeout(() => { ;(globalThis as any).__tickrEventMults = {} }, 60000)
        addNews(`📉 CRASH: Venta masiva activada. Mercados en caída libre.`)
        break
      }

      case 'bull_run': {
        ;(globalThis as any).__tickrEventMults = { ALL: 1.04 }
        setTimeout(() => { ;(globalThis as any).__tickrEventMults = {} }, 90000)
        addNews(`🚀 BULL RUN activado. Todo sube. ¡Aprovecha!`)
        break
      }
    }
  }
}
