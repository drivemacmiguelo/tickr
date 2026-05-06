'use client'
import { useEffect, useRef } from 'react'
import { useGameStore, useAvatarStore } from '@/lib/store'
import { ACHIEVEMENTS, TITLES, HISTORICAL_EVENTS, CYCLE_SEQUENCE, ECONOMIC_PHASES } from '@/lib/achievementsData'
import { useNewsStore } from '@/lib/newsStore'

export function useAchievements() {
  const store = useGameStore()
  const avatar = useAvatarStore()
  const addNews = useNewsStore(s => s.addNews)
  const lastCheck = useRef(0)
  const lastWealthPoint = useRef(0)
  const lastEventCheck = useRef(0)

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now()

      // ── Apply economic + event multipliers to globalThis ──
      const phase = ECONOMIC_PHASES[avatar.economicPhase as keyof typeof ECONOMIC_PHASES]
      ;(globalThis as any).__tickrCycleMult = phase?.priceMultiplier ?? 1
      ;(globalThis as any).__tickrRentMult  = phase?.rentMultiplier  ?? 1

      if (avatar.activeEventId && now < avatar.activeEventEnd) {
        const ev = HISTORICAL_EVENTS.find(e => e.id === avatar.activeEventId)
        ;(globalThis as any).__tickrEventMults = ev?.sectorMultipliers ?? {}
      } else {
        ;(globalThis as any).__tickrEventMults = {}
      }

      // ── Wealth history point (every 60s) ──
      if (now - lastWealthPoint.current > 60000) {
        avatar.addWealthPoint(store.getTotalWealth())
        lastWealthPoint.current = now
      }

      // ── Achievement + title checks (every 5s) ──
      if (now - lastCheck.current < 5000) return
      lastCheck.current = now

      const checkState = {
        bal: store.bal, trades: store.trades, clicks: store.clicks,
        lv: store.lv, casWon: store.casWon, casLost: store.casLost,
        prestigeLevel: store.prestigeLevel, lsItems: store.lsItems,
        stocks: store.stocks, empresa: store.empresa,
        hlth: store.hlth, food: store.food, water: store.water,
        farmed: store.farmed, activeLoan: store.activeLoan,
        unlockedSkills: store.unlockedSkills,
        bmIncomeUnreported: store.bmIncomeUnreported,
        getTotalWealth: store.getTotalWealth,
      }

      ACHIEVEMENTS.forEach(ach => {
        if (avatar.unlockedAchievements.includes(ach.id)) return
        try {
          if (ach.check(checkState)) {
            avatar.unlockAchievement(ach.id)
            store.gainXP(ach.xp)
            if (ach.money > 0) useGameStore.setState(s => ({ bal: s.bal + ach.money }))
            addNews(`🏅 Logro: "${ach.name}" ${ach.emoji} — +${ach.xp} XP${ach.money > 0 ? ` +${fmtK(ach.money)}€` : ''}`)
          }
        } catch {}
      })

      const titleState = { ...checkState, unlockedAchievements: avatar.unlockedAchievements }
      TITLES.forEach(title => {
        if (avatar.unlockedTitles.includes(title.id)) return
        try {
          if (title.check(titleState)) {
            avatar.unlockTitle(title.id)
            addNews(`🎖️ Título desbloqueado: "${title.name}" ${title.emoji}`)
          }
        } catch {}
      })

      // ── Economic cycle progression ──
      if (phase && now - avatar.economicPhaseStart > phase.durationMs) {
        const idx = CYCLE_SEQUENCE.indexOf(avatar.economicPhase as any)
        const next = CYCLE_SEQUENCE[(idx + 1) % CYCLE_SEQUENCE.length]
        avatar.setEconomicPhase(next)
        const nextData = ECONOMIC_PHASES[next]
        addNews(`${nextData.emoji} CICLO: Entramos en fase de ${nextData.label}. ${nextData.desc}`)
      }

      // ── Historical events (random trigger) ──
      if (now - lastEventCheck.current > 15000) {
        lastEventCheck.current = now
        if (!avatar.activeEventId && Math.random() < 0.025) {
          const ev = HISTORICAL_EVENTS[Math.floor(Math.random() * HISTORICAL_EVENTS.length)]
          avatar.setActiveEvent(ev.id, now + ev.durationMs)
          addNews(ev.newsText)
        }
        // Clear expired event
        if (avatar.activeEventId && now > avatar.activeEventEnd) {
          avatar.setActiveEvent(null, 0)
          ;(globalThis as any).__tickrEventMults = {}
        }
      }

    }, 1000)

    return () => clearInterval(iv)
  }, [store, avatar, addNews])
}

function fmtK(n: number) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M'
  if (n >= 1e3) return (n/1e3).toFixed(0)+'k'
  return n.toString()
}
