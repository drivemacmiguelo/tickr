'use client'
import { useState } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { BM_ITEMS } from '@/lib/gameData'
import clsx from 'clsx'

export default function BlackMarketTab() {
  const { bal, taxAdvisor, gainXP } = useGameStore()
  const set = useGameStore.setState
  const [results, setResults] = useState<Record<string, { win: boolean; amount: number } | null>>({})
  const [haciendaWarning, setHaciendaWarning] = useState(false)

  function doDeal(item: typeof BM_ITEMS[0]) {
    if (bal < item.p) return
    set(state => ({ bal: state.bal - item.p, bmIncomeUnreported: state.bmIncomeUnreported + item.gain }))

    setTimeout(() => {
      const success = Math.random() > item.risk
      if (success) {
        set(state => ({ bal: state.bal + item.gain }))
        gainXP(50)
        setResults(r => ({ ...r, [item.id]: { win: true, amount: item.gain } }))
        // Hacienda risk
        if (!taxAdvisor && Math.random() < 0.1) {
          setTimeout(() => {
            const fine = Math.floor(item.gain * (0.3 + Math.random() * 0.4))
            set(state => ({ bal: Math.max(0, state.bal - fine), bmIncomeUnreported: 0 }))
            setHaciendaWarning(true)
            setTimeout(() => setHaciendaWarning(false), 5000)
          }, 3000)
        }
      } else {
        setResults(r => ({ ...r, [item.id]: { win: false, amount: item.p } }))
      }
      setTimeout(() => setResults(r => ({ ...r, [item.id]: null })), 3000)
    }, 1200)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {haciendaWarning && (
        <div className="sticky top-0 z-10 bg-red/15 border-b border-red/30 px-4 py-3 text-xs text-red font-bold animate-pulse">
          🚨 ¡INSPECCIÓN DE HACIENDA! Te han multado por ingresos no declarados.
        </div>
      )}

      <div className="px-4 py-3 bg-bg2 border-b border-white/5">
        <div className="text-xs font-bold text-white mb-0.5">Mercado Negro</div>
        <div className="text-[10px] text-muted">Operaciones de alto riesgo. Sin garantías.</div>
        {!taxAdvisor && (
          <div className="text-[9px] text-amber mt-1">⚠️ Sin asesor fiscal — riesgo de inspección</div>
        )}
      </div>

      <div className="flex flex-col gap-0">
        {BM_ITEMS.map(item => {
          const result = results[item.id]
          const isPending = result === undefined ? false : result === null ? false : true
          const canBuy = bal >= item.p && !isPending

          return (
            <div key={item.id} className="px-4 py-4 border-b border-white/5 hover:bg-bg3 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{item.n}</div>
                  <div className="text-[10px] text-muted mt-0.5">{item.desc}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] text-muted">Coste: <span className="text-red font-bold">{fmtN(item.p)}€</span></span>
                    {item.gain > 0 && (
                      <span className="text-[9px] text-muted">Premio: <span className="text-green font-bold">+{fmtN(item.gain)}€</span></span>
                    )}
                    <span className="text-[9px] text-muted">Riesgo: <span className="text-amber font-bold">{Math.round(item.risk * 100)}%</span></span>
                  </div>
                  {/* Risk bar */}
                  <div className="mt-1.5 h-1 bg-bg4 rounded-full overflow-hidden w-full">
                    <div className="h-full rounded-full" style={{
                      width: `${item.risk * 100}%`,
                      background: item.risk > 0.5 ? '#f87171' : item.risk > 0.3 ? '#fbbf24' : '#34d399'
                    }} />
                  </div>
                </div>
              </div>

              {/* Result */}
              {result && (
                <div className={clsx('mt-2 px-3 py-2 rounded-lg text-xs font-bold text-center',
                  result.win ? 'bg-green/12 text-green border border-green/20' : 'bg-red/12 text-red border border-red/20')}>
                  {result.win ? `✅ +${fmtN(result.amount)}€` : `❌ Operación fallida (-${fmtN(result.amount)}€)`}
                </div>
              )}

              <button onClick={() => doDeal(item)} disabled={!canBuy}
                className={clsx('w-full mt-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]',
                  canBuy
                    ? 'bg-red/10 text-red border border-red/25 hover:bg-red/20'
                    : 'bg-bg3 text-muted border border-white/5 cursor-not-allowed')}>
                {isPending ? '⏳ Procesando...' : item.gain === 0 ? `Activar — ${fmtN(item.p)}€` : `Ejecutar — ${fmtN(item.p)}€`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
