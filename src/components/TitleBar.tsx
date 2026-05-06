'use client'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    electron?: {
      minimize:         () => void
      maximize:         () => void
      close:            () => void
      toggleFullscreen: () => void
      onFullscreenChange: (cb: (v: boolean) => void) => () => void
      isElectron:       boolean
    }
  }
}

export default function TitleBar() {
  const [isElectron,    setIsElectron]    = useState(false)
  const [isFullscreen,  setIsFullscreen]  = useState(false)

  useEffect(() => {
    if (!window.electron?.isElectron) return
    setIsElectron(true)

    // Listen for fullscreen changes from main process
    const unsub = window.electron.onFullscreenChange((v) => setIsFullscreen(v))
    return unsub
  }, [])

  // Hide the whole bar in fullscreen — user can press F11 or ESC to exit
  if (!isElectron) return null

  return (
    <>
      {!isFullscreen && (
        <div
          className="flex-shrink-0 flex items-center justify-between h-8 px-3 select-none"
          style={{
            background: '#08090f',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            WebkitAppRegion: 'drag',
          } as React.CSSProperties}
        >
          <span className="text-[10px] font-bold tracking-wider opacity-60" style={{ color: 'var(--amber)' }}>
            TICKR
          </span>

          <div
            className="flex items-center gap-1.5"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* Fullscreen toggle */}
            <button
              onClick={() => window.electron?.toggleFullscreen()}
              className="w-3 h-3 rounded-full transition-colors"
              style={{ background: 'rgba(96,165,250,0.7)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.7)')}
              title="Pantalla completa (F11)"
            />
            {/* Minimize */}
            <button
              onClick={() => window.electron?.minimize()}
              className="w-3 h-3 rounded-full transition-colors"
              style={{ background: 'rgba(251,191,36,0.8)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,191,36,1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.8)')}
              title="Minimizar"
            />
            {/* Maximize */}
            <button
              onClick={() => window.electron?.maximize()}
              className="w-3 h-3 rounded-full transition-colors"
              style={{ background: 'rgba(52,211,153,0.8)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52,211,153,1)')}
              title="Maximizar"
            />
            {/* Close */}
            <button
              onClick={() => window.electron?.close()}
              className="w-3 h-3 rounded-full transition-colors"
              style={{ background: 'rgba(248,113,113,0.8)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,1)')}
              title="Cerrar"
            />
          </div>
        </div>
      )}

      {/* Fullscreen exit hint — shows briefly then fades */}
      {isFullscreen && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-1 text-[9px] opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.5)' }}
        >
          Pulsa F11 o ESC para salir de pantalla completa
        </div>
      )}
    </>
  )
}
