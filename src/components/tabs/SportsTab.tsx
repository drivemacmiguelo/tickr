'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import clsx from 'clsx'

// ─── DATA ──────────────────────────────────────────────────────
const FOOTBALL_TEAMS = [
  { id:'rma',name:'Real Madrid',    short:'RMA',clr:'#f5f5f5' },
  { id:'bar',name:'Barcelona',      short:'BAR',clr:'#a50044' },
  { id:'atm',name:'Atlético',       short:'ATM',clr:'#cb3524' },
  { id:'sev',name:'Sevilla',        short:'SEV',clr:'#d4b483' },
  { id:'vil',name:'Villarreal',     short:'VIL',clr:'#ffd700' },
  { id:'rso',name:'Real Sociedad',  short:'RSO',clr:'#0057a8' },
  { id:'bet',name:'Real Betis',     short:'BET',clr:'#00954c' },
  { id:'ath',name:'Athletic',       short:'ATH',clr:'#ee2523' },
  { id:'val',name:'Valencia',       short:'VAL',clr:'#ff7f00' },
  { id:'osa',name:'Osasuna',        short:'OSA',clr:'#cc0000' },
  { id:'cel',name:'Celta Vigo',     short:'CEL',clr:'#6fc0e0' },
  { id:'get',name:'Getafe',         short:'GET',clr:'#0066cc' },
  { id:'gir',name:'Girona',         short:'GIR',clr:'#cc0000' },
  { id:'ray',name:'Rayo Vallecano', short:'RAY',clr:'#cc0000' },
  { id:'esp',name:'Espanyol',       short:'ESP',clr:'#2d68c4' },
  { id:'mal',name:'Mallorca',       short:'MAL',clr:'#cc0000' },
  { id:'las',name:'Las Palmas',     short:'LPA',clr:'#ffd700' },
  { id:'leg',name:'Leganés',        short:'LEG',clr:'#003399' },
  { id:'ala',name:'Alavés',         short:'ALA',clr:'#003399' },
  { id:'val2',name:'Valladolid',    short:'VLD',clr:'#9b0a0a' },
]

const BASKETBALL_TEAMS = [
  { id:'lal',name:'Los Angeles Lakers', short:'LAL',clr:'#552583' },
  { id:'gsw',name:'Golden State Warriors',short:'GSW',clr:'#1d428a' },
  { id:'bos',name:'Boston Celtics',     short:'BOS',clr:'#007a33' },
  { id:'mia',name:'Miami Heat',         short:'MIA',clr:'#98002e' },
  { id:'chi',name:'Chicago Bulls',      short:'CHI',clr:'#ce1141' },
  { id:'nyk',name:'New York Knicks',    short:'NYK',clr:'#006bb6' },
  { id:'sas',name:'San Antonio Spurs',  short:'SAS',clr:'#c4ced4' },
  { id:'den',name:'Denver Nuggets',     short:'DEN',clr:'#0e2240' },
  { id:'pho',name:'Phoenix Suns',       short:'PHO',clr:'#1d1160' },
  { id:'dfw',name:'Dallas Mavericks',   short:'DAL',clr:'#00538c' },
]

const TENNIS_PLAYERS = [
  { id:'djk',name:'Djokovic',      short:'DJK',clr:'#ff0000' },
  { id:'ala',name:'Alcaraz',       short:'ALC',clr:'#c00' },
  { id:'sin',name:'Sinner',        short:'SIN',clr:'#009246' },
  { id:'med',name:'Medvedev',      short:'MED',clr:'#0033a0' },
  { id:'zve',name:'Zverev',        short:'ZVE',clr:'#000' },
  { id:'rub',name:'Ruud',          short:'RUD',clr:'#ba0c2f' },
  { id:'ber',name:'Berrettini',    short:'BER',clr:'#009246' },
  { id:'frt',name:'Fritz',         short:'FRT',clr:'#002868' },
]

type Sport = 'football' | 'basketball' | 'tennis'
type MatchStatus = 'upcoming' | 'live' | 'finished'

interface Team { id:string; name:string; short:string; clr:string }

