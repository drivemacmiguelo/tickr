'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import clsx from 'clsx'

type CasinoGame = 'crash' | 'plinko' | 'mines' | 'ruleta'

// ─── CRASH ──────────────────────────────────────────────────────
function CrashGame() {
  const { bal, addCasWon, addCasLost } = useGameStore()
  const [bet, setBet] = useState(100)
  const [mult, setMult] = useState(1)
  const [running, setRunning] = useState(false)
  const [cashedOut, setCashedOut] = useState(false)
  const [crashed, setCrashed] = useState(false)
  const [history, setHistory] = useState<number[]>([2.4, 1.1, 8.3, 0.9, 3.7])
  const crashAt = useRef(1)
  const iv = useRef<NodeJS.Timeout | null>(null)

  function start() {
    if (bal < bet || running) return
    addCasLost(bet)
    setCashedOut(false); setCrashed(false); setMult(1)
    crashAt.current = Math.max(1.01, 1 / (1 - Math.random() * 0.97))
    setRunning(true)
    iv.current = setInterval(() => {
      setMult(m => {
        const next = m < 1.5 ? m + 0.02 : m < 3 ? m + 0.04 : m + 0.08
        if (next >= crashAt.current) {
          clearInterval(iv.current!); setRunning(false); setCrashed(true)
          setHistory(h => [parseFloat(crashAt.current.toFixed(2)), ...h.slice(0, 8)])
          return crashAt.current
        }
        return parseFloat(next.toFixed(2))
      })
    }, 100)
  }

  function cashOut() {
    if (!running || cashedOut) return
    clearInterval(iv.current!); setRunning(false); setCashedOut(true)
    addCasWon(bet * mult)
  }

  const color = crashed ? 'var(--red)' : cashedOut ? 'var(--green)' : running ? 'var(--amber)' : 'var(--muted)'

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Graph area */}
      <div className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border"
        style={{ background: 'var(--bg3)', borderColor: crashed ? 'rgba(248,113,113,.3)' : cashedOut ? 'rgba(52,211,153,.3)' : 'var(--border)', minHeight: 130 }}>
        <div className="text-5xl font-black tracking-tight" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
          {mult.toFixed(2)}x
        </div>
        {running && (
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>EN VUELO</span>
          </div>
        )}
        {crashed && <div className="text-xs font-bold" style={{ color: 'var(--red)' }}>💥 CRASH — Has perdido {fmtN(bet)}€</div>}
        {cashedOut && <div className="text-xs font-bold" style={{ color: 'var(--green)' }}>✅ Cobrado +{fmtN(bet * mult)}€</div>}
      </div>

      {/* History pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {history.map((v, i) => (
          <span key={i} className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 border"
            style={{
              background: v < 1.5 ? 'rgba(248,113,113,.12)' : v < 3 ? 'rgba(251,191,36,.12)' : 'rgba(52,211,153,.12)',
              color: v < 1.5 ? 'var(--red)' : v < 3 ? 'var(--amber)' : 'var(--green)',
              borderColor: v < 1.5 ? 'rgba(248,113,113,.25)' : v < 3 ? 'rgba(251,191,36,.25)' : 'rgba(52,211,153,.25)',
            }}>
            {v}x
          </span>
        ))}
      </div>

      {/* Bet selector */}
      <div className="flex gap-2">
        {[50, 100, 500, 1000].map(v => (
          <button key={v} onClick={() => setBet(v)} disabled={running}
            className="flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all"
            style={{
              background: bet === v ? 'rgba(129,140,248,.15)' : 'var(--bg3)',
              color: bet === v ? 'var(--blue)' : 'var(--muted)',
              borderColor: bet === v ? 'rgba(129,140,248,.35)' : 'var(--border)',
            }}>
            {fmtN(v)}€
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={start} disabled={running || bal < bet}
          className="flex-1 py-3 rounded-xl text-xs font-bold border disabled:opacity-30"
          style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
          INICIAR 🚀
        </button>
        <button onClick={cashOut} disabled={!running || cashedOut}
          className="flex-1 py-3 rounded-xl text-xs font-bold border disabled:opacity-30"
          style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.25)' }}>
          CASHOUT {running ? `(${mult.toFixed(2)}x)` : ''}
        </button>
      </div>
    </div>
  )
}

