'use client'
import { useEffect, useRef } from 'react'
import { useNewsStore } from '@/lib/newsStore'

export default function NewsTicker() {
  const items = useNewsStore(s => s.items)
  const text = items.join('   ·   ')

  return (
    <div className="flex-shrink-0 overflow-hidden h-6 flex items-center border-t"
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <div className="flex-shrink-0 px-2 text-[8px] font-bold tracking-widest border-r mr-2 h-full flex items-center"
        style={{ color: 'var(--amber)', borderColor: 'var(--border)', background: 'rgba(251,191,36,.06)' }}>
        LIVE
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div
          key={text.length} // re-trigger animation when new item added
          className="whitespace-nowrap text-[10px] absolute"
          style={{
            color: 'var(--muted)',
            animation: 'ticker-scroll 40s linear infinite',
          }}>
          {text}
        </div>
      </div>
      <style jsx>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
