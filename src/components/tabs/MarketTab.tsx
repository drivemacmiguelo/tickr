'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store'
import { fmtN } from '@/lib/store'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import clsx from 'clsx'

type HistMap = Record<number, number[]>

export default function MarketTab() {
  const { stocks, buyStock, sellStock } = useGameStore()
  const [activeId, setActiveId] = useState(stocks[0]?.id ?? 1)
  const [qty, setQty] = useState(1)
  const [hist, setHist] = useState<HistMap>(() =>
    Object.fromEntries(stocks.map(s => [s.id, [s.p]]))
  )
  const active = stocks.find(s => s.id === activeId) ?? stocks[0]

  // Build history
  useEffect(() => {
    setHist(prev => {
      const next = { ...prev }
      stocks.forEach(s => {
        const arr = next[s.id] ?? []
        arr.push(s.p)
        if (arr.length > 80) arr.shift()
        next[s.id] = arr
      })
      return next
    })
  }, [stocks])

  const chartData = (hist[activeId] ?? []).map((p, i) => ({ i, p }))
  const first = chartData[0]?.p ?? active?.p
  const last  = chartData[chartData.length - 1]?.p ?? active?.p
  const up    = last >= first

  if (!active) return null

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Stock list */}
      <div className="w-[140px] flex-shrink-0 border-r border-white/5 overflow-y-auto">
        {stocks.map(s => {
          const prev = (hist[s.id] ?? [])[Math.max(0, (hist[s.id]?.length ?? 1) - 2)]
          const chg  = prev ? ((s.p - prev) / prev * 100) : 0
          const isUp = chg >= 0
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={clsx(
                'w-full px-3 py-2.5 text-left border-b border-white/5 transition-colors',
                activeId === s.id ? 'bg-blue/8' : 'hover:bg-bg3'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-white truncate">{s.s}</span>
                {s.h > 0 && <span className="text-[8px] text-green">x{s.h}</span>}
              </div>
              <div className="text-[9px] text-muted truncate">{s.n}</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] font-bold">{fmtN(s.p)}€</span>
                <span className={clsx('text-[9px]', isUp ? 'text-green' : 'text-red')}>
                  {isUp ? '+' : ''}{chg.toFixed(1)}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3 pb-2 border-b border-white/5 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-muted">{active.s}</div>
              <div className="text-sm font-bold text-white mt-0.5">{active.n}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">{fmtN(active.p)}€</div>
              <div className={clsx('text-xs', up ? 'text-green' : 'text-red')}>
                {up ? '▲' : '▼'} {Math.abs((last - first) / first * 100).toFixed(2)}%
              </div>
            </div>
          </div>
          {active.h > 0 && (
            <div className="mt-1 text-[10px] text-muted">
              Tienes x{active.h} · Entrada: {fmtN(active.a)}€ ·{' '}
              <span className={active.p >= active.a ? 'text-green' : 'text-red'}>
                {active.p >= active.a ? '+' : ''}{((active.p - active.a) / active.a * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 px-1 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="p"
                stroke={up ? '#34d399' : '#f87171'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                formatter={(v: number) => [`${fmtN(v)}€`, 'Precio']}
                labelFormatter={() => ''}
                contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trade panel */}
        <div className="px-4 pb-4 flex-shrink-0 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-bg3 text-white font-bold text-base flex items-center justify-center hover:bg-bg4">−</button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-center text-sm font-bold outline-none focus:border-blue/40"
            />
            <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-lg bg-bg3 text-white font-bold text-base flex items-center justify-center hover:bg-bg4">+</button>
          </div>
          <div className="text-xs text-muted mb-2 text-center">
            Total: <span className="text-white font-bold">{fmtN(active.p * qty)}€</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => buyStock(active.id, qty)}
              className="flex-1 py-2.5 rounded-lg bg-green/10 text-green border border-green/20 text-xs font-bold hover:bg-green/20 active:scale-[0.98] transition-all"
            >
              COMPRAR
            </button>
            <button
              onClick={() => sellStock(active.id, qty)}
              disabled={active.h < qty}
              className="flex-1 py-2.5 rounded-lg bg-red/10 text-red border border-red/20 text-xs font-bold hover:bg-red/20 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              VENDER
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
