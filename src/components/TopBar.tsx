'use client'
import { useState } from 'react'
import { useGameStore, fmtN, getLv } from '@/lib/store'
import { useTheme, THEMES } from '@/components/ThemeProvider'

export default function TopBar({ onLogout }: { onLogout?: () => void }) {
  const { bal, lv, food, water, hlth, getTotalWealth } = useGameStore()
  const { theme, setTheme } = useTheme()
  const [showPicker, setShowPicker] = useState(false)
  const wealth  = getTotalWealth()
  const lvData  = getLv(lv)
  const current = THEMES.find(t => t.id === theme)!

  return (
    <div className="flex-shrink-0 relative">
      <div className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <span className="logo-text font-black text-sm tracking-tighter mr-1"
          style={{ fontFamily: 'var(--font)' }}>
          TICKR
        </span>

        {/* Balance */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{fmtN(bal)}€</div>
          <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Patrimonio: {fmtN(wealth)}€</div>
        </div>

        {/* Level badge */}
        <div className="flex items-center gap-1 rounded-lg px-2 py-1 shrink-0"
          style={{ background: 'var(--bg3)', border: '0.5px solid var(--border)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: lvData.clr }} />
          <span className="text-[9px] font-bold" style={{ color: lvData.clr }}>Nv.{lv}</span>
        </div>

        {/* Vitals */}
        <div className="flex gap-1 shrink-0">
          {[
            { val: food,  color: 'var(--theme-food,#fb923c)',  emoji: '🍔' },
            { val: water, color: 'var(--theme-water,#60a5fa)', emoji: '💧' },
            { val: hlth,  color: 'var(--red)',                 emoji: '❤️' },
          ].map(({ val, color, emoji }) => (
            <div key={emoji} className="flex flex-col items-center gap-0.5">
              <span className="text-[8px]">{emoji}</span>
              <div className="w-4 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                <div className="h-full rounded-full" style={{ width: `${val}%`, background: color, transition: 'width .5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Theme picker button */}
        <button onClick={() => setShowPicker(v => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-base transition-all hover:scale-110"
          style={{ background: 'var(--bg3)', border: '0.5px solid var(--border)' }}
          title="Cambiar tema">
          {current.emoji}
        </button>
      </div>

      {/* Theme picker dropdown */}
      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute right-2 top-12 z-50 rounded-xl border p-2 flex flex-col gap-1 min-w-[160px]"
            style={{ background: 'var(--bg2)', borderColor: 'var(--border2)', boxShadow: 'var(--shadow)' }}>
            <div className="text-[9px] font-bold px-2 py-1 tracking-widest" style={{ color: 'var(--muted)' }}>TEMA</div>
            {THEMES.map(t => (
              <button key={t.id} onClick={() => { setTheme(t.id); setShowPicker(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left"
                style={{
                  background: theme === t.id ? 'var(--bg4)' : 'transparent',
                  color: theme === t.id ? 'var(--text)' : 'var(--muted)',
                }}>
                {/* Color preview dot */}
                <div className="w-4 h-4 rounded-full flex-shrink-0 border"
                  style={{ background: t.preview, borderColor: 'var(--border2)' }} />
                <span>{t.emoji} {t.label}</span>
                {theme === t.id && <span className="ml-auto" style={{ color: 'var(--green)' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
