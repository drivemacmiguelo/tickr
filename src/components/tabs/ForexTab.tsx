'use client'
import { useState, useEffect } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { FX_DATA } from '@/lib/gameData'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import clsx from 'clsx'

const CATS = [
  { id: 'forex',  label: 'Divisas', emoji: '💱' },
  { id: 'metals', label: 'Metales', emoji: '🥇' },
  { id: 'energy', label: 'Energía', emoji: '⛽' },
  { id: 'crypto', label: 'Crypto',  emoji: '₿'  },
]

export default function ForexTab() {
  const { fxItems, fxHist, fxCat, setFxCat, buyFx, sellFx } = useGameStore()
  const [activeId, setActiveId] = useState('eur')
  const [qty, setQty] = useState(1)

  const catItems = fxItems.filter(f => f.cat === fxCat)
  const active = fxItems.find(f => f.id === activeId) ?? catItems[0]

  useEffect(() => {
    if (!catItems.find(f => f.id === activeId)) {
      setActiveId(catItems[0]?.id ?? '')
    }
  }, [fxCat])

  const chartData = (fxHist[active?.id ?? ''] ?? []).map((p, i) => ({ i, p }))
  const first = chartData[0]?.p ?? active?.p ?? 1
  const last = chartData[chartData.length - 1]?.p ?? active?.p ?? 1
  const up = last >= first

  if (!active) return null

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left: cat + list */}
      <div className="w-[140px] flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* Cat tabs */}
        <div className="flex flex-col gap-0 border-b border-white/5">
          {CATS.map(c => (
            <button key={c.id} onClick={() => setFxCat(c.id)}
              className={clsx('flex items-center gap-2 px-3 py-2 text-left text-[10px] font-medium transition-colors',
                fxCat === c.id ? 'bg-blue/10 text-blue' : 'text-muted hover:bg-bg3')}>
              <span>{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>
        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {catItems.map(f => {
            const hist = fxHist[f.id] ?? []
            const prev = hist[hist.length - 2] ?? f.p
            const chg = ((f.p - prev) / prev * 100)
            return (
              <button key={f.id} onClick={() => setActiveId(f.id)}
                className={clsx('w-full px-3 py-2.5 text-left border-b border-white/5 transition-colors',
                  activeId === f.id ? 'bg-blue/8' : 'hover:bg-bg3')}>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-white">{f.s}</span>
                  {f.h > 0 && <span className="text-[8px] text-green">x{f.h}</span>}
                </div>
                <div className="text-[9px] text-muted">{f.n}</div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] font-bold">{fmtN(f.p)}</span>
                  <span className={clsx('text-[9px]', chg >= 0 ? 'text-green' : 'text-red')}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 pb-2 border-b border-white/5 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-muted">{active.s}</div>
              <div className="text-sm font-bold text-white">{active.n}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{fmtN(active.p)}</div>
              <div className={clsx('text-xs', up ? 'text-green' : 'text-red')}>
                {up ? '▲' : '▼'} {Math.abs((last - first) / first * 100).toFixed(3)}%
              </div>
            </div>
          </div>
          {active.h > 0 && (
            <div className="mt-1 text-[10px] text-muted">
              Posición: x{active.h} · Entrada: {fmtN(active.a)} ·{' '}
              <span className={active.p >= active.a ? 'text-green' : 'text-red'}>
                {((active.p - active.a) / active.a * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 px-1 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="p" stroke={up ? '#34d399' : '#f87171'}
                strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Tooltip formatter={(v: number) => [fmtN(v), 'Precio']} labelFormatter={() => ''}
                contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="px-4 pb-4 flex-shrink-0 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-bg3 font-bold flex items-center justify-center hover:bg-bg4">−</button>
            <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-center text-sm font-bold outline-none focus:border-blue/40" />
            <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-lg bg-bg3 font-bold flex items-center justify-center hover:bg-bg4">+</button>
          </div>
          <div className="text-xs text-muted text-center mb-2">Total: <span className="text-white font-bold">{fmtN(active.p * qty)}</span></div>
          <div className="flex gap-2">
            <button onClick={() => buyFx(active.id, qty)}
              className="flex-1 py-2.5 rounded-lg bg-green/10 text-green border border-green/20 text-xs font-bold hover:bg-green/20">ABRIR</button>
            <button onClick={() => sellFx(active.id, qty)} disabled={active.h < qty}
              className="flex-1 py-2.5 rounded-lg bg-red/10 text-red border border-red/20 text-xs font-bold hover:bg-red/20 disabled:opacity-30">CERRAR</button>
          </div>
        </div>
      </div>
    </div>
  )
}