interface Match {
  id:string; sport:Sport
  home:Team; away:Team
  homeScore:number; awayScore:number
  minute:number; period:number
  status:MatchStatus
  odds:Record<string,number>
  events:string[]
  // Football extras
  corners?:number; yellowCards?:number; redCards?:number
  // Tennis extras  
  sets?:number[]; awaysets?:number[]
}

interface PlacedBet {
  id:string; matchId:string; matchDesc:string
  betType:string; betLabel:string
  amount:number; odds:number
  status:'pending'|'won'|'lost'; payout:number
  sport:Sport
}

// ─── PERSISTENT SPORTS STORE ───────────────────────────────────
interface SportsStore {
  matches: Match[]
  bets: PlacedBet[]
  lastGenerated: number
  initMatches: () => void
  tickMatches: () => void
  settleBets: (matchId: string, match: Match) => void
  placeBet: (bet: PlacedBet) => void
  deductBal: (amount: number) => void
}

function makeOdds(sport: Sport, homeStr: number, awayStr: number): Record<string,number> {
  const total = homeStr + awayStr
  const hp = homeStr/total*1.1, ap = awayStr/total*0.9
  const dp = 1-hp-ap
  const o = (p:number) => parseFloat(Math.max(1.05,(1/Math.max(0.05,p))*0.92).toFixed(2))
  if (sport === 'tennis') return { p1: o(hp), p2: o(ap) }
  if (sport === 'basketball') return {
    '1': o(hp*1.1), '2': o(ap*0.9),
    'over225': parseFloat((1.8+Math.random()*0.4).toFixed(2)),
    'under225': parseFloat((1.8+Math.random()*0.4).toFixed(2)),
  }
  return {
    '1': o(hp), 'X': o(Math.max(0.1,dp)), '2': o(ap),
    'over25': parseFloat((1.5+Math.random()*0.8).toFixed(2)),
    'btts':   parseFloat((1.6+Math.random()*0.7).toFixed(2)),
    'over35': parseFloat((2.4+Math.random()*0.8).toFixed(2)),
    'corners_over85': parseFloat((1.7+Math.random()*0.5).toFixed(2)),
    'yellow_over35':  parseFloat((1.8+Math.random()*0.5).toFixed(2)),
  }
}

function generateMatch(sport: Sport): Match {
  const teams = sport==='football' ? FOOTBALL_TEAMS :
                sport==='basketball' ? BASKETBALL_TEAMS : TENNIS_PLAYERS
  const shuffled = [...teams].sort(()=>Math.random()-.5)
  const home = shuffled[0], away = shuffled[1]
  const hs = 0.3+Math.random()*0.7, as2 = 0.3+Math.random()*0.7
  return {
    id: sport+'_'+Date.now()+'_'+Math.random().toString(36).slice(2),
    sport, home, away,
    homeScore:0, awayScore:0, minute:0, period:1,
    status:'upcoming' as MatchStatus, odds:makeOdds(sport,hs,as2), events:[],
    corners:0, yellowCards:0, redCards:0, sets:[0], awaysets:[0],
  }
}

