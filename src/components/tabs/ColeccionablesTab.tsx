'use client'
import { useState, useEffect } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { COL_CATS, COL_ITEMS } from '@/lib/gameData'
import { useNewsStore } from '@/lib/newsStore'
import clsx from 'clsx'

const RARITY_COLORS: Record<string, string> = {
  'Único':       '#fbbf24',
  'Legendario':  '#f87171',
  'Épico':       '#c084fc',
  'Raro':        '#818cf8',
  'Poco común':  '#34d399',
}

interface ColItem {
  id: string; cat: string; name: string; rarity: string
  basePrice: number; icon: string; desc: string
  price: number; priceChange: number; trend: number; qty: number; buyPrice: number
}

export default function ColeccionablesTab() {
  const { bal, gainXP } = useGameStore()
  const set = useGameStore.setState
  const addNews = useNewsStore(s => s.addNews)

  const [cat, setCat] = useState('cromos')
  const [items, setItems] = useState<ColItem[]>(() =>
    COL_ITEMS.map(i => ({
      ...i,
      price: i.basePrice * (0.85 + Math.random() * 0.3),
      priceChange: 0,
      trend: Math.random() > 0.5 ? 1 : -1,
      qty: 0,
      buyPrice: 0,
    }))
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Price simulation
  useEffect(() => {
    const iv = setInterval(() => {
      setItems(prev => prev.map(item => {
        const chg = (Math.random() - 0.48) * 0.025 * item.trend
        const newPrice = Math.max(item.basePrice * 0.1, item.price * (1 + chg))
        if (Math.random() < 0.04) item.trend *= -1
        return { ...item, price: newPrice, priceChange: chg * 100 }
      }))
    }, 2500)
    return () => clearInterval(iv)
  }, [])

  function buy(item: ColItem) {
    if (bal < item.price) return
    set(s => ({ bal: s.bal - item.price }))
    gainXP(Math.ceil(item.price / 500))
    setItems(prev => prev.map(i => i.id === item.id
      ? { ...i, qty: i.qty + 1, buyPrice: i.qty === 0 ? i.price : (i.buyPrice * i.qty + i.price) / (i.qty + 1) }
      : i))
    if (item.rarity === 'Único' || item.rarity === 'Legendario') {
      addNews(`🏆 Un trader acaba de adquirir "${item.name}" por ${fmtN(item.price)}€. Mercado de coleccionables en efervescencia.`)
    }
  }

  function sell(item: ColItem) {
    if (item.qty <= 0) return
    const sellPrice = item.price * 0.93
    set(s => ({ bal: s.bal + sellPrice }))
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i))
  }

  const catItems = items.filter(i => i.cat === cat)
  const selected = selectedId ? items.find(i => i.id === selectedId) : null
  const portfolioVal = items.filter(i => i.qty > 0).reduce((s, i) => s + i.price * i.qty, 0)
  const portfolioCost = items.filter(i => i.qty > 0).reduce((s, i) => s + i.buyPrice * i.qty, 0)
  const pnlPct = portfolioCost > 0 ? ((portfolioVal - portfolioCost) / portfolioCost * 100) : 0

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left: cats + list */}
      <div className="w-[150px] flex-shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
        {/* Portfolio header */}
        <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
          <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Cartera</div>
          <div className="text-xs font-bold" style={{ color: 'var(--amber)' }}>{fmtN(portfolioVal)}€</div>
          {portfolioCost > 0 && (
            <div className="text-[9px] font-medium" style={{ color: pnlPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}% P&L
            </div>
          )}
        </div>

        {/* Category tabs */}
        {COL_CATS.map(c => {
          const owned = items.filter(i => i.cat === c.id && i.qty > 0).length
          return (
            <button key={c.id} onClick={() => setCat(c.id)}
              className="flex items-center gap-2 px-3 py-2.5 text-left border-b transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: cat === c.id ? c.clr + '12' : 'transparent',
                color: cat === c.id ? c.clr : 'var(--muted)',
              }}>
              <span className="text-sm">{c.icon}</span>
              <span className="text-[10px] font-medium flex-1">{c.name}</span>
              {owned > 0 && (
                <span className="text-[8px] font-bold px-1.5 rounded-full"
                  style={{ background: c.clr + '20', color: c.clr }}>
                  {owned}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Center: item list */}
      <div className="w-[155px] flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        {catItems.map(item => {
          const rColor = RARITY_COLORS[item.rarity] || 'var(--muted)'
          return (
            <button key={item.id} onClick={() => setSelectedId(item.id)}
              className="w-full px-3 py-3 text-left border-b transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: selectedId === item.id ? 'var(--bg4)' : 'transparent',
              }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-base">{item.icon}</span>
                {item.qty > 0 && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)' }}>
                    x{item.qty}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-medium leading-tight" style={{ color: 'var(--text)' }}>{item.name}</div>
              <div className="text-[8px] mt-0.5 font-medium" style={{ color: rColor }}>{item.rarity}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-bold" style={{ color: 'var(--amber)' }}>{fmtN(item.price)}€</span>
                <span className="text-[9px] font-medium" style={{ color: item.priceChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Right: detail */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center opacity-30">
            <div className="text-center">
              <div className="text-4xl mb-2">🃏</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Selecciona un item</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="text-4xl">{selected.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{selected.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{selected.desc}</div>
                <div className="mt-1 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: (RARITY_COLORS[selected.rarity] || '#818cf8') + '18', color: RARITY_COLORS[selected.rarity] || '#818cf8' }}>
                  {selected.rarity}
                </div>
              </div>
            </div>

            {/* Price + trend */}
            <div className="card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px]" style={{ color: 'var(--muted)' }}>PRECIO ACTUAL</div>
                  <div className="text-xl font-black" style={{ color: 'var(--amber)' }}>{fmtN(selected.price)}€</div>
                </div>
                <div className="text-right">
                  <div className={clsx('text-sm font-bold', selected.priceChange >= 0 ? 'text-green-400' : 'text-red-400')}
                    style={{ color: selected.priceChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {selected.priceChange >= 0 ? '+' : ''}{selected.priceChange.toFixed(2)}%
                  </div>
                  <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Precio base: {fmtN(selected.basePrice)}€</div>
                </div>
              </div>
            </div>

            {/* Owned info */}
            {selected.qty > 0 && (
              <div className="card p-3 flex flex-col gap-1.5" style={{ borderColor: 'rgba(52,211,153,.2)' }}>
                <div className="text-[9px] font-bold tracking-widest" style={{ color: 'var(--muted)' }}>EN TU CARTERA</div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--muted)' }}>Cantidad</span>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>x{selected.qty}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--muted)' }}>Precio medio</span>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>{fmtN(selected.buyPrice)}€</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--muted)' }}>P&L</span>
                  <span className="font-bold" style={{ color: selected.price >= selected.buyPrice ? 'var(--green)' : 'var(--red)' }}>
                    {selected.price >= selected.buyPrice ? '+' : ''}{((selected.price - selected.buyPrice) / selected.buyPrice * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {bal < selected.price && selected.qty === 0 && (
              <div className="text-[10px] px-3 py-2 rounded-lg border" style={{ color: 'var(--red)', background: 'rgba(248,113,113,.06)', borderColor: 'rgba(248,113,113,.2)' }}>
                Necesitas {fmtN(selected.price - bal)}€ más
              </div>
            )}

            <div className="flex gap-2 mt-auto">
              <button onClick={() => buy(selected)} disabled={bal < selected.price}
                className="flex-1 py-3 rounded-xl text-xs font-bold border disabled:opacity-30"
                style={{ background: 'rgba(52,211,153,.1)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.25)' }}>
                COMPRAR
              </button>
              <button onClick={() => sell(selected)} disabled={selected.qty <= 0}
                className="flex-1 py-3 rounded-xl text-xs font-bold border disabled:opacity-30"
                style={{ background: 'rgba(248,113,113,.1)', color: 'var(--red)', borderColor: 'rgba(248,113,113,.25)' }}>
                VENDER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
