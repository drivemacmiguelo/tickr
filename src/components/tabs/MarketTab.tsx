'use client'
import { useState, useEffect } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import clsx from 'clsx'

type BuyMode = 'shares' | 'amount'

export default function MarketTab() {
  const { stocks, stockHist, buyStock, buyStockAmount, sellStock, bal } = useGameStore()
  const [activeId, setActiveId] = useState(stocks[0]?.id ?? 1)
  const [qty, setQty] = useState(1)
  const [buyAmount, setBuyAmount] = useState(100)
  const [buyMode, setBuyMode] = useState<BuyMode>('amount')
  const [flash, setFlash] = useState<'buy' | 'sell' | null>(null)

  const active = stocks.find(s => s.id === activeId) ?? stocks[0]
  const hist = stockHist[activeId] ?? []
  const chartData = hist.map((p, i) => ({ i, p }))
  const first = hist[0] ?? active?.p ?? 1
  const last  = hist[hist.length - 1] ?? active?.p ?? 1
  const up = last >= first
  const chgPct = ((last - first) / first * 100)

  // Trend indicator from last 5 ticks
  const recent = hist.slice(-5)
  const trendUp = recent.length > 1 && recent[recent.length-1] > recent[0]

  const sharesForAmount = active ? buyAmount / active.p : 0
  const valueOfHolding = active ? active.p * active.h : 0
  const pnlPct = active && active.h > 0 && active.a > 0
    ? ((active.p - active.a) / active.a * 100)
    : 0

  function doBuy() {
    if (!active) return
    let ok = false
    if (buyMode === 'amount') {
      ok = buyStockAmount(active.id, buyAmount)
    } else {
      ok = buyStock(active.id, qty)
    }
    if (ok) { setFlash('buy'); setTimeout(() => setFlash(null), 600) }
  }

  function doSell() {
    if (!active || active.h <= 0) return
    const sellQty = buyMode === 'amount' ? Math.min(active.h, buyAmount / active.p) : Math.min(qty, active.h)
    const ok = sellStock(active.id, sellQty)
    if (ok) { setFlash('sell'); setTimeout(() => setFlash(null), 600) }
  }

  if (!active) return null

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Stock list */}
      <div className="w-[200px] flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        {stocks.map(s => {
          const h = stockHist[s.id] ?? []
          const prev = h[h.length - 2] ?? s.p
          const chg = ((s.p - prev) / prev * 100)
          const isActive = s.id === activeId
          return (
            <button key={s.id} onClick={() => setActiveId(s.id)}
              className="w-full px-3 py-2.5 text-left border-b transition-colors"
              style={{ borderColor: 'var(--border)', background: isActive ? 'rgba(129,140,248,.1)' : 'transparent' }}>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--bg4)', color: 'var(--muted)' }}>{s.s}</span>
                {s.h > 0 && <span className="text-[8px] font-bold" style={{ color: 'var(--green)' }}>x{s.h.toFixed(2)}</span>}
              </div>
              <div className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>{s.n}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{fmtN(s.p)}€</span>
                <span className="text-[10px] font-semibold" style={{ color: chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-[9px] font-semibold" style={{ color: 'var(--muted)' }}>{active.s}</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{active.n}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black" style={{ color: 'var(--text)' }}>{fmtN(active.p)}€</div>
              <div className="text-xs font-bold flex items-center gap-1 justify-end"
                style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
                {up ? '▲' : '▼'} {Math.abs(chgPct).toFixed(2)}%
                <span className="text-[9px]" style={{ color: 'var(--muted)' }}>
                  {trendUp ? '📈' : '📉'} tendencia
                </span>
              </div>
            </div>
          </div>

          {/* Holding info */}
          {active.h > 0 && (
            <div className="flex items-center gap-3 text-[10px] px-2 py-1.5 rounded-lg"
              style={{ background: 'var(--bg3)' }}>
              <span style={{ color: 'var(--muted)' }}>Tienes:</span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{active.h.toFixed(4)} acc.</span>
              <span style={{ color: 'var(--muted)' }}>Valor:</span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{fmtN(valueOfHolding)}€</span>
              <span className="font-bold ml-auto" style={{ color: pnlPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 px-1 py-1"
          style={{ background: flash === 'buy' ? 'rgba(52,211,153,.05)' : flash === 'sell' ? 'rgba(248,113,113,.05)' : 'transparent', transition: 'background .3s' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Line type="monotone" dataKey="p" stroke={up ? '#34d399' : '#f87171'}
                strokeWidth={2} dot={false} isAnimationActive={false} />
              <Tooltip formatter={(v: number) => [`${fmtN(v)}€`, 'Precio']} labelFormatter={() => ''}
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trade panel */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          {/* Buy mode toggle */}
          <div className="flex gap-1 mb-2 p-0.5 rounded-lg" style={{ background: 'var(--bg3)' }}>
            <button onClick={() => setBuyMode('amount')}
              className="flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all"
              style={{ background: buyMode === 'amount' ? 'var(--blue)' : 'transparent', color: buyMode === 'amount' ? '#fff' : 'var(--muted)' }}>
              Por importe €
            </button>
            <button onClick={() => setBuyMode('shares')}
              className="flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all"
              style={{ background: buyMode === 'shares' ? 'var(--blue)' : 'transparent', color: buyMode === 'shares' ? '#fff' : 'var(--muted)' }}>
              Por acciones
            </button>
          </div>

          {buyMode === 'amount' ? (
            <div className="flex flex-col gap-2">
              {/* Quick % buttons */}
              <div className="flex gap-1">
                {[10, 25, 50, 100].map(pct => (
                  <button key={pct} onClick={() => setBuyAmount(Math.floor(bal * pct / 100))}
                    className="flex-1 py-1.5 rounded-lg text-[9px] font-bold border"
                    style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    {pct}%
                  </button>
                ))}
              </div>
              <input type="number" value={buyAmount} min={1}
                onChange={e => setBuyAmount(Math.max(1, +e.target.value))}
                className="w-full rounded-xl px-3 py-2 text-sm text-center font-bold border outline-none"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              <div className="text-[9px] text-center" style={{ color: 'var(--muted)' }}>
                ≈ {sharesForAmount.toFixed(4)} acciones · Saldo: {fmtN(bal)}€
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center"
                style={{ background: 'var(--bg3)', color: 'var(--text)' }}>−</button>
              <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))}
                className="flex-1 rounded-xl px-3 py-2 text-sm text-center font-bold border outline-none"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              <button onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center"
                style={{ background: 'var(--bg3)', color: 'var(--text)' }}>+</button>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button onClick={doBuy} disabled={buyMode === 'amount' ? bal < buyAmount : bal < active.p * qty}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border disabled:opacity-30 active:scale-[.98] transition-all"
              style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.25)' }}>
              COMPRAR
            </button>
            <button onClick={doSell} disabled={active.h <= 0}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border disabled:opacity-30 active:scale-[.98] transition-all"
              style={{ background: 'rgba(248,113,113,.1)', color: 'var(--red)', borderColor: 'rgba(248,113,113,.2)' }}>
              VENDER
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