// ─── PLINKO ──────────────────────────────────────────────────────
const ROWS = 8
// Multiplicadores más equilibrados — house edge razonable
const MULTS = [5, 2, 1.4, 0.8, 0.4, 0.8, 1.4, 2, 5]
const MULT_COLORS = ['#fbbf24','#fb923c','#f87171','#818cf8','rgba(255,255,255,.25)','#818cf8','#f87171','#fb923c','#fbbf24']

interface Ball { id: number; row: number; col: number; finalCol: number; active: boolean }

function PlinkoGame() {
  const { bal, addCasWon, addCasLost } = useGameStore()
  const [bet, setBet] = useState(100)
  const [balls, setBalls] = useState<Ball[]>([])
  const [hitBucket, setHitBucket] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<{ mult: number; win: number } | null>(null)

  function drop() {
    if (bal < bet) return
    addCasLost(bet)

    // Simulate path
    let col = 0
    const path: number[] = [0]
    for (let r = 0; r < ROWS; r++) {
      col += Math.random() > 0.5 ? 1 : 0
      path.push(col)
    }
    const finalCol = Math.min(MULTS.length - 1, col)
    const mult = MULTS[finalCol]
    const win = bet * mult
    addCasWon(win)
    setLastResult({ mult, win })
    setHitBucket(finalCol)
    setTimeout(() => setHitBucket(null), 600)

    // Animate ball
    const id = Date.now()
    setBalls(b => [...b, { id, row: 0, col: 0, finalCol, active: true }])

    path.forEach((c, r) => {
      setTimeout(() => {
        setBalls(prev => prev.map(b => b.id === id ? { ...b, row: r, col: c } : b))
      }, r * 120)
    })
    setTimeout(() => {
      setBalls(prev => prev.filter(b => b.id !== id))
    }, path.length * 120 + 400)
  }

  // Build peg grid
  const pegs = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= r; c++) {
      pegs.push({ r, c })
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Board — ocupa todo el espacio disponible */}
      <div className="plinko-board flex-1 min-h-0 flex flex-col">
        {/* Pegs — escala con el contenedor */}
        <div className="relative flex-1 min-h-0">
          {pegs.map(({ r, c }) => {
            const totalCols = r + 1
            const spacing = 100 / (totalCols + 1)
            const x = spacing * (c + 1)
            const y = (r / ROWS) * 100
            return (
              <div key={`${r}-${c}`} className="plinko-peg absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }} />
            )
          })}

          {/* Balls */}
          {balls.map(ball => {
            const spacing = 100 / (ball.row + 2)
            const x = spacing * (ball.col + 1)
            const y = (ball.row / ROWS) * 100
            return (
              <div key={ball.id} className="plinko-ball"
                style={{
                  left: `${x}%`, top: `${y}%`,
                  transform: 'translate(-50%,-50%)',
                  background: 'linear-gradient(135deg, var(--amber), #fb923c)',
                  zIndex: 10,
                }} />
            )
          })}
        </div>

        {/* Buckets */}
        <div className="flex gap-1 mt-2 flex-shrink-0">
          {MULTS.map((m, i) => (
            <div key={i} className={clsx('plinko-bucket transition-all', hitBucket === i && 'bucket-hit')}
              style={{
                background: MULT_COLORS[i] + '20',
                color: MULT_COLORS[i],
                border: `1px solid ${MULT_COLORS[i]}40`,
                transform: hitBucket === i ? 'scale(1.1)' : 'scale(1)',
              }}>
              {m}x
            </div>
          ))}
        </div>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="flex-shrink-0 text-center py-2 rounded-xl text-sm font-bold border"
          style={{
            background: lastResult.mult >= 1 ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
            color: lastResult.mult >= 1 ? 'var(--green)' : 'var(--red)',
            borderColor: lastResult.mult >= 1 ? 'rgba(52,211,153,.25)' : 'rgba(248,113,113,.25)',
          }}>
          {lastResult.mult}x → {lastResult.mult >= 1 ? '+' : ''}{fmtN(lastResult.win - bet)}€
        </div>
      )}

      {/* Bet */}
      <div className="flex gap-2 flex-shrink-0">
        {[50, 100, 500, 1000].map(v => (
          <button key={v} onClick={() => setBet(v)}
            className="flex-1 py-2 rounded-xl text-[10px] font-bold border"
            style={{
              background: bet === v ? 'rgba(251,191,36,.15)' : 'var(--bg3)',
              color: bet === v ? 'var(--amber)' : 'var(--muted)',
              borderColor: bet === v ? 'rgba(251,191,36,.35)' : 'var(--border)',
            }}>
            {fmtN(v)}€
          </button>
        ))}
      </div>
      <button onClick={drop} disabled={bal < bet}
        className="flex-shrink-0 w-full py-3 rounded-xl text-sm font-bold border disabled:opacity-30"
        style={{ background: 'rgba(251,191,36,.12)', color: 'var(--amber)', borderColor: 'rgba(251,191,36,.25)' }}>
        SOLTAR BOLA ⚽
      </button>
    </div>
  )
}

