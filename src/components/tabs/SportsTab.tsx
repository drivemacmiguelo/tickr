'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import clsx from 'clsx'

// ─── EQUIPOS ───────────────────────────────────────────────────
const TEAMS = [
  { id: 'rma', name: 'Real Madrid',   short: 'RMA', color: '#f5f5f5', badge: '⚽' },
  { id: 'bar', name: 'Barcelona',     short: 'BAR', color: '#a50044', badge: '⚽' },
  { id: 'atm', name: 'Atlético',      short: 'ATM', color: '#cb3524', badge: '⚽' },
  { id: 'sev', name: 'Sevilla',       short: 'SEV', color: '#d4b483', badge: '⚽' },
  { id: 'vil', name: 'Villarreal',    short: 'VIL', color: '#ffd700', badge: '⚽' },
  { id: 'rea', name: 'Real Sociedad', short: 'RSO', color: '#0057a8', badge: '⚽' },
  { id: 'bet', name: 'Real Betis',    short: 'BET', color: '#00954c', badge: '⚽' },
  { id: 'ath', name: 'Athletic',      short: 'ATH', color: '#ee2523', badge: '⚽' },
  { id: 'val', name: 'Valencia',      short: 'VAL', color: '#ff7f00', badge: '⚽' },
  { id: 'osr', name: 'Osasuna',       short: 'OSA', color: '#cc0000', badge: '⚽' },
]

// ─── TYPES ─────────────────────────────────────────────────────
type MatchStatus = 'upcoming' | 'live' | 'finished'
type BetType = '1' | 'X' | '2' | 'over25' | 'btts'

interface Match {
  id: string
  home: typeof TEAMS[0]
  away: typeof TEAMS[0]
  homeScore: number
  awayScore: number
  minute: number
  status: MatchStatus
  odds: { '1': number; X: number; '2': number; over25: number; btts: number }
  events: string[]
}

interface PlacedBet {
  id: string
  matchId: string
  matchDesc: string
  betType: BetType
  betLabel: string
  amount: number
  odds: number
  status: 'pending' | 'won' | 'lost'
  payout: number
}

// ─── HELPERS ───────────────────────────────────────────────────
function calcOdds(homeStr: number, awayStr: number): Match['odds'] {
  const total = homeStr + awayStr
  const homeProb = homeStr / total * 1.12 // ligero favoritismo local
  const awayProb = awayStr / total * 0.88
  const drawProb = 1 - homeProb - awayProb
  const toOdds = (p: number) => parseFloat(Math.max(1.05, (1 / Math.max(0.05, p)) * 0.92).toFixed(2))
  return {
    '1': toOdds(homeProb),
    X:   toOdds(Math.max(0.1, drawProb)),
    '2': toOdds(awayProb),
    over25: parseFloat((1.5 + Math.random() * 0.8).toFixed(2)),
    btts:   parseFloat((1.6 + Math.random() * 0.7).toFixed(2)),
  }
}

function generateMatch(id: string): Match {
  const shuffled = [...TEAMS].sort(() => Math.random() - 0.5)
  const home = shuffled[0], away = shuffled[1]
  const homeStr = 0.3 + Math.random() * 0.7
  const awayStr = 0.3 + Math.random() * 0.7
  return {
    id, home, away,
    homeScore: 0, awayScore: 0,
    minute: 0,
    status: 'upcoming',
    odds: calcOdds(homeStr, awayStr),
    events: [],
  }
}