export const useSportsStore = create<SportsStore>()(persist((set,get)=>({
  matches: [],
  bets: [],
  lastGenerated: 0,

  initMatches: () => {
    const now = Date.now()
    if (now - get().lastGenerated < 10000 && get().matches.length > 0) return
    const football = Array.from({length:5},()=>generateMatch('football'))
    const basketball = Array.from({length:3},()=>generateMatch('basketball'))
    const tennis = Array.from({length:2},()=>generateMatch('tennis'))
    const all = [...football,...basketball,...tennis]
    // Start some live
    all.slice(0,4).forEach(m => { m.status='live'; m.minute=Math.floor(Math.random()*45) })
    set({ matches:all, lastGenerated:now })
  },

  tickMatches: () => set(state => {
    const now = Date.now()
    const matches = state.matches.map(m => {
      if (m.status==='finished') return m
      if (m.status==='upcoming') {
        if (Math.random()<0.03) return {...m,status:'live' as MatchStatus}
        return m
      }
      // Live match tick
      const maxMin = m.sport==='football' ? 90 : m.sport==='basketball' ? 48 : 3
      const newMin = m.minute+1
      let h=m.homeScore, a=m.awayScore
      const events=[...m.events]
      let corners=m.corners||0, yellow=m.yellowCards||0, red=m.redCards||0

      if (m.sport==='football') {
        if (Math.random()<0.028){h+=Math.random()<0.55?1:0;a+=Math.random()<0.55?0:1;events.push(`⚽ ${newMin}' ${Math.random()<0.55?m.home.short:m.away.short}`)}
        if (Math.random()<0.08){corners++;events.push(`🚩 ${newMin}' Córner`)}
        if (Math.random()<0.06){yellow++;events.push(`🟨 ${newMin}' ${Math.random()<0.5?m.home.short:m.away.short}`)}
        if (Math.random()<0.008){red++;events.push(`🟥 ${newMin}' Expulsión`)}
      } else if (m.sport==='basketball') {
        if (Math.random()<0.4){const pts=Math.random()<0.5?2:3;if(Math.random()<0.55)h+=pts;else a+=pts}
      } else {
        // Tennis: score games
        if (Math.random()<0.15){if(Math.random()<0.55)h++;else a++}
      }

      const finished = newMin >= maxMin
      const newMatch = {...m, minute:newMin, homeScore:h, awayScore:a, events:events.slice(-8),
        corners, yellowCards:yellow, redCards:red,
        status:finished?'finished' as MatchStatus:'live' as MatchStatus}
      if (finished) {
        // Settle bets after small delay
        setTimeout(()=>get().settleBets(m.id, newMatch),100)
      }
      return newMatch
    })

    // Regenerate finished matches
    const live = matches.filter(m=>m.status!=='finished')
    const toGen = 10 - live.length
    const newMatches = toGen>0
      ? [...live, ...Array.from({length:toGen},(_,i)=>generateMatch(
          i<5?'football':i<8?'basketball':'tennis'))]
      : live

    return {matches:newMatches}
  }),

  settleBets: (matchId, match) => {
    const bets = get().bets
    let totalWin = 0
    const updated = bets.map(b => {
      if (b.matchId!==matchId||b.status!=='pending') return b
      const h=match.homeScore, a=match.awayScore
      const result = h>a?'1':h<a?'2':'X'
      const totalGoals=h+a
      let won=false
      switch(b.betType){
        case '1': won=result==='1';break
        case '2': won=result==='2';break
        case 'X': won=result==='X';break
        case 'p1': won=h>a;break
        case 'p2': won=a>h;break
        case 'over25': won=totalGoals>2.5;break
        case 'btts': won=h>0&&a>0;break
        case 'over35': won=totalGoals>3.5;break
        case 'corners_over85': won=(match.corners||0)>8.5;break
        case 'yellow_over35': won=(match.yellowCards||0)>3.5;break
        case 'over225': won=h+a>22.5;break  // basketball
        case 'under225': won=h+a<22.5;break
      }
      if(won) totalWin+=b.payout
      return {...b,status:(won?'won':'lost') as 'pending'|'won'|'lost'}
    })
    if(totalWin>0) useGameStore.setState(s=>({bal:s.bal+totalWin}))
    set({bets:updated})
  },

  placeBet: (bet) => set(s=>({bets:[bet,...s.bets.slice(0,99)]})),
  deductBal: (amount) => useGameStore.setState(s=>({bal:s.bal-amount})),
}),{name:'tickr-sports-v2'}))