// ─── MINES ───────────────────────────────────────────────────────
function MinesGame() {
  const { bal, addCasWon, addCasLost, gainXP } = useGameStore()
  const [bet, setBet] = useState(100)
  const [bombs, setBombs] = useState(3)
  const [grid, setGrid] = useState<('hidden' | 'gem' | 'bomb')[]>(Array(25).fill('hidden'))
  const [bombPos, setBombPos] = useState<Set<number>>(new Set())
  const [active, setActive] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [cashed, setCashed] = useState(false)
  const [cashedMult, setCashedMult] = useState(0)
  const [lost, setLost] = useState(false)

  // Use ref to avoid stale closure in cashout
  const revealedRef = useRef(0)

  function calcMult(rev: number, bom: number) {
    if (rev === 0) return 1
    return parseFloat((Math.pow((25 - bom) / (25 - bom - rev + 1), rev) * 0.97).toFixed(2))
  }

  const mult = calcMult(revealed, bombs)

  function start() {
    if (bal < bet || active) return
    // Descuenta la apuesta al iniciar
    addCasLost(bet)
    const pos = new Set<number>()
    while (pos.size < bombs) pos.add(Math.floor(Math.random() * 25))
    setBombPos(pos)
    setGrid(Array(25).fill('hidden'))
    setRevealed(0); revealedRef.current = 0
    setActive(true); setCashed(false); setLost(false); setCashedMult(0)
  }

  function reveal(i: number) {
    if (!active || grid[i] !== 'hidden') return
    if (bombPos.has(i)) {
      // Mostrar todas las bombas — no devuelve nada (la apuesta ya se descontó)
      setGrid(prev => prev.map((cell, idx) =>
        bombPos.has(idx) ? 'bomb' : cell === 'gem' ? 'gem' : 'hidden'
      ))
      setActive(false); setLost(true)
    } else {
      setGrid(prev => { const g = [...prev]; g[i] = 'gem'; return g })
      setRevealed(r => {
        const next = r + 1
        revealedRef.current = next
        return next
      })
    }
  }

  function cashout() {
    if (!active || revealedRef.current === 0) return
    const finalMult = calcMult(revealedRef.current, bombs)
    // Devuelve la apuesta + ganancias (addCasLost ya descontó la apuesta)
    addCasWon(bet * finalMult)
    gainXP(Math.floor(revealedRef.current * 5))
    setCashedMult(finalMult)
    setActive(false); setCashed(true)
  }

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Grid — ocupa todo el espacio disponible */}
      <div className="flex-1 grid grid-cols-5 gap-1.5 min-h-0">
        {grid.map((cell, i) => (
          <button key={i} onClick={() => reveal(i)} disabled={!active || cell !== 'hidden'}
            className="rounded-xl text-2xl flex items-center justify-center border transition-all active:scale-95"
            style={{
              background: cell === 'gem' ? 'rgba(52,211,153,.15)' : cell === 'bomb' ? 'rgba(248,113,113,.15)' : 'var(--bg3)',
              borderColor: cell === 'gem' ? 'rgba(52,211,153,.35)' : cell === 'bomb' ? 'rgba(248,113,113,.35)' : 'var(--border)',
            }}>
            {cell === 'gem' ? '💎' : cell === 'bomb' ? '💣' : ''}
          </button>
        ))}
      </div>

      {/* Multiplier display */}
      <div className="text-center h-8 flex items-center justify-center">
        {active && revealed > 0 && (
          <div className="text-lg font-black" style={{ color: 'var(--green)' }}>
            {mult}x — cobrar: +{fmtN(bet * mult - bet)}€
          </div>
        )}
        {active && revealed === 0 && (
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Descubre una gema para empezar</div>
        )}
        {cashed && <div className="text-sm font-bold" style={{ color: 'var(--green)' }}>✅ +{fmtN(bet * cashedMult - bet)}€ cobrados ({cashedMult}x)</div>}
        {lost && <div className="text-sm font-bold" style={{ color: 'var(--red)' }}>💥 Bomba — perdiste {fmtN(bet)}€</div>}
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <div className="text-[9px] mb-1" style={{ color: 'var(--muted)' }}>Bombas: <b style={{ color: 'var(--red)' }}>{bombs}</b></div>
          <input type="range" min={1} max={20} value={bombs}
            onChange={e => setBombs(+e.target.value)} disabled={active} className="w-full" />
        </div>
        <div className="w-24">
          <div className="text-[9px] mb-1" style={{ color: 'var(--muted)' }}>Apuesta</div>
          <input type="number" value={bet} onChange={e => setBet(Math.max(1, +e.target.value))}
            disabled={active}
            className="w-full rounded-lg px-2 py-1.5 text-xs text-center outline-none border"
            style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={start} disabled={active || bal < bet}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold border disabled:opacity-30"
          style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
          INICIAR
        </button>
        <button onClick={cashout} disabled={!active || revealed === 0}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold border disabled:opacity-30"
          style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.25)' }}>
          CASHOUT
        </button>
      </div>
    </div>
  )
}

