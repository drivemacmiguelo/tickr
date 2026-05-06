'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameStore, fmtN, getLv, useAvatarStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import clsx from 'clsx'

type RivalsSubTab = 'npc' | 'global' | 'apuestas'

interface GlobalPlayer {
  rank: number
  user_id: string
  username: string
  avatar: string
  title: string
  wealth: number
  lv: number
  prestige_lv: number
  trades: number
  updated_at: string
  isMe?: boolean
}

interface ActiveRivalry {
  rivalId: string; rivalName: string
  myStart: number; rivalStart: number; rivalBal: number
  stake: number; endTime: number
}

const medals = ['🥇', '🥈', '🥉']

export default function RivalsTab() {
  const store   = useGameStore()
  const avatar  = useAvatarStore()
  const { rivals, rivalTickCount, getTotalWealth, lv } = store
  const [sub, setSub] = useState<RivalsSubTab>('global')
  const [rivalry, setRivalry] = useState<ActiveRivalry | null>(null)

  // Global leaderboard state
  const [globalPlayers, setGlobalPlayers] = useState<GlobalPlayer[]>([])
  const [myRankGlobal, setMyRankGlobal]   = useState<number | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [lastRefresh, setLastRefresh]     = useState(0)
  const myUserId = useRef<string | null>(null)

  const myWealth = getTotalWealth()

  // Get current user id once
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      myUserId.current = data.session?.user?.id ?? null
    })
  }, [])

  // Load global leaderboard
  async function fetchLeaderboard() {
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('leaderboard_ranked')
        .select('*')
        .limit(50)
      if (err) throw err
      const rows = (data ?? []) as GlobalPlayer[]
      // Mark my own row
      const marked = rows.map(r => ({
        ...r,
        isMe: r.user_id === myUserId.current,
      }))
      setGlobalPlayers(marked)
      const me = marked.find(r => r.isMe)
      setMyRankGlobal(me ? Number(me.rank) : null)
      setLastRefresh(Date.now())
    } catch (e: any) {
      setError('No se pudo cargar el ranking. Comprueba tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on tab open + refresh every 30s
  useEffect(() => {
    if (sub !== 'global') return
    fetchLeaderboard()
    const iv = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(iv)
  }, [sub])

  // NPC ranking (local)
  const npcAll = [...rivals,
    {
      id: 'you', name: avatar.playerName, emoji: avatar.avatarEmoji,
      clr: '#818cf8', border: 'rgba(129,140,248,.5)',
      title: getLv(lv).name, bal: myWealth, isMe: true, lv, strategy: ''
    }
  ].sort((a: any, b: any) => b.bal - a.bal)
  const myNpcRank = npcAll.findIndex((p: any) => p.id === 'you') + 1

  function challenge(rival: any) {
    if (rivalry) return
    const stake = myWealth * 0.2
    if (store.bal < stake) return
    useGameStore.setState(s => ({ bal: s.bal - stake }))
    setRivalry({
      rivalId: rival.id, rivalName: rival.name,
      myStart: myWealth, rivalStart: rival.bal, rivalBal: rival.bal,
      stake, endTime: Date.now() + 300000
    })
    setTimeout(() => {
      const current = useGameStore.getState().getTotalWealth()
      const s       = useGameStore.getState()
      const r       = s.rivals.find((r: any) => r.id === rival.id)
      const myGain  = current - myWealth
      const rvGain  = (r?.bal ?? rival.bal) - rival.bal
      if (myGain > rvGain) {
        useGameStore.setState(s2 => ({ bal: s2.bal + stake * 1.8 }))
        store.gainXP(300)
      }
      setRivalry(null)
    }, 300000)
  }

  const secsLeft = rivalry ? Math.max(0, Math.ceil((rivalry.endTime - Date.now()) / 1000)) : 0

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Rivalry banner */}
      {rivalry && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 text-xs font-bold"
          style={{ background: 'rgba(248,113,113,.12)', borderBottom: '1px solid rgba(248,113,113,.2)', color: 'var(--red)' }}>
          <span>⚔️ Rivalidad vs {rivalry.rivalName}</span>
          <span>{secsLeft}s</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex-shrink-0 flex border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {([
          { id: 'global',   label: '🌍 Global'  },
          { id: 'npc',      label: '🤖 Rivales'  },
          { id: 'apuestas', label: '⚔️ Apuestas'  },
        ] as {id:RivalsSubTab;label:string}[]).map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className="flex-1 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: sub === t.id ? 'var(--text)' : 'var(--muted)',
              borderBottom: sub === t.id ? '2px solid var(--blue)' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GLOBAL ─────────────────────────────────────────── */}
      {sub === 'global' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* My position + refresh */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
            <div>
              <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Tu posición global</div>
              <div className="text-base font-black" style={{ color: 'var(--text)' }}>
                {myRankGlobal ? `#${myRankGlobal}` : '—'}
                <span className="text-xs font-normal ml-1" style={{ color: 'var(--muted)' }}>
                  de {globalPlayers.length} jugadores
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastRefresh > 0 && (
                <span className="text-[9px]" style={{ color: 'var(--muted2)' }}>
                  Hace {Math.round((Date.now() - lastRefresh) / 1000)}s
                </span>
              )}
              <button onClick={fetchLeaderboard} disabled={loading}
                className="px-3 py-1.5 rounded-lg text-[9px] font-bold border disabled:opacity-40"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                {loading ? '⏳' : '↻ Actualizar'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs text-center border"
              style={{ background: 'rgba(248,113,113,.08)', borderColor: 'rgba(248,113,113,.2)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && globalPlayers.length === 0 && (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b animate-pulse"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="w-6 h-4 rounded" style={{ background: 'var(--bg4)' }} />
                  <div className="w-9 h-9 rounded-full" style={{ background: 'var(--bg4)' }} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-24 rounded" style={{ background: 'var(--bg4)' }} />
                    <div className="h-2 w-16 rounded" style={{ background: 'var(--bg4)' }} />
                  </div>
                  <div className="h-3 w-16 rounded" style={{ background: 'var(--bg4)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Players list */}
          {!loading && globalPlayers.length === 0 && !error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40 py-16">
              <div className="text-4xl">🌍</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                Sé el primero en aparecer aquí
              </div>
              <div className="text-[9px] text-center px-6" style={{ color: 'var(--muted2)' }}>
                El ranking se actualiza automáticamente cada 30s mientras juegas
              </div>
            </div>
          )}

          {globalPlayers.map((player, i) => {
            const isTop3 = i < 3
            const isMe   = !!player.isMe

            return (
              <div key={player.user_id}
                className="flex items-center gap-3 px-4 py-3 border-b transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  background: isMe
                    ? 'rgba(129,140,248,.06)'
                    : 'transparent',
                  borderLeft: isMe ? '2px solid #818cf8' : '2px solid transparent',
                }}>

                {/* Rank */}
                <div className="w-6 text-center flex-shrink-0">
                  {isTop3
                    ? <span className="text-base">{medals[i]}</span>
                    : <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>#{player.rank}</span>}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: isMe ? 'rgba(129,140,248,.15)' : 'var(--bg3)',
                    border: isMe ? '1.5px solid rgba(129,140,248,.4)' : '1.5px solid var(--border)',
                  }}>
                  {player.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                      {player.username}
                    </span>
                    {isMe && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                        style={{ background: '#818cf830', color: '#818cf8' }}>TÚ</span>
                    )}
                    {player.prestige_lv > 0 && (
                      <span className="text-[9px] flex-shrink-0">{'⭐'.repeat(Math.min(3, player.prestige_lv))}</span>
                    )}
                  </div>
                  <div className="text-[9px]" style={{ color: 'var(--muted)' }}>
                    {player.title} · Nv.{player.lv} · {player.trades} ops
                  </div>
                </div>

                {/* Wealth */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold"
                    style={{ color: isMe ? '#818cf8' : isTop3 ? 'var(--amber)' : 'var(--text)' }}>
                    {fmtN(player.wealth)}€
                  </div>
                  {!isMe && (
                    <div className="text-[9px]" style={{ color: player.wealth > myWealth ? 'var(--red)' : 'var(--green)' }}>
                      {player.wealth > myWealth ? '▲' : '▼'} {fmtN(Math.abs(player.wealth - myWealth))}€
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Footer note */}
          {globalPlayers.length > 0 && (
            <div className="flex-shrink-0 px-4 py-3 text-center text-[9px]"
              style={{ color: 'var(--muted2)' }}>
              Se actualiza cada 30s · Top 50 jugadores
            </div>
          )}
        </div>
      )}

      {/* ── NPC RIVALS ─────────────────────────────────────── */}
      {sub === 'npc' && (
        <div className="flex-1 overflow-y-auto">
          {/* My position */}
          <div className="flex-shrink-0 px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
            <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Tu posición (rivales locales)</div>
            <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>
              #{myNpcRank}
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--muted)' }}>de {npcAll.length}</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--amber)' }}>{fmtN(myWealth)}€</div>
          </div>

          {npcAll.map((r: any, i: number) => {
            const diff  = Math.abs(r.bal - myWealth)
            const ahead = !r.isMe && r.bal > myWealth
            const msg   = !r.isMe && r.msgs
              ? (ahead
                  ? r.msgs.ahead[rivalTickCount % r.msgs.ahead.length]
                  : r.msgs.losing[rivalTickCount % r.msgs.losing.length])
              : null

            return (
              <div key={r.id}
                className="flex items-center gap-3 px-4 py-3 border-b transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  background: r.isMe ? 'rgba(129,140,248,.05)' : 'transparent',
                  borderLeft: r.isMe ? '2px solid #818cf8' : '2px solid transparent',
                }}>
                <div className="w-6 text-center flex-shrink-0">
                  {i < 3
                    ? <span className="text-base">{medals[i]}</span>
                    : <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{i+1}</span>}
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: r.clr + '18', border: `1.5px solid ${r.border || r.clr}` }}>
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{r.name}</span>
                    {r.isMe && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: '#818cf830', color: '#818cf8' }}>TÚ</span>
                    )}
                  </div>
                  <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{r.title} · Nv.{r.lv}</div>
                  {msg && <div className="text-[9px] italic" style={{ color: 'var(--muted2)' }}>"{msg}"</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold"
                    style={{ color: r.isMe ? '#818cf8' : ahead ? 'var(--red)' : 'var(--green)' }}>
                    {fmtN(r.bal)}€
                  </div>
                  {!r.isMe && (
                    <div className="text-[9px]" style={{ color: ahead ? 'var(--red)' : 'var(--green)' }}>
                      {ahead ? '▲' : '▼'} {fmtN(diff)}€
                    </div>
                  )}
                  {!r.isMe && (
                    <button onClick={() => challenge(r)} disabled={!!rivalry}
                      className="mt-1 px-2 py-0.5 rounded text-[8px] font-bold border disabled:opacity-30"
                      style={{ background: 'rgba(248,113,113,.1)', color: 'var(--red)', borderColor: 'rgba(248,113,113,.25)' }}>
                      {rivalry?.rivalId === r.id ? '⚔️' : 'Retar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── APUESTAS ───────────────────────────────────────── */}
      {sub === 'apuestas' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
            Reta a un rival NPC. El que más gane en <b style={{ color: 'var(--text)' }}>5 minutos</b> gana el <b style={{ color: 'var(--amber)' }}>20% del patrimonio</b> del otro.
          </div>

          {rivalry && (
            <div className="card p-3 flex flex-col gap-2"
              style={{ borderColor: 'rgba(248,113,113,.3)', background: 'rgba(248,113,113,.05)' }}>
              <div className="text-xs font-bold" style={{ color: 'var(--red)' }}>⚔️ Rivalidad activa vs {rivalry.rivalName}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-2 text-center" style={{ background: 'var(--bg3)' }}>
                  <div className="text-[8px]" style={{ color: 'var(--muted)' }}>TÚ GANAS</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--green)' }}>
                    +{fmtN(Math.max(0, myWealth - rivalry.myStart))}€
                  </div>
                </div>
                <div className="rounded-xl p-2 text-center" style={{ background: 'var(--bg3)' }}>
                  <div className="text-[8px]" style={{ color: 'var(--muted)' }}>RIVAL</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--red)' }}>
                    +{fmtN(Math.max(0, rivalry.rivalBal - rivalry.rivalStart))}€
                  </div>
                </div>
              </div>
              <div className="text-center text-[10px]" style={{ color: 'var(--amber)' }}>
                ⏱ {secsLeft}s restantes · Stake: {fmtN(rivalry.stake)}€
              </div>
            </div>
          )}

          {rivals.slice(0, 10).map((r: any) => (
            <div key={r.id} className={clsx('card p-3 flex items-center gap-3', rivalry && 'opacity-40 pointer-events-none')}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: r.clr + '18', border: `1.5px solid ${r.border}` }}>
                {r.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{r.name}</div>
                <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{r.title} · {fmtN(r.bal)}€</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px] mb-1" style={{ color: 'var(--amber)' }}>
                  Stake: {fmtN(myWealth * 0.2)}€
                </div>
                <button onClick={() => challenge(r)} disabled={!!rivalry}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border disabled:opacity-30"
                  style={{ background: 'rgba(248,113,113,.1)', color: 'var(--red)', borderColor: 'rgba(248,113,113,.25)' }}>
                  ⚔️ Retar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