// ─── BET MARKETS BY SPORT ──────────────────────────────────────
function getMarkets(m: Match) {
  if (m.sport==='tennis') return [
    [{id:'p1',label:`Gana ${m.home.short}`,payout:'var'},{id:'p2',label:`Gana ${m.away.short}`,payout:'var'}]
  ]
  if (m.sport==='basketball') return [
    [{id:'1',label:`Gana ${m.home.short}`,payout:'var'},{id:'2',label:`Gana ${m.away.short}`,payout:'var'}],
    [{id:'over225',label:'+22.5 pts',payout:'var'},{id:'under225',label:'-22.5 pts',payout:'var'}],
  ]
  return [
    [{id:'1',label:`1 ${m.home.short}`,payout:'var'},{id:'X',label:'X',payout:'var'},{id:'2',label:`2 ${m.away.short}`,payout:'var'}],
    [{id:'over25',label:'+2.5 goles',payout:'var'},{id:'btts',label:'Ambos marcan',payout:'var'},{id:'over35',label:'+3.5 goles',payout:'var'}],
    [{id:'corners_over85',label:'Córners +8.5',payout:'var'},{id:'yellow_over35',label:'Tarjetas +3.5',payout:'var'}],
  ]
}

const SPORT_LABELS: Record<Sport,string> = { football:'⚽ Fútbol', basketball:'🏀 Baloncesto', tennis:'🎾 Tenis' }
const SPORT_TIME: Record<Sport,string> = { football:"'", basketball:'Q', tennis:'Set' }