// ─── ROULETTE ─────────────────────────────────────────────────────
const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
// 37 numbers: 0..36, alternating red/black with 0=green
const WHEEL_NUMS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]

function getColor(n: number) {
  if (n === 0) return 'green'
  return RED.includes(n) ? 'red' : 'black'
}

function RouletteGame() {
  const { bal, addCasWon, addCasLost } = useGameStore()
  const [bet, setBet] = useState(100)
  const [betType, setBetType] = useState('red')
  const [result, setResult] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [history, setHistory] = useState<number[]>([7, 23, 0, 14, 32])
  const [rotation, setRotation] = useState(0)
  const [ballAngle, setBallAngle] = useState(0)

  function spin() {
    if (bal < bet || spinning) return
    addCasLost(bet)
    setSpinning(true); setResult(null)

    const n = Math.floor(Math.random() * 37)
    const segAngle = 360 / 37
    const targetIdx = WHEEL_NUMS.indexOf(n)
    const spins = 5 + Math.random() * 3
    const newRot = rotation + spins * 360 + targetIdx * segAngle
    setRotation(newRot)
    setBallAngle(-(newRot * 1.3))

    setTimeout(() => {
      const color = getColor(n)
      let win = false, payout = 0
      if (betType === 'red'   && color === 'red')    { win = true; payout = bet * 2 }
      if (betType === 'black' && color === 'black')  { win = true; payout = bet * 2 }
      if (betType === 'green' && color === 'green')  { win = true; payout = bet * 35 }
      if (betType === 'even'  && n > 0 && n%2===0)   { win = true; payout = bet * 2 }
      if (betType === 'odd'   && n%2!==0)            { win = true; payout = bet * 2 }
      if (betType === 'low'   && n>=1 && n<=18)      { win = true; payout = bet * 2 }
      if (betType === 'high'  && n>=19)              { win = true; payout = bet * 2 }
      if (win) addCasWon(payout)
      setResult(n); setSpinning(false)
      setHistory(h => [n, ...h.slice(0, 9)])
    }, 3200)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Wheel */}
      <div className="flex flex-col items-center gap-3">
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          {/* Pointer */}
          <div className="roulette-pointer" />

          {/* Wheel ring */}
          <div className="roulette-wheel">
            {/* SVG wheel with colored segments */}
            <svg viewBox="0 0 200 200" width="200" height="200"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 3.2s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
                transformOrigin: '100px 100px',
              }}>
              {WHEEL_NUMS.map((num, i) => {
                const angle = (360 / 37)
                const start = i * angle - 90
                const end = start + angle
                const r = 95
                const x1 = 100 + r * Math.cos((start * Math.PI) / 180)
                const y1 = 100 + r * Math.sin((start * Math.PI) / 180)
                const x2 = 100 + r * Math.cos((end * Math.PI) / 180)
                const y2 = 100 + r * Math.sin((end * Math.PI) / 180)
                const col = num === 0 ? '#16a34a' : RED.includes(num) ? '#dc2626' : '#1c1c1c'
                const mid = start + angle / 2
                const tx = 100 + 72 * Math.cos((mid * Math.PI) / 180)
                const ty = 100 + 72 * Math.sin((mid * Math.PI) / 180)
                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
                      fill={col}
                      stroke="#111" strokeWidth="0.5"
                    />
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                      fontSize="7" fill="white" fontWeight="bold"
                      transform={`rotate(${mid + 90},${tx},${ty})`}>
                      {num}
                    </text>
                  </g>
                )
              })}
              {/* Center */}
              <circle cx="100" cy="100" r="18" fill="#111" stroke="#333" strokeWidth="2" />
              <circle cx="100" cy="100" r="6" fill="#fbbf24" />
            </svg>

            {/* Ball */}
            <div className="roulette-ball" style={{
              transform: `rotate(${ballAngle}deg) translateY(-75px) rotate(${-ballAngle}deg)`,
              transformOrigin: '100px 100px',
              top: '50%', left: '50%',
              marginTop: -6, marginLeft: -6,
              transition: spinning ? `transform 3.2s cubic-bezier(0.17,0.67,0.12,0.99)` : 'none',
            }} />
          </div>
        </div>

        {/* Result */}
        <div className="h-8 flex items-center justify-center">
          {spinning && <div className="text-xs" style={{ color: 'var(--muted)' }}>Girando...</div>}
          {!spinning && result !== null && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
                style={{ background: getColor(result) === 'red' ? '#dc2626' : getColor(result) === 'green' ? '#16a34a' : '#1c1c1c', border: '2px solid rgba(255,255,255,.2)' }}>
                {result}
              </div>
              <span className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{getColor(result)}</span>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="flex gap-1.5 overflow-x-auto">
        {history.map((n, i) => (
          <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white"
            style={{ background: getColor(n) === 'red' ? '#dc2626' : getColor(n) === 'green' ? '#16a34a' : '#333' }}>
            {n}
          </div>
        ))}
      </div>

      {/* Bet types */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { id: 'red',   label: '🔴 Rojo',   payout: '2x' },
          { id: 'black', label: '⚫ Negro',   payout: '2x' },
          { id: 'green', label: '🟢 Verde',   payout: '35x' },
          { id: 'even',  label: 'Par',         payout: '2x' },
          { id: 'odd',   label: 'Impar',       payout: '2x' },
          { id: 'low',   label: '1–18',        payout: '2x' },
          { id: 'high',  label: '19–36',       payout: '2x' },
        ].map(b => (
          <button key={b.id} onClick={() => setBetType(b.id)} disabled={spinning}
            className="py-2 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-0.5"
            style={{
              background: betType === b.id ? 'rgba(129,140,248,.15)' : 'var(--bg3)',
              color: betType === b.id ? 'var(--blue)' : 'var(--muted)',
              borderColor: betType === b.id ? 'rgba(129,140,248,.35)' : 'var(--border)',
            }}>
            <span>{b.label}</span>
            <span className="text-[8px]" style={{ color: betType === b.id ? 'var(--amber)' : 'var(--muted2)' }}>{b.payout}</span>
          </button>
        ))}
      </div>

      {/* Bet amount + spin */}
      <div className="flex gap-2">
        {[50, 100, 500, 1000].map(v => (
          <button key={v} onClick={() => setBet(v)} disabled={spinning}
            className="flex-1 py-1.5 rounded-lg text-[9px] font-bold border"
            style={{
              background: bet === v ? 'rgba(251,191,36,.15)' : 'var(--bg3)',
              color: bet === v ? 'var(--amber)' : 'var(--muted)',
              borderColor: bet === v ? 'rgba(251,191,36,.35)' : 'var(--border)',
            }}>
            {fmtN(v)}€
          </button>
        ))}
      </div>
      <button onClick={spin} disabled={spinning || bal < bet}
        className="w-full py-3 rounded-xl text-sm font-bold border disabled:opacity-30"
        style={{ background: 'rgba(248,113,113,.12)', color: 'var(--red)', borderColor: 'rgba(248,113,113,.25)' }}>
        {spinning ? '🎰 GIRANDO...' : `GIRAR — ${fmtN(bet)}€`}
      </button>
    </div>
  )
}

