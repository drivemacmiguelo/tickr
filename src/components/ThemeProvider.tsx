'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'grey' | 'light' | 'glass' | 'terminal' | 'frosted' | 'neon'

export const THEMES: { id: Theme; label: string; emoji: string; preview: string }[] = [
  { id: 'dark',     label: 'Dark',       emoji: '🌑', preview: '#0a0b10' },
  { id: 'grey',     label: 'Grey',       emoji: '⚫', preview: '#242530' },
  { id: 'light',    label: 'Light',      emoji: '☀️', preview: '#f4f5f9' },
  { id: 'glass',    label: 'Glass',      emoji: '💜', preview: '#1a0533' },
  { id: 'terminal', label: 'Terminal',   emoji: '💚', preview: '#0a0f0a' },
  { id: 'frosted',  label: 'Frosted',    emoji: '🍎', preview: '#e8eef8' },
  { id: 'neon',     label: 'Neon',       emoji: '🔴', preview: '#050508' },
]

interface ThemeCtxType {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeCtx = createContext<ThemeCtxType>({ theme: 'grey', setTheme: () => {} })
export function useTheme() { return useContext(ThemeCtx) }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('grey')

  useEffect(() => {
    const saved = localStorage.getItem('tickr-theme') as Theme | null
    if (saved && THEMES.find(t => t.id === saved)) setThemeState(saved)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('tickr-theme', t)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>
}