// ─── COMPONENT ─────────────────────────────────────────────────
export default function SportsTab() {
  const { bal, gainXP } = useGameStore()
  const { matches, bets, initMatches, tickMatches, placeBet, deductBal } = useSportsStore()
  const [sport, setSport] = useState<Sport|'all'>('all')
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [betAmount, setBetAmount] = useState(100)
  const [tab, setTab] = useState<'live'|'bets'>('live')
  const tickRef = useRef(0)

  useEffect(() => { initMatches() }, [])

  useEffect(() => {
    const iv = setInterval(()=>{
      tickRef.current++
      tickMatches()
    }, 2000)
    return ()=>clearInterval(iv)
  }, [tickMatches])

  const filtered = matches.filter(m=>sport==='all'||m.sport===sport)
  const selected = selectedId ? matches.find(m=>m.id===selectedId) : null
  const pendingCount = bets.filter(b=>b.status==='pending').length
  const totalStaked = bets.reduce((s,b)=>s+b.amount,0)
  const totalReturn = bets.filter(b=>b.status==='won').reduce((s,b)=>s+b.payout,0)

  function doBet(match:Match, betType:string, label:string) {
    if (bal<betAmount) return
    const odds = match.odds[betType]
    if (!odds) return
    const bet:PlacedBet = {
      id:'b'+Date.now(), matchId:match.id,
      matchDesc:`${match.home.short} vs ${match.away.short}`,
      betType, betLabel:label, amount:betAmount, odds,
      status:'pending' as 'pending'|'won'|'lost', payout:parseFloat((betAmount*odds).toFixed(2)), sport:match.sport,
    }
    deductBal(betAmount)
    placeBet(bet)
    gainXP(5)
    setTab('bets')
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Top tabs */}
      <div className="flex-shrink-0 flex border-b" style={{borderColor:'var(--border)',background:'var(--bg2)'}}>
        <button onClick={()=>setTab('live')} className="flex-1 py-2.5 text-xs font-medium"
          style={{color:tab==='live'?'var(--text)':'var(--muted)',borderBottom:tab==='live'?'2px solid var(--blue)':'2px solid transparent'}}>
          🔴 En directo
        </button>
        <button onClick={()=>setTab('bets')} className="flex-1 py-2.5 text-xs font-medium relative"
          style={{color:tab==='bets'?'var(--text)':'var(--muted)',borderBottom:tab==='bets'?'2px solid var(--blue)':'2px solid transparent'}}>
          🎫 Mis apuestas
          {pendingCount>0&&<span className="absolute top-1.5 right-4 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white" style={{background:'var(--amber)'}}>{pendingCount}</span>}
        </button>
      </div>

      {tab==='live' && (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: sport filter + match list */}
          <div className="w-[155px] flex-shrink-0 border-r flex flex-col overflow-hidden" style={{borderColor:'var(--border)'}}>
            {/* Sport filter */}
            <div className="flex-shrink-0 flex gap-1 p-2 border-b" style={{borderColor:'var(--border)'}}>
              {(['all','football','basketball','tennis'] as const).map(s=>(
                <button key={s} onClick={()=>setSport(s)}
                  className="flex-1 py-1 rounded-lg text-[8px] font-bold border transition-all"
                  style={{background:sport===s?'rgba(129,140,248,.15)':'var(--bg3)',color:sport===s?'var(--blue)':'var(--muted)',borderColor:sport===s?'rgba(129,140,248,.3)':'var(--border)'}}>
                  {s==='all'?'All':s==='football'?'⚽':s==='basketball'?'🏀':'🎾'}
                </button>
              ))}
            </div>
            {/* Matches */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map(m=>(
                <button key={m.id} onClick={()=>setSelectedId(m.id)}
                  className="w-full px-3 py-2.5 text-left border-b transition-colors"
                  style={{borderColor:'var(--border)',background:selectedId===m.id?'var(--bg4)':'transparent'}}>
                  <div className="flex items-center gap-1 mb-1">
                    {m.status==='live'&&<div className="live-dot"/>}
                    <span className="text-[8px]" style={{color:'var(--muted)'}}>{m.sport==='football'?'LaLiga':m.sport==='basketball'?'NBA':'ATP'}</span>
                    {m.status==='live'&&<span className="text-[8px] font-bold" style={{color:'var(--green)'}}>{m.minute}{SPORT_TIME[m.sport]}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium" style={{color:'var(--text)'}}>{m.home.short}</span>
                    <span className="text-xs font-black px-1.5 py-0.5 rounded" style={{background:m.status==='live'?'rgba(251,191,36,.15)':'var(--bg4)',color:m.status==='live'?'var(--amber)':'var(--muted)'}}>
                      {m.homeScore}–{m.awayScore}
                    </span>
                    <span className="text-[10px] font-medium" style={{color:'var(--text)'}}>{m.away.short}</span>
                  </div>
                  {m.status==='finished'&&<div className="text-[8px] mt-0.5" style={{color:'var(--muted)'}}>✅ Final</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Right: match detail */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center opacity-30">
                <div className="text-center"><div className="text-4xl mb-2">🏆</div><div className="text-xs" style={{color:'var(--muted)'}}>Selecciona un partido</div></div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b" style={{borderColor:'var(--border)'}}>
                  <div className="text-[9px] font-bold mb-1" style={{color:'var(--muted)'}}>{SPORT_LABELS[selected.sport]}</div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold" style={{color:selected.home.clr}}>{selected.home.name}</div>
                    </div>
                    <div className="text-2xl font-black mx-3 px-3 py-1 rounded-xl"
                      style={{background:selected.status==='live'?'rgba(251,191,36,.15)':'var(--bg3)',color:selected.status==='live'?'var(--amber)':'var(--text)'}}>
                      {selected.homeScore} – {selected.awayScore}
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold" style={{color:selected.away.clr}}>{selected.away.name}</div>
                    </div>
                  </div>
                  {selected.status==='live'&&(
                    <div className="flex items-center gap-3 text-[9px]" style={{color:'var(--muted)'}}>
                      <div className="flex items-center gap-1"><div className="live-dot"/><span style={{color:'var(--green)'}}>{selected.minute}{SPORT_TIME[selected.sport]}</span></div>
                      {selected.sport==='football'&&<>
                        <span>🚩{selected.corners}</span>
                        <span>🟨{selected.yellowCards}</span>
                        {(selected.redCards||0)>0&&<span>🟥{selected.redCards}</span>}
                      </>}
                    </div>
                  )}
                  {selected.status==='live'&&<div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{background:'var(--bg3)'}}><div className="h-full rounded-full" style={{width:`${(selected.minute/90)*100}%`,background:'var(--green)'}}/></div>}
                  {selected.events.length>0&&(
                    <div className="mt-2 flex flex-col gap-0.5">
                      {selected.events.slice(-4).reverse().map((ev,i)=>(
                        <div key={i} className="text-[9px]" style={{color:i===0?'var(--text)':'var(--muted)'}}>{ev}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Markets */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                  {selected.status==='finished' ? (
                    <div className="text-center py-8 opacity-40 text-xs" style={{color:'var(--muted)'}}>Partido terminado</div>
                  ) : (
                    <>
                      {getMarkets(selected).map((group,gi)=>(
                        <div key={gi} className="card overflow-hidden">
                          <div className="grid" style={{gridTemplateColumns:`repeat(${group.length},1fr)`}}>
                            {group.map(({id,label})=>{
                              const odds=selected.odds[id]
                              if(!odds) return null
                              return(
                                <button key={id} onClick={()=>doBet(selected,id,label)} disabled={bal<betAmount||selected.status==='finished'}
                                  className="flex flex-col items-center gap-0.5 py-3 border-r last:border-0 transition-all hover:opacity-80 disabled:opacity-30"
                                  style={{borderColor:'var(--border)'}}>
                                  <span className="text-[9px]" style={{color:'var(--muted)'}}>{label}</span>
                                  <span className="text-sm font-black" style={{color:'var(--amber)'}}>{odds}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Bet amount */}
                      <div className="card p-3">
                        <div className="text-[9px] font-bold mb-2" style={{color:'var(--muted)'}}>IMPORTE</div>
                        <div className="flex gap-1.5 mb-2">
                          {[50,100,500,1000].map(v=>(
                            <button key={v} onClick={()=>setBetAmount(v)}
                              className="flex-1 py-1.5 rounded-lg text-[9px] font-bold border"
                              style={{background:betAmount===v?'rgba(129,140,248,.15)':'var(--bg3)',color:betAmount===v?'var(--blue)':'var(--muted)',borderColor:betAmount===v?'rgba(129,140,248,.3)':'var(--border)'}}>
                              {fmtN(v)}€
                            </button>
                          ))}
                        </div>
                        <input type="number" value={betAmount} min={10} onChange={e=>setBetAmount(Math.max(10,+e.target.value))}
                          className="w-full rounded-xl px-3 py-2 text-sm text-center font-bold border outline-none"
                          style={{background:'var(--bg3)',borderColor:'var(--border)',color:'var(--text)'}}/>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab==='bets' && (
        <div className="flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="flex gap-3 p-3 border-b" style={{borderColor:'var(--border)',background:'var(--bg2)'}}>
            <div className="flex-1 text-center"><div className="text-[9px]" style={{color:'var(--muted)'}}>Apostado</div><div className="text-sm font-bold" style={{color:'var(--red)'}}>-{fmtN(totalStaked)}€</div></div>
            <div className="flex-1 text-center"><div className="text-[9px]" style={{color:'var(--muted)'}}>Retornado</div><div className="text-sm font-bold" style={{color:'var(--green)'}}>+{fmtN(totalReturn)}€</div></div>
            <div className="flex-1 text-center"><div className="text-[9px]" style={{color:'var(--muted)'}}>Neto</div>
              <div className="text-sm font-bold" style={{color:totalReturn-totalStaked>=0?'var(--green)':'var(--red)'}}>
                {totalReturn-totalStaked>=0?'+':''}{fmtN(totalReturn-totalStaked)}€
              </div>
            </div>
          </div>
          {bets.length===0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-30">
              <div className="text-4xl">🎫</div>
              <div className="text-xs" style={{color:'var(--muted)'}}>Sin apuestas</div>
            </div>
          ) : bets.map(b=>(
            <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{borderColor:'var(--border)'}}>
              <div className="text-xl flex-shrink-0">{b.status==='pending'?'⏳':b.status==='won'?'✅':'❌'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{color:'var(--text)'}}>{b.matchDesc}</div>
                <div className="text-[9px]" style={{color:'var(--muted)'}}>{b.betLabel} · @{b.odds}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold" style={{color:'var(--amber)'}}>{fmtN(b.amount)}€</div>
                <div className="text-[9px]" style={{color:b.status==='won'?'var(--green)':b.status==='lost'?'var(--red)':'var(--muted)'}}>
                  {b.status==='won'?`+${fmtN(b.payout)}€`:b.status==='lost'?`-${fmtN(b.amount)}€`:`Pot: ${fmtN(b.payout)}€`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