// ─── MAIN CASINO ─────────────────────────────────────────────────
const GAMES = [
  { id: 'crash',  label: 'Crash',  emoji: '🚀' },
  { id: 'mines',  label: 'Minas',  emoji: '💣' },
  { id: 'plinko', label: 'Plinko', emoji: '⚽' },
  { id: 'ruleta', label: 'Ruleta', emoji: '🎰' },
]

export default function CasinoTab() {
  const { casWon, casLost } = useGameStore()
  const [game, setGame] = useState<CasinoGame>('crash')

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Stats */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-b text-[10px]"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div><span style={{ color: 'var(--muted)' }}>Ganado: </span><span className="font-bold" style={{ color: 'var(--green)' }}>+{fmtN(casWon)}€</span></div>
        <div><span style={{ color: 'var(--muted)' }}>Perdido: </span><span className="font-bold" style={{ color: 'var(--red)' }}>-{fmtN(casLost)}€</span></div>
        <div><span style={{ color: 'var(--muted)' }}>Neto: </span>
          <span className="font-bold" style={{ color: casWon - casLost >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {casWon - casLost >= 0 ? '+' : ''}{fmtN(casWon - casLost)}€
          </span>
        </div>
      </div>

      {/* Game tabs */}
      <div className="flex-shrink-0 flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)', padding: '4px 8px 0' }}>
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setGame(g.id as CasinoGame)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium rounded-t transition-all"
            style={{
              background: game === g.id ? 'var(--bg3)' : 'transparent',
              color: game === g.id ? 'var(--text)' : 'var(--muted)',
              borderBottom: game === g.id ? `2px solid var(--blue)` : '2px solid transparent',
            }}>
            <span className="text-base">{g.emoji}</span>
            {g.label}
          </button>
        ))}
      </div>

      {/* Game — mines y plinko usan h-full, crash y ruleta hacen scroll */}
      <div className={`flex-1 ${game === 'mines' || game === 'plinko' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        {game === 'crash'  && <CrashGame />}
        {game === 'mines'  && <MinesGame />}
        {game === 'plinko' && <PlinkoGame />}
        {game === 'ruleta' && <RouletteGame />}
      </div>
    </div>
  )
}
