'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useGameStore } from '@/lib/store'
import { useAvatarStore } from '@/lib/store'
import { TITLES } from '@/lib/achievementsData'

export function useSupabaseSave() {
  const lastSave = useRef(0)
  const userId   = useRef<string | null>(null)
  const username = useRef<string>('Jugador')

  // Get session once on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return
      userId.current   = data.session.user.id
      username.current = data.session.user.user_metadata?.username
        || data.session.user.email?.split('@')[0]
        || 'Jugador'
      loadSave(userId.current)
    })
  }, [])

  // Auto-save every 30s
  useEffect(() => {
    const iv = setInterval(() => {
      if (!userId.current) return
      if (Date.now() - lastSave.current < 28000) return
      save(userId.current)
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  async function save(uid: string) {
    try {
      const supabase  = createClient()
      const store     = useGameStore.getState()
      const avatar    = useAvatarStore.getState()

      // 1. Save full game state
      const state = {
        bal: store.bal, xp: store.xp, lv: store.lv,
        trades: store.trades, clicks: store.clicks,
        food: store.food, water: store.water, hlth: store.hlth,
        farmed: store.farmed, stocks: store.stocks,
        fxItems: store.fxItems, lsItems: store.lsItems,
        skillPoints: store.skillPoints, unlockedSkills: store.unlockedSkills,
        traderBonus: store.traderBonus, rentBonus: store.rentBonus,
        bmDiscount: store.bmDiscount, xpBonus: store.xpBonus,
        autoFarmRate: store.autoFarmRate, hackProtect: store.hackProtect,
        buyDiscount: store.buyDiscount, prestigeLevel: store.prestigeLevel,
        prestigeMult: store.prestigeMult, activeLoan: store.activeLoan,
        casWon: store.casWon, casLost: store.casLost,
        empresa: store.empresa,
      }
      await supabase.from('game_saves').upsert(
        { user_id: uid, state, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

      // 2. Update leaderboard row
      const wealth  = store.getTotalWealth()
      const title   = TITLES.find(t => t.id === avatar.activeTitle)
      await supabase.from('leaderboard').upsert(
        {
          user_id:    uid,
          username:   avatar.playerName !== 'Jugador' ? avatar.playerName : username.current,
          avatar:     avatar.avatarEmoji,
          title:      title?.name ?? 'Novato',
          wealth:     Math.round(wealth),
          bal:        Math.round(store.bal),
          lv:         store.lv,
          prestige_lv: store.prestigeLevel,
          trades:     store.trades,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

      lastSave.current = Date.now()
    } catch {
      // Silent — localStorage always works as fallback
    }
  }

  async function loadSave(uid: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('game_saves')
        .select('state')
        .eq('user_id', uid)
        .single()
      if (error || !data?.state) return
      const cloud = data.state as any
      const local = useGameStore.getState()
      // Load cloud save if it's more advanced
      if ((cloud.lv ?? 0) > local.lv || (cloud.bal ?? 0) > local.bal * 1.1) {
        useGameStore.setState({
          ...cloud,
          stocks:   cloud.stocks   ?? local.stocks,
          fxItems:  cloud.fxItems  ?? local.fxItems,
          lsItems:  cloud.lsItems  ?? local.lsItems,
        })
      }
    } catch {
      // Silent
    }
  }

  return { save: () => userId.current && save(userId.current) }
}