// ─── COMPONENT ─────────────────────────────────────────────────
export default function SportsTab() {
  const { bal, gainXP } = useGameStore()
  const set = useGameStore.setState
  const [matches, setMatches] = useState<Match[]>(() =>
    Array.from({ length: 5 }, (_, i) => generateMatch('m' + i))
  )
  const [bets, setBets] = useState<PlacedBet[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState(100)
  const [tab, setTab] = useState<'live' | 'mis-apuestas'>('live')
  const tickRef = useRef(0)

  // ─ Game tick: simulate matches
  useEffect(() => {
    const iv = setInterval(() => {
      tickRef.current++

      setMatches(prev => prev.map(m => {
        if (m.status === 'finished') return m

        // Start upcoming matches progressively
        if (m.status === 'upcoming' && tickRef.current % 8 === parseInt(m.id.slice(1)) % 8) {
          return { ...m, status: 'live' }
        }
        if (m.status !== 'live') return m

        const newMinute = m.minute + 1
        let hScore = m.homeScore
        let aScore = m.awayScore
        const events = [...m.events]

        // ~2.5 goals per 90min on average
        const goalProb = 0.028
        if (Math.random() < goalProb) {
          const homeGoal = Math.random() < 0.55
          if (homeGoal) hScore++
          else aScore++
          events.push(`⚽ ${newMinute}' ${homeGoal ? m.home.short : m.away.short}`)
        }
        // Tarjetas
        if (Math.random() < 0.04) {
          const team = Math.random() < 0.5 ? m.home.short : m.away.short
          events.push(`🟨 ${newMinute}' ${team}`)
        }

        const finished = newMinute >= 90
        if (finished) {
          // Settle bets
          setBets(prevBets => prevBets.map(b => {
            if (b.matchId !== m.id || b.status !== 'pending') return b
            const result = hScore > aScore ? '1' : hScore < aScore ? '2' : 'X'
            const totalGoals = hScore + aScore
            let won = false
            if (b.betType === '1' && result === '1') won = true
            if (b.betType === 'X' && result === 'X') won = true
            if (b.betType === '2' && result === '2') won = true
            if (b.betType === 'over25' && totalGoals > 2.5) won = true
            if (b.betType === 'btts' && hScore > 0 && aScore > 0) won = true
            if (won) {
              set(s => ({ bal: s.bal + b.payout }))
              gainXP(Math.floor(b.payout / 10))
            }
            return { ...b, status: won ? 'won' : 'lost' }
          }))
        }

        return {
          ...m,
          minute: newMinute,
          homeScore: hScore,
          awayScore: aScore,
          events: events.slice(-6),
          status: finished ? 'finished' : 'live',
        }
      }))

      // Regenerate finished matches after a while
      if (tickRef.current % 30 === 0) {
        setMatches(prev => prev.map(m =>
          m.status === 'finished' ? generateMatch('m' + Date.now() + Math.random()) : m
        ))
      }
    }, 2000)

    return () => clearInterval(iv)
  }, [gainXP, set])

  function placeBet(match: Match, type: BetType) {
    if (bal < betAmount) return
    const labels: Record<BetType, string> = {
      '1': `Gana ${match.home.short}`, X: 'Empate',
      '2': `Gana ${match.away.short}`, over25: '+2.5 goles', btts: 'Marcan ambos'
    }
    const odds = match.odds[type]
    const payout = parseFloat((betAmount * odds).toFixed(2))
    set(s => ({ bal: s.bal - betAmount }))
    const bet: PlacedBet = {
      id: 'b' + Date.now(),
      matchId: match.id,
      matchDesc: `${match.home.short} vs ${match.away.short}`,
      betType: type,
      betLabel: labels[type],
      amount: betAmount,
      odds,
      status: 'pending',
      payout,
    }
    setBets(prev => [bet, ...prev])
    setTab('mis-apuestas')
  }

  const selected = matches.find(m => m.id === selectedMatch)
  const pendingBets = bets.filter(b => b.status === 'pending').length
  const wonBets = bets.filter(b => b.status === 'won').length
  const totalReturned = bets.filter(b => b.status === 'won').reduce((s, b) => s + b.payout, 0)
  const totalStaked = bets.reduce((s, b) => s + b.amount, 0)

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        <button onClick={() => setTab('live')}
          className="flex-1 py-2.5 text-xs font-medium transition-colors"
          style={{ color: tab === 'live' ? 'var(--text)' : 'var(--muted)', borderBottom: tab === 'live' ? '2px solid var(--blue)' : '2px solid transparent' }}>
          ⚽ En directo
        </button>
        <button onClick={() => setTab('mis-apuestas')}
          className="flex-1 py-2.5 text-xs font-medium transition-colors relative"
          style={{ color: tab === 'mis-apuestas' ? 'var(--text)' : 'var(--muted)', borderBottom: tab === 'mis-apuestas' ? '2px solid var(--blue)' : '2px solid transparent' }}>
          🎫 Mis apuestas
          {pendingBets > 0 && (
            <span className="absolute top-1.5 right-6 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
              style={{ background: 'var(--amber)' }}>{pendingBets}</span>
          )}
        </button>
      </div>

      {/* LIVE TAB */}
      {tab === 'live' && (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Match list */}
          <div className="w-[160px] flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
            {matches.map(m => (
              <button key={m.id} onClick={() => setSelectedMatch(m.id)}
                className="w-full px-3 py-3 text-left border-b transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  background: selectedMatch === m.id ? 'var(--bg4)' : 'transparent',
                }}>
                {/* Status badge */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  {m.status === 'live' && <><div className="live-dot" /><span className="text-[9px] font-bold" style={{ color: 'var(--green)' }}>EN VIVO {m.minute}'</span></>}
                  {m.status === 'upcoming' && <span className="text-[9px]" style={{ color: 'var(--muted)' }}>⏳ Próximo</span>}
                  {m.status === 'finished' && <span className="text-[9px]" style={{ color: 'var(--muted)' }}>✅ Final</span>}
                </div>
                {/* Score */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text)' }}>{m.home.short}</span>
                  <span className="text-xs font-black mx-1 px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg3)', color: m.status === 'live' ? 'var(--amber)' : 'var(--text)' }}>
                    {m.homeScore}–{m.awayScore}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text)' }}>{m.away.short}</span>
                </div>
                {/* Mini odds */}
                <div className="flex gap-1 mt-1.5">
                  {(['1', 'X', '2'] as BetType[]).map(t => (
                    <div key={t} className="flex-1 text-center text-[8px] py-0.5 rounded"
                      style={{ background: 'var(--bg3)', color: 'var(--muted)' }}>
                      {m.odds[t]}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Match detail */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center opacity-30">
                <div className="text-center"><div className="text-4xl mb-2">⚽</div><div className="text-xs" style={{ color: 'var(--muted)' }}>Selecciona un partido</div></div>
              </div>
            ) : (
              <>
                {/* Match header */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    {selected.status === 'live' && (
                      <div className="flex items-center gap-1.5">
                        <div className="live-dot" />
                        <span className="text-[10px] font-bold" style={{ color: 'var(--green)' }}>MINUTO {selected.minute}'</span>
                      </div>
                    )}
                    {selected.status === 'upcoming' && <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Próximamente</span>}
                    {selected.status === 'finished' && <span className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>PARTIDO TERMINADO</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{selected.home.name}</div>
                    </div>
                    <div className="text-3xl font-black mx-4 px-4 py-1 rounded-xl tabular-nums"
                      style={{ background: 'var(--bg3)', color: selected.status === 'live' ? 'var(--amber)' : 'var(--text)' }}>
                      {selected.homeScore} – {selected.awayScore}
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{selected.away.name}</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {selected.status === 'live' && (
                    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(selected.minute / 90) * 100}%`, background: 'var(--green)' }} />
                    </div>
                  )}
                </div>

                {/* Events feed */}
                {selected.events.length > 0 && (
                  <div className="flex-shrink-0 px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    {selected.events.slice().reverse().map((ev, i) => (
                      <div key={i} className="text-[10px] py-0.5" style={{ color: i === 0 ? 'var(--text)' : 'var(--muted)' }}>{ev}</div>
                    ))}
                  </div>
                )}

                {/* Bet markets */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                  {selected.status === 'finished' ? (
                    <div className="text-center py-8 opacity-40">
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>Partido terminado. Sin apuestas.</div>
                    </div>
                  ) : (
                    <>
                      {/* 1X2 */}
                      <div className="card p-3">
                        <div className="text-[9px] font-bold mb-2 tracking-widest" style={{ color: 'var(--muted)' }}>RESULTADO FINAL</div>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { type: '1' as BetType, label: '1', sublabel: selected.home.short },
                            { type: 'X' as BetType, label: 'X', sublabel: 'Empate'            },
                            { type: '2' as BetType, label: '2', sublabel: selected.away.short  },
                          ]).map(({ type, label, sublabel }) => (
                            <button key={type} onClick={() => placeBet(selected, type)} disabled={bal < betAmount}
                              className="py-3 rounded-xl border flex flex-col items-center gap-0.5 transition-all active:scale-95 disabled:opacity-40"
                              style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(129,140,248,.5)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{sublabel}</span>
                              <span className="text-base font-black" style={{ color: 'var(--text)' }}>{label}</span>
                              <span className="text-[11px] font-bold" style={{ color: 'var(--amber)' }}>{selected.odds[type]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Otros mercados */}
                      <div className="card p-3">
                        <div className="text-[9px] font-bold mb-2 tracking-widest" style={{ color: 'var(--muted)' }}>OTROS MERCADOS</div>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { type: 'over25' as BetType, label: '+2.5 Goles',    odds: selected.odds.over25 },
                            { type: 'btts'   as BetType, label: 'Marcan ambos',  odds: selected.odds.btts   },
                          ]).map(({ type, label, odds }) => (
                            <button key={type} onClick={() => placeBet(selected, type)} disabled={bal < betAmount}
                              className="py-3 rounded-xl border flex flex-col items-center gap-0.5 transition-all active:scale-95 disabled:opacity-40"
                              style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(129,140,248,.5)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{label}</span>
                              <span className="text-[13px] font-black" style={{ color: 'var(--amber)' }}>{odds}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bet amount */}
                      <div className="card p-3">
                        <div className="text-[9px] font-bold mb-2 tracking-widest" style={{ color: 'var(--muted)' }}>IMPORTE DE APUESTA</div>
                        <div className="flex gap-1.5 mb-2">
                          {[50, 100, 500, 1000].map(v => (
                            <button key={v} onClick={() => setBetAmount(v)}
                              className="flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all"
                              style={{
                                background: betAmount === v ? 'rgba(129,140,248,.15)' : 'var(--bg3)',
                                color: betAmount === v ? 'var(--blue)' : 'var(--muted)',
                                borderColor: betAmount === v ? 'rgba(129,140,248,.35)' : 'var(--border)',
                              }}>
                              {fmtN(v)}€
                            </button>
                          ))}
                        </div>
                        <input type="number" value={betAmount} min={10}
                          onChange={e => setBetAmount(Math.max(10, +e.target.value))}
                          className="w-full rounded-lg px-3 py-2 text-sm text-center font-bold border outline-none"
                          style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MIS APUESTAS */}
      {tab === 'mis-apuestas' && (
        <div className="flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="flex gap-3 p-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
            <div className="flex-1 text-center">
              <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Apostado</div>
              <div className="text-sm font-bold" style={{ color: 'var(--red)' }}>-{fmtN(totalStaked)}€</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Retornado</div>
              <div className="text-sm font-bold" style={{ color: 'var(--green)' }}>+{fmtN(totalReturned)}€</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Neto</div>
              <div className="text-sm font-bold" style={{ color: totalReturned - totalStaked >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {totalReturned - totalStaked >= 0 ? '+' : ''}{fmtN(totalReturned - totalStaked)}€
              </div>
            </div>
          </div>

          {bets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20 opacity-30">
              <div className="text-center"><div className="text-4xl mb-2">🎫</div><div className="text-xs" style={{ color: 'var(--muted)' }}>Sin apuestas todavía</div></div>
            </div>
          ) : (
            <div className="flex flex-col">
              {bets.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-xl flex-shrink-0">
                    {b.status === 'pending' ? '⏳' : b.status === 'won' ? '✅' : '❌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{b.matchDesc}</div>
                    <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{b.betLabel} · cuota {b.odds}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold" style={{ color: 'var(--amber)' }}>{fmtN(b.amount)}€</div>
                    <div className="text-[10px]" style={{ color: b.status === 'won' ? 'var(--green)' : b.status === 'lost' ? 'var(--red)' : 'var(--muted)' }}>
                      {b.status === 'won' ? '+' + fmtN(b.payout) + '€' : b.status === 'lost' ? '-' + fmtN(b.amount) + '€' : 'Pendiente'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
