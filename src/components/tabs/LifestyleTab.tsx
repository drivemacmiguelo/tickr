'use client'
import { useState } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { LS_DATA } from '@/lib/gameData'
import clsx from 'clsx'

const CATS = [
  { id: 'casas',   label: 'Casas',   emoji: '🏠' },
  { id: 'coches',  label: 'Coches',  emoji: '🚗' },
  { id: 'relojes', label: 'Relojes', emoji: '⌚' },
  { id: 'joyas',   label: 'Joyas',   emoji: '💎' },
  { id: 'yates',   label: 'Yates',   emoji: '⛵' },
  { id: 'jets',    label: 'Jets',    emoji: '✈️' },
]

export default function LifestyleTab() {
  const { lsItems, lsCat, setLsCat, buyLs, sellLs, bal, getTotalWealth } = useGameStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const catItems = lsItems.filter(i => i.cat === lsCat)
  const selected = selectedId ? lsItems.find(i => i.id === selectedId) : null
  const totalLsValue = lsItems.reduce((s, i) => s + i.p * (i.qty || 0), 0)
  const totalRent = lsItems.reduce((s, i) => s + (i.r || 0) * (i.qty || 0), 0)

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left panel */}
      <div className="w-[130px] flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* Total */}
        <div className="px-3 py-2 border-b border-white/5 bg-bg2">
          <div className="text-[9px] text-muted">Patrimonio LS</div>
          <div className="text-xs font-bold text-amber">{fmtN(totalLsValue)}€</div>
          <div className="text-[9px] text-green">+{fmtN(totalRent * 86400)}€/día</div>
        </div>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setLsCat(c.id)}
            className={clsx('flex items-center gap-2 px-3 py-2.5 text-left border-b border-white/5 transition-colors',
              lsCat === c.id ? 'bg-blue/10 text-blue' : 'text-muted hover:bg-bg3')}>
            <span className="text-sm">{c.emoji}</span>
            <span className="text-[10px] font-medium">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Center: item list */}
      <div className="w-[140px] flex-shrink-0 border-r border-white/5 overflow-y-auto">
        {catItems.map(item => (
          <button key={item.id} onClick={() => setSelectedId(item.id)}
            className={clsx('w-full px-3 py-2.5 text-left border-b border-white/5 transition-colors',
              selectedId === item.id ? 'bg-blue/8' : 'hover:bg-bg3')}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white truncate pr-1">{item.n}</span>
              {(item.qty || 0) > 0 && (
                <span className="text-[8px] bg-green/15 text-green border border-green/25 rounded px-1 flex-shrink-0">x{item.qty}</span>
              )}
            </div>
            <div className="text-[9px] font-bold text-amber mt-0.5">{fmtN(item.p)}€</div>
            {item.r > 0 && <div className="text-[8px] text-green">+{fmtN(item.r * 86400)}€/día</div>}
            <div className="text-[8px] mt-0.5 px-1 py-0.5 rounded inline-block"
              style={{ background: item.bc + '18', color: item.bc }}>
              {item.b}
            </div>
          </button>
        ))}
      </div>

      {/* Right: detail */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center opacity-25">
              <div className="text-4xl mb-2">{CATS.find(c => c.id === lsCat)?.emoji}</div>
              <div className="text-xs text-muted">Selecciona un activo</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* Header */}
            <div>
              <div className="text-xs font-bold text-muted">{selected.cat.toUpperCase()}</div>
              <div className="text-base font-bold text-white mt-0.5">{selected.n}</div>
              <div className="text-xs text-muted mt-1">{selected.d}</div>
              <div className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: selected.bc + '18', color: selected.bc }}>
                {selected.b}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="card p-2 text-center">
                <div className="text-[8px] text-muted">PRECIO</div>
                <div className="text-xs font-bold text-amber">{fmtN(selected.p)}€</div>
              </div>
              <div className="card p-2 text-center">
                <div className="text-[8px] text-muted">{selected.r > 0 ? 'RENTA/DÍA' : 'REVALOR.'}</div>
                <div className={clsx('text-xs font-bold', selected.r > 0 ? 'text-green' : 'text-muted')}>
                  {selected.r > 0 ? '+' + fmtN(selected.r * 86400) + '€' :
                    selected.ap > 0 ? '+' + (selected.ap * 86400 * 365 * 100).toFixed(1) + '%/año' : '—'}
                </div>
              </div>
              <div className="card p-2 text-center">
                <div className="text-[8px] text-muted">EN CARTERA</div>
                <div className={clsx('text-xs font-bold', (selected.qty || 0) > 0 ? 'text-green' : 'text-muted')}>
                  {(selected.qty || 0) > 0 ? 'x' + selected.qty : '—'}
                </div>
              </div>
            </div>

            {selected.ex && (
              <div className="text-[10px] text-muted bg-bg3 px-3 py-2 rounded-lg">{selected.ex}</div>
            )}

            {/* P&L if owned */}
            {(selected.qty || 0) > 0 && selected.buyPrice > 0 && (
              <div className="text-[10px] bg-bg3 px-3 py-2 rounded-lg">
                <span className="text-muted">Entrada: </span>
                <span className="text-white font-bold">{fmtN(selected.buyPrice)}€</span>
                <span className="text-muted"> · P&L: </span>
                <span className={clsx('font-bold', selected.p >= selected.buyPrice ? 'text-green' : 'text-red')}>
                  {selected.p >= selected.buyPrice ? '+' : ''}
                  {((selected.p - selected.buyPrice) / selected.buyPrice * 100).toFixed(2)}%
                </span>
              </div>
            )}

            {bal < selected.p && (selected.qty || 0) === 0 && (
              <div className="text-[10px] text-red bg-red/8 px-3 py-2 rounded-lg border border-red/20">
                Necesitas {fmtN(selected.p - bal)}€ más
              </div>
            )}

            <div className="flex gap-2 mt-auto">
              <button onClick={() => buyLs(selected.id)} disabled={bal < selected.p}
                className="flex-1 py-3 rounded-xl bg-green/10 text-green border border-green/20 text-xs font-bold disabled:opacity-30 hover:bg-green/20 active:scale-[0.98]">
                COMPRAR
              </button>
              <button onClick={() => sellLs(selected.id)} disabled={(selected.qty || 0) <= 0}
                className="flex-1 py-3 rounded-xl bg-red/10 text-red border border-red/20 text-xs font-bold disabled:opacity-30 hover:bg-red/20 active:scale-[0.98]">
                VENDER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

