'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useGameStore, useAvatarStore, fmtN } from '@/lib/store'
import { useNewsStore } from '@/lib/newsStore'
import { useSupabaseSave } from '@/lib/useSupabaseSave'
import { useAchievements } from '@/lib/useAchievements'
import { useInbox } from '@/lib/useInbox'
import { HISTORICAL_EVENTS, ECONOMIC_PHASES } from '@/lib/achievementsData'
import TopBar            from '@/components/TopBar'
import BottomNav         from '@/components/BottomNav'
import NewsTicker        from '@/components/NewsTicker'
import MarketTab         from '@/components/tabs/MarketTab'
import ForexTab          from '@/components/tabs/ForexTab'
import LifestyleTab      from '@/components/tabs/LifestyleTab'
import FarmTab           from '@/components/tabs/FarmTab'
import ShopTab           from '@/components/tabs/ShopTab'
import BlackMarketTab    from '@/components/tabs/BlackMarketTab'
import RivalsTab         from '@/components/tabs/RivalsTab'
import JaippyTab         from '@/components/tabs/JaippyTab'
import CasinoTab         from '@/components/tabs/CasinoTab'
import ProfileTab        from '@/components/tabs/ProfileTab'
import SportsTab         from '@/components/tabs/SportsTab'
import AlgoTab           from '@/components/tabs/AlgoTab'
import EmpresaTab        from '@/components/tabs/EmpresaTab'
import ColeccionablesTab from '@/components/tabs/ColeccionablesTab'
import InboxTab          from '@/components/tabs/InboxTab'
import PlaceholderTab    from '@/components/tabs/PlaceholderTab'

function EventBanner() {
  const avatar = useAvatarStore()
  const now = Date.now()
  if (!avatar.activeEventId || now > avatar.activeEventEnd) return null
  const ev = HISTORICAL_EVENTS.find(e => e.id === avatar.activeEventId)
  if (!ev) return null
  const secsLeft = Math.max(0, Math.ceil((avatar.activeEventEnd - now) / 1000))
  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-xs font-bold animate-pulse"
      style={{ background: ev.color+'18', borderBottom:`1px solid ${ev.color}40`, color: ev.color }}>
      <span className="text-base">{ev.emoji}</span>
      <span className="flex-1">{ev.name}</span>
      <span className="text-[10px] opacity-70">{secsLeft}s</span>
    </div>
  )
}

function CycleBadge() {
  const avatar = useAvatarStore()
  const phase = ECONOMIC_PHASES[avatar.economicPhase as keyof typeof ECONOMIC_PHASES]
  if (!phase) return null
  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 text-[9px] border-b"
      style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
      <span>{phase.emoji}</span>
      <span style={{ color: phase.color }}>{phase.label}</span>
      <span style={{ color:'var(--muted)' }}>— {phase.desc}</span>
    </div>
  )
}

export default function GamePage() {
  const router  = useRouter()
  const store   = useGameStore()
  const addNews = useNewsStore(s => s.addNews)
  const { activeTab, tick, tickRivals, tickLoan, tickEmpresa, tickAutoFarm, maybeHack, applyHealthConsequences } = store
  const tickCount  = useRef(0)
  const prevLv     = useRef(store.lv)
  const prevWealth = useRef(store.getTotalWealth())
  const prevBal    = useRef(store.bal)

  useSupabaseSave()
  useAchievements()
  useInbox()

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/auth')
    })
  }, [router])

  useEffect(() => {
    const iv = setInterval(() => {
      tick(); tickCount.current++
      if (tickCount.current % 3  === 0) tickRivals()
      if (tickCount.current % 10 === 0) tickLoan()
      tickEmpresa(); tickAutoFarm(); maybeHack()
      if (tickCount.current % 30 === 0) applyHealthConsequences()
      const s = useGameStore.getState()
      const w = s.getTotalWealth()
      if (s.lv > prevLv.current) { addNews(`🎯 Un trader alcanzó nivel ${s.lv}.`); prevLv.current = s.lv }
      for (const m of [10000,50000,100000,500000,1000000,5000000,10000000,100000000,1000000000])
        if (prevWealth.current < m && w >= m) addNews(`💰 Hito: ${fmtN(m)}€ de patrimonio.`)
      prevWealth.current = w
      if (s.bal < prevBal.current - 50000) addNews(`📊 Operación grande: ${fmtN(prevBal.current - s.bal)}€.`)
      prevBal.current = s.bal
    }, 1300)
    return () => clearInterval(iv)
  }, [tick, tickRivals, tickLoan, tickEmpresa, tickAutoFarm, maybeHack, applyHealthConsequences, addNews])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBar />
      <CycleBadge />
      <EventBanner />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab==='market'         && <MarketTab />}
        {activeTab==='forex'          && <ForexTab />}
        {activeTab==='lifestyle'      && <LifestyleTab />}
        {activeTab==='farm'           && <FarmTab />}
        {activeTab==='shop'           && <ShopTab />}
        {activeTab==='blackmarket'    && <BlackMarketTab />}
        {activeTab==='rivals'         && <RivalsTab />}
        {activeTab==='jaippy'         && <JaippyTab />}
        {activeTab==='casino'         && <CasinoTab />}
        {activeTab==='profile'        && <ProfileTab />}
        {activeTab==='sports'         && <SportsTab />}
        {activeTab==='algo'           && <AlgoTab />}
        {activeTab==='empresa'        && <EmpresaTab />}
        {activeTab==='coleccionables' && <ColeccionablesTab />}
        {activeTab==='inbox'          && <InboxTab />}
        {activeTab==='subastas'       && <PlaceholderTab name="Subastas" emoji="🔨" description="Próximamente" />}
      </main>
      <NewsTicker />
      <BottomNav />
    </div>
  )
}
