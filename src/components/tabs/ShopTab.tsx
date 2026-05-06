'use client'
import { useState } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { SHOP_DATA } from '@/lib/gameData'
import clsx from 'clsx'

const CATS = [
  { id: 'comida',  label: 'Comida',   emoji: '🍔' },
  { id: 'bebidas', label: 'Bebidas',  emoji: '💧' },
  { id: 'tabaco',  label: 'Tabaco',   emoji: '🚬' },
  { id: 'salud',   label: 'Salud',    emoji: '❤️' },
]

type EffectResult = { food?: number; water?: number; hlth?: number; bal?: number; xp?: number }

function applyEffect(effectStr: string): EffectResult {
  const r: EffectResult = {}
  if (effectStr.includes('comida al 100%')) r.food = 100
  else if (effectStr.match(/\+(\d+) comida/)) r.food = parseInt(effectStr.match(/\+(\d+) comida/)![1])
  if (effectStr.match(/\+(\d+) agua/)) r.water = parseInt(effectStr.match(/\+(\d+) agua/)![1])
  if (effectStr.match(/\+(\d+) salud/)) r.hlth = parseInt(effectStr.match(/\+(\d+) salud/)![1])
  if (effectStr.includes('Salud al 100%')) r.hlth = 100
  if (effectStr.match(/-(\d+) salud/)) r.hlth = -parseInt(effectStr.match(/-(\d+) salud/)![1])
  if (effectStr.match(/\+(\d+) XP/)) r.xp = parseInt(effectStr.match(/\+(\d+) XP/)![1])
  return r
}

export default function ShopTab() {
  const { bal, food, water, hlth, gainXP } = useGameStore()
  const set = useGameStore.setState
  const [cat, setCat] = useState('comida')
  const [toast, setToast] = useState('')

  const items = SHOP_DATA[cat] ?? []

  function buy(item: typeof items[0]) {
    if (bal < item.p) { setToast('Sin fondos'); setTimeout(() => setToast(''), 2000); return }
    const eff = applyEffect(item.effect)
    set(state => ({
      bal: state.bal - item.p,
      food:  eff.food  !== undefined ? eff.food  < 0 ? Math.max(0, state.food  + eff.food)  : Math.min(100, state.food  + (eff.food  ?? 0)) : state.food,
      water: eff.water !== undefined ? Math.min(100, state.water + (eff.water ?? 0)) : state.water,
      hlth:  eff.hlth  !== undefined ? eff.hlth  < 0 ? Math.max(0, state.hlth  + eff.hlth)  : Math.min(100, state.hlth  + (eff.hlth  ?? 0)) : state.hlth,
    }))
    if (eff.xp) gainXP(eff.xp)
    setToast('✅ ' + item.n + ' comprado')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[110px] flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* Vitals */}
        <div className="p-3 border-b border-white/5 bg-bg2 flex flex-col gap-2">
          {[
            { label: '🍔', val: food,  color: '#fb923c' },
            { label: '💧', val: water, color: '#60a5fa' },
            { label: '❤️', val: hlth,  color: '#f87171' },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs">{label}</span>
              <div className="flex-1 h-1.5 bg-bg4 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: color }} />
              </div>
              <span className="text-[9px] text-muted">{Math.round(val)}</span>
            </div>
          ))}
        </div>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={clsx('flex items-center gap-2 px-3 py-2.5 border-b border-white/5 text-left transition-colors',
              cat === c.id ? 'bg-blue/10 text-blue' : 'text-muted hover:bg-bg3')}>
            <span>{c.emoji}</span>
            <span className="text-[10px]">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {toast && (
          <div className="sticky top-0 z-10 text-center py-2 text-xs font-medium bg-green/15 text-green border-b border-green/20">
            {toast}
          </div>
        )}
        <div className="flex flex-col gap-0">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-bg3 transition-colors">
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">{item.n}</div>
                <div className="text-[9px] text-muted mt-0.5">{item.effect}</div>
              </div>
              <button onClick={() => buy(item)} disabled={bal < item.p}
                className={clsx('px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0 transition-all active:scale-95',
                  bal >= item.p
                    ? 'bg-blue/12 text-blue border border-blue/25 hover:bg-blue/20'
                    : 'bg-bg3 text-muted border border-white/5 cursor-not-allowed')}>
                {fmtN(item.p)}€
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
