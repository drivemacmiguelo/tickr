'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode]         = useState<'login'|'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    const supabase = createClient()
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username: username || email.split('@')[0] } }
        })
        if (error) throw error
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password })
        if (!e2) router.replace('/game')
        else setSuccess('¡Cuenta creada! Ya puedes entrar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/game')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="mb-8 text-center">
        <div className="text-4xl font-black tracking-tighter mb-1" style={{ color: 'var(--amber)' }}>TICKR</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>Trading · Casino · Empire</div>
      </div>
      <div className="w-full max-w-sm card p-6">
        <div className="flex mb-6 rounded-xl p-1" style={{ background: 'var(--bg3)' }}>
          {(['login','register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: mode===m ? 'var(--blue)' : 'transparent', color: mode===m ? '#fff' : 'var(--muted)' }}>
              {m === 'login' ? 'Entrar' : 'Registrarse'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Usuario</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="wolftickr99"
                className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          )}
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="trader@tickr.com" required
              className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
              style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
              className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
              style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          {error   && <div className="text-xs px-3 py-2 rounded-xl border" style={{ color: 'var(--red)',   background: 'rgba(248,113,113,.08)', borderColor: 'rgba(248,113,113,.2)' }}>{error}</div>}
          {success && <div className="text-xs px-3 py-2 rounded-xl border" style={{ color: 'var(--green)', background: 'rgba(52,211,153,.08)',  borderColor: 'rgba(52,211,153,.2)'  }}>{success}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'var(--blue)', color: '#fff' }}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar al mercado' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
          {mode === 'login' ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ color: 'var(--blue)', textDecoration: 'underline' }}>
            {mode === 'login' ? 'Regístrate' : 'Entra aquí'}
          </button>
        </p>
      </div>
      <p className="text-xs mt-6 opacity-30" style={{ color: 'var(--muted)' }}>
        Juego de simulación. Sin dinero real.
      </p>
    </div>
  )
}
