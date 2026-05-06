'use client'
import { useGameStore, fmtN, getLv } from '@/lib/store'
import { useTheme } from '@/components/ThemeProvider'
import { TrendingUp, Sun, Moon } from 'lucide-react'

export default function TopBar({ onLogout }: { onLogout?: () => void }) {
  const { bal, lv, food, water, hlth, getTotalWealth } = useGameStore()
  const { theme, toggle } = useTheme()
  const wealth  = getTotalWealth()
  const lvData  = getLv(lv)

  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b"
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <span className="font-bold text-sm tracking-tight mr-1" style={{ color: 'var(--amber)' }}>TICKR</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{fmtN(bal)}€</div>
        <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Patrimonio: {fmtN(wealth)}€</div>
      </div>
      <div className="flex items-center gap-1 rounded-lg px-2 py-1 shrink-0"
        style={{ background: 'var(--bg3)' }}>
        <TrendingUp size={10} style={{ color: lvData.clr }} />
        <span className="text-[9px] font-bold" style={{ color: lvData.clr }}>Nv.{lv}</span>
      </div>
      <div className="flex gap-1 shrink-0">
        {[
          { val: food,  color: '#fb923c', emoji: '🍔' },
          { val: water, color: '#60a5fa', emoji: '💧' },
          { val: hlth,  color: '#f87171', emoji: '❤️' },
        ].map(({ val, color, emoji }) => (
          <div key={emoji} className="flex flex-col items-center gap-0.5">
            <span className="text-[8px]">{emoji}</span>
            <div className="w-4 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
              <div className="h-full rounded-full" style={{ width: `${val}%`, background: color, transition: 'width .5s' }} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={toggle}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 hover:opacity-80"
        style={{ background: 'var(--bg3)' }}>
        {theme === 'dark'
          ? <Sun size={13} style={{ color: 'var(--amber)' }} />
          : <Moon size={13} style={{ color: 'var(--blue)' }} />}
      </button>
    </div>
  )
}
