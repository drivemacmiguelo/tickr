'use client'
import { useState } from 'react'
import { useGameStore } from '@/lib/store'
import { fmtN } from '@/lib/store'
import { Zap } from 'lucide-react'
import clsx from 'clsx'

export default function FarmTab() {
  const { bal, lv, clicks, farmed, farmClick, prestigeMult } = useGameStore()
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const earn = Math.floor(lv * 2 * prestigeMult)

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    farmClick()
    const rect = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto py-6">
      {/* Stats */}
      <div className="w-full grid grid-cols-3 gap-3">
        {[
          { label: 'POR CLIC', value: '+' + fmtN(earn) + '€', color: 'text-green' },
          { label: 'CLICS',    value: clicks.toLocaleString('es'), color: 'text-blue' },
          { label: 'TOTAL',    value: fmtN(farmed) + '€', color: 'text-amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <div className="text-[9px] text-muted mb-1">{label}</div>
            <div className={clsx('text-sm font-bold', color)}>{value}</div>
          </div>
        ))}
      </div>

      {/* Big click button */}
      <div className="relative">
        <button
          onClick={handleClick}
          className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 overflow-hidden
            bg-gradient-to-br from-amber/20 to-amber/5
            border-2 border-amber/30
            active:scale-[0.94] transition-transform duration-100
            shadow-[0_0_40px_rgba(251,191,36,0.15)]
            hover:shadow-[0_0_60px_rgba(251,191,36,0.25)]"
        >
          <Zap size={40} className="text-amber" strokeWidth={1.5} />
          <span className="text-xs font-bold text-amber">+{fmtN(earn)}€</span>

          {/* Ripples */}
          {ripples.map(({ id, x, y }) => (
            <span
              key={id}
              className="absolute rounded-full bg-amber/20 pointer-events-none animate-ping"
              style={{ width: 20, height: 20, left: x - 10, top: y - 10 }}
            />
          ))}
        </button>
      </div>

      {/* Balance */}
      <div className="text-center">
        <div className="text-xs text-muted">Balance actual</div>
        <div className="text-2xl font-bold text-white mt-0.5">{fmtN(bal)}€</div>
      </div>
    </div>
  )
}
