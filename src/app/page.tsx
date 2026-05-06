'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/game' : '/auth')
    })
  }, [router])
  return (
    <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-black tracking-tighter" style={{ color: 'var(--amber)' }}>TICKR</div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--amber)', animation: `pulse 1s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}
