import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MatchStatus = 'upcoming' | 'live' | 'finished'
export type Sport = 'football' | 'basketball' | 'tennis'

export interface Team { id:string; name:string; short:string; strength:number }
export interface TennisPlayer { id:string; name:string; short:string; strength:number }
export interface MatchEvent { minute:number; type:string; team:string; desc:string }

export interface Match {
  id:string; sport:Sport
  home:Team|TennisPlayer; away:Team|TennisPlayer
  homeScore:number; awayScore:number
  homeSets?:number; awaySets?:number
  homeCorners:number; awayCorners:number
  homeYellows:number; awayYellows:number
  homeReds:number; awayReds:number
  minute:number; status:MatchStatus
  odds:Record<string,number>
  events:MatchEvent[]
  league:string
}

export interface PlacedBet {
  id:string; matchId:string; matchDesc:string; sport:Sport
  betType:string; betLabel:string; amount:number; odds:number
  status:'pending'|'won'|'lost'; payout:number
}

interface SportsStore {
  matches:Match[]; bets:PlacedBet[]; tickCount:number; sport:Sport
  setSport:(s:Sport)=>void
  tick:()=>void
  placeBet:(matchId:string,betType:string,betLabel:string,amount:number,odds:number)=>void
  settleBets:(match:Match)=>void
}

// ── ALL FOOTBALL TEAMS (LaLiga + Premier + Bundesliga) ──────────
const FOOTBALL_TEAMS: Team[] = [
  // LaLiga
  {id:'rma',name:'Real Madrid',       short:'RMA',strength:.92},
  {id:'bar',name:'Barcelona',         short:'BAR',strength:.90},
  {id:'atm',name:'Atlético Madrid',   short:'ATM',strength:.82},
  {id:'sev',name:'Sevilla',           short:'SEV',strength:.74},
  {id:'vil',name:'Villarreal',        short:'VIL',strength:.75},
  {id:'rso',name:'Real Sociedad',     short:'RSO',strength:.73},
  {id:'bet',name:'Real Betis',        short:'BET',strength:.72},
  {id:'ath',name:'Athletic Club',     short:'ATH',strength:.71},
  {id:'val',name:'Valencia',          short:'VAL',strength:.68},
  {id:'osa',name:'Osasuna',           short:'OSA',strength:.64},
  {id:'cel',name:'Celta Vigo',        short:'CEL',strength:.63},
  {id:'gir',name:'Girona',            short:'GIR',strength:.70},
  {id:'mal',name:'Mallorca',          short:'MAL',strength:.60},
  {id:'ray',name:'Rayo Vallecano',    short:'RAY',strength:.62},
  {id:'get',name:'Getafe',            short:'GET',strength:.61},
  {id:'esp',name:'Espanyol',          short:'ESP',strength:.59},
  {id:'cad',name:'Cádiz',             short:'CAD',strength:.54},
  {id:'ala',name:'Alavés',            short:'ALA',strength:.58},
  {id:'gra',name:'Granada',           short:'GRA',strength:.55},
  {id:'leg',name:'Leganés',           short:'LEG',strength:.56},
  // Premier League
  {id:'mci',name:'Manchester City',   short:'MCI',strength:.95},
  {id:'ars',name:'Arsenal',           short:'ARS',strength:.88},
  {id:'liv',name:'Liverpool',         short:'LIV',strength:.89},
  {id:'che',name:'Chelsea',           short:'CHE',strength:.80},
  {id:'mun',name:'Manchester Utd',    short:'MUN',strength:.78},
  {id:'tot',name:'Tottenham',         short:'TOT',strength:.79},
  {id:'new',name:'Newcastle',         short:'NEW',strength:.77},
  {id:'avl',name:'Aston Villa',       short:'AVL',strength:.76},
  // Bundesliga
  {id:'bay',name:'Bayern Munich',     short:'BAY',strength:.93},
  {id:'bvb',name:'Borussia Dortmund', short:'BVB',strength:.84},
  {id:'b04',name:'Bayer Leverkusen',  short:'B04',strength:.86},
  {id:'rbL',name:'RB Leipzig',        short:'RBL',strength:.81},
  // Serie A
  {id:'int',name:'Inter Milan',       short:'INT',strength:.87},
  {id:'jve',name:'Juventus',          short:'JVE',strength:.82},
  {id:'acm',name:'AC Milan',          short:'ACM',strength:.83},
  {id:'nap',name:'Napoli',            short:'NAP',strength:.80},
  // Ligue 1
  {id:'psg',name:'Paris Saint-Germain',short:'PSG',strength:.91},
  {id:'mon',name:'Monaco',            short:'MON',strength:.76},
]

const BASKETBALL_TEAMS: Team[] = [
  {id:'bos',name:'Boston Celtics',       short:'BOS',strength:.92},
  {id:'gsw',name:'Golden State Warriors',short:'GSW',strength:.87},
  {id:'lal',name:'LA Lakers',            short:'LAL',strength:.84},
  {id:'mil',name:'Milwaukee Bucks',      short:'MIL',strength:.88},
  {id:'phx',name:'Phoenix Suns',         short:'PHX',strength:.83},
  {id:'mia',name:'Miami Heat',           short:'MIA',strength:.82},
  {id:'den',name:'Denver Nuggets',       short:'DEN',strength:.89},
  {id:'okc',name:'OKC Thunder',          short:'OKC',strength:.86},
  {id:'sas',name:'San Antonio Spurs',    short:'SAS',strength:.74},
  {id:'chi',name:'Chicago Bulls',        short:'CHI',strength:.76},
  // EuroLeague
  {id:'rmaB',name:'Real Madrid (Basket)',short:'RMB',strength:.85},
  {id:'barB',name:'FC Barcelona (Basket)',short:'BAR',strength:.84},
  {id:'oly',name:'Olympiacos',           short:'OLY',strength:.78},
  {id:'cska',name:'CSKA Moscú',          short:'CSK',strength:.80},
]

const TENNIS_PLAYERS: TennisPlayer[] = [
  {id:'alc',name:'C. Alcaraz',   short:'ALC',strength:.92},
  {id:'djk',name:'N. Djokovic',  short:'DJK',strength:.94},
  {id:'sin',name:'J. Sinner',    short:'SIN',strength:.91},
  {id:'med',name:'D. Medvedev',  short:'MED',strength:.87},
  {id:'zve',name:'A. Zverev',    short:'ZVE',strength:.86},
  {id:'rub',name:'C. Ruud',      short:'RUD',strength:.82},
  {id:'fri',name:'T. Fritz',     short:'FRI',strength:.80},
  {id:'tsi',name:'S. Tsitsipas', short:'TSI',strength:.83},
  {id:'nad',name:'R. Nadal',     short:'NAD',strength:.85},
  {id:'fed',name:'R. Federer',   short:'FED',strength:.84},
  // WTA
  {id:'swa',name:'I. Swiatek',   short:'SWI',strength:.93},
  {id:'sau',name:'C. Sabalenka', short:'SAB',strength:.90},
  {id:'gav',name:'E. Gauff',     short:'GAU',strength:.86},
  {id:'rYb',name:'E. Rybakina',  short:'RYB',strength:.87},
]

// ── LEAGUES ────────────────────────────────────────────────────
const FOOTBALL_LEAGUES = ['LaLiga','Premier League','Bundesliga','Serie A','Ligue 1','Champions League']
const BASKETBALL_LEAGUES = ['NBA','EuroLeague']
const TENNIS_LEAGUES = ['ATP Tour','WTA Tour','Roland Garros','Wimbledon','US Open']

function calcOdds(hs:number, as:number, sport:Sport): Record<string,number> {
  const total = hs + as
  const hp = (hs/total)*1.1
  const ap = (as/total)*0.9
  const dp = Math.max(0.05, 1-hp-ap)
  const o = (p:number) => parseFloat(Math.max(1.05, (1/Math.max(0.04,p))*0.92).toFixed(2))
  const r = () => parseFloat((Math.random()*0.6+1.6).toFixed(2))

  if (sport === 'tennis') return { '1':o(hp*1.1), '2':o(ap*0.9) }

  if (sport === 'basketball') return {
    '1':o(hp), '2':o(ap),
    'over200': r(), 'over215': parseFloat((r()+0.15).toFixed(2)),
    'over225': parseFloat((r()+0.3).toFixed(2)),
    'handicap_home': parseFloat((1.85+Math.random()*0.3).toFixed(2)),
    'handicap_away': parseFloat((1.85+Math.random()*0.3).toFixed(2)),
  }

  return {
    '1':o(hp), 'X':o(dp), '2':o(ap),
    'over15': parseFloat((1.3+Math.random()*0.3).toFixed(2)),
    'over25': parseFloat((1.6+Math.random()*0.5).toFixed(2)),
    'over35': parseFloat((2.2+Math.random()*0.7).toFixed(2)),
    'btts':   parseFloat((1.7+Math.random()*0.4).toFixed(2)),
    'corners_over75':  parseFloat((1.7+Math.random()*0.4).toFixed(2)),
    'corners_over85':  parseFloat((1.9+Math.random()*0.4).toFixed(2)),
    'corners_over105': parseFloat((2.2+Math.random()*0.5).toFixed(2)),
    'over2cards': parseFloat((1.6+Math.random()*0.4).toFixed(2)),
    'over4cards': parseFloat((2.0+Math.random()*0.5).toFixed(2)),
    'over6cards': parseFloat((2.8+Math.random()*0.8).toFixed(2)),
    'home_yellow': parseFloat((2.0+Math.random()*0.6).toFixed(2)),
    'red_card': parseFloat((3.5+Math.random()*2.0).toFixed(2)),
    'home_win_nil': parseFloat((4.0+Math.random()*2.0).toFixed(2)),
    'away_win_nil': parseFloat((5.0+Math.random()*3.0).toFixed(2)),
  }
}

function makeMatch(sport:Sport): Match {
  const id = sport+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)
  if (sport === 'tennis') {
    const shuffled = [...TENNIS_PLAYERS].sort(()=>Math.random()-.5)
    const [home,away] = shuffled
    const league = TENNIS_LEAGUES[Math.floor(Math.random()*TENNIS_LEAGUES.length)]
    return { id,sport,home,away, homeScore:0,awayScore:0,homeSets:0,awaySets:0,
      homeCorners:0,awayCorners:0,homeYellows:0,awayYellows:0,homeReds:0,awayReds:0,
      minute:0,status:'upcoming' as MatchStatus,odds:calcOdds(home.strength,away.strength,sport),events:[],league }
  }
  if (sport === 'basketball') {
    const shuffled = [...BASKETBALL_TEAMS].sort(()=>Math.random()-.5)
    const [home,away] = shuffled
    const league = BASKETBALL_LEAGUES[Math.floor(Math.random()*BASKETBALL_LEAGUES.length)]
    return { id,sport,home,away, homeScore:0,awayScore:0,
      homeCorners:0,awayCorners:0,homeYellows:0,awayYellows:0,homeReds:0,awayReds:0,
      minute:0,status:'upcoming' as MatchStatus,odds:calcOdds(home.strength,away.strength,sport),events:[],league }
  }
  // Football — pick random league and corresponding teams
  const leagueIdx = Math.floor(Math.random()*FOOTBALL_LEAGUES.length)
  const league = FOOTBALL_LEAGUES[leagueIdx]
  const leagueTeams = FOOTBALL_TEAMS.slice(leagueIdx*6, leagueIdx*6+8).length >= 2
    ? FOOTBALL_TEAMS.slice(leagueIdx*6, leagueIdx*6+8)
    : FOOTBALL_TEAMS
  const shuffled = [...leagueTeams].sort(()=>Math.random()-.5)
  const [home,away] = shuffled
  return { id,sport,home,away, homeScore:0,awayScore:0,
    homeCorners:0,awayCorners:0,homeYellows:0,awayYellows:0,homeReds:0,awayReds:0,
    minute:0,status:'upcoming' as MatchStatus,odds:calcOdds(home.strength,away.strength,sport),events:[],league }
}

function initMatches(): Match[] {
  return [
    ...Array(6).fill(null).map(()=>makeMatch('football')),
    ...Array(3).fill(null).map(()=>makeMatch('basketball')),
    ...Array(3).fill(null).map(()=>makeMatch('tennis')),
  ]
}

function simulateTick(m:Match): Match {
  if (m.status==='finished') return m
  if (m.status==='upcoming') return {...m, status:'live' as MatchStatus}

  const n = m.minute+1
  let hs=m.homeScore, as=m.awayScore
  let hc=m.homeCorners, ac=m.awayCorners
  let hy=m.homeYellows, ay=m.awayYellows
  let hr=m.homeReds, ar=m.awayReds
  let hsets=m.homeSets??0, asets=m.awaySets??0
  const evs=[...m.events]
  const hStr=(m.home as Team).strength??0.75
  const aStr=(m.away as Team).strength??0.75

  if (m.sport==='football') {
    if (Math.random()<0.028) {
      const hg=Math.random()<hStr/(hStr+aStr)*1.1
      if(hg)hs++;else as++
      evs.push({minute:n,type:'goal',team:hg?m.home.short:m.away.short,desc:`⚽ ${n}' GOL — ${hg?m.home.name:m.away.name}`})
    }
    if (Math.random()<0.055) {
      const hCorner=Math.random()<0.52
      if(hCorner)hc++;else ac++
      evs.push({minute:n,type:'corner',team:hCorner?m.home.short:m.away.short,desc:`🚩 ${n}' Córner — ${hCorner?m.home.short:m.away.short}`})
    }
    if (Math.random()<0.04) {
      const hCard=Math.random()<0.5
      const isRed=Math.random()<0.08
      if(hCard){if(isRed)hr++;else hy++}else{if(isRed)ar++;else ay++}
      evs.push({minute:n,type:isRed?'red':'yellow',team:hCard?m.home.short:m.away.short,desc:`${isRed?'🟥':'🟨'} ${n}' — ${hCard?m.home.short:m.away.short}`})
    }
    if(n>=90) return {...m,homeScore:hs,awayScore:as,homeCorners:hc,awayCorners:ac,homeYellows:hy,awayYellows:ay,homeReds:hr,awayReds:ar,minute:n,status:'finished' as MatchStatus,events:evs.slice(-8)}
  } else if (m.sport==='basketball') {
    if(Math.random()<0.35){const hb=Math.random()<hStr/(hStr+aStr);const pts=[1,2,2,2,3][Math.floor(Math.random()*5)];if(hb)hs+=pts;else as+=pts}
    if(n>=48) return {...m,homeScore:hs,awayScore:as,minute:n,status:'finished' as MatchStatus,events:evs.slice(-5)}
  } else if (m.sport==='tennis') {
    if(Math.random()<0.15){
      const hw=Math.random()<hStr/(hStr+aStr)
      if(hw)hs++;else as++
      if(hs>=6||as>=6){
        if(hs>as)hsets++;else asets++
        hs=0;as=0
        if(hsets>=2||asets>=2) return {...m,homeScore:hs,awayScore:as,homeSets:hsets,awaySets:asets,minute:n,status:'finished' as MatchStatus,events:evs}
      }
    }
    if(n>=120) return {...m,homeScore:hs,awayScore:as,homeSets:hsets,awaySets:asets,minute:n,status:'finished' as MatchStatus,events:evs}
  }

  return {...m,homeScore:hs,awayScore:as,homeCorners:hc,awayCorners:ac,homeYellows:hy,awayYellows:ay,homeReds:hr,awayReds:ar,homeSets:hsets,awaySets:asets,minute:n,status:'live' as MatchStatus,events:evs.slice(-8)}
}

export const useSportsStore = create<SportsStore>()(
  persist(
    (set,get)=>({
      matches: initMatches(),
      bets: [],
      tickCount: 0,
      sport: 'football',
      setSport: (s) => set({sport:s}),

      tick: () => set(state => {
        const matches = state.matches.map(m=>{
          const updated=simulateTick(m)
          if(updated.status==='finished'&&m.status!=='finished') get().settleBets(updated)
          return updated
        })
        const final = matches.map(m=>{
          // Regenerate finished matches after random delay
          if(m.status==='finished'&&Math.random()<0.006) return makeMatch(m.sport)
          return m
        })
        return {matches:final, tickCount:state.tickCount+1}
      }),

      placeBet: (matchId,betType,betLabel,amount,odds) => {
        const sport = get().matches.find(m=>m.id===matchId)?.sport??'football'
        const match = get().matches.find(m=>m.id===matchId)
        const matchDesc = match ? `${match.home.short} vs ${match.away.short}` : matchId
        const bet:PlacedBet = {
          id:'b_'+Date.now(), matchId, matchDesc, sport, betType, betLabel,
          amount, odds, status:'pending' as 'pending'|'won'|'lost', payout:parseFloat((amount*odds).toFixed(2))
        }
        set(s=>({bets:[bet,...s.bets]}))
      },

      settleBets: (match) => {
        const {useGameStore} = require('./store')
        set(s=>({
          bets: s.bets.map(b=>{
            if(b.matchId!==match.id||b.status!=='pending') return b
            const hs=match.homeScore, as=match.awayScore
            const tc=match.homeCorners+match.awayCorners
            const ty=match.homeYellows+match.awayYellows+match.homeReds+match.awayReds
            const result=hs>as?'1':hs<as?'2':'X'
            let won=false
            switch(b.betType){
              case '1': won=result==='1';break
              case 'X': won=result==='X';break
              case '2': won=result==='2';break
              case 'over15': won=hs+as>1.5;break
              case 'over25': won=hs+as>2.5;break
              case 'over35': won=hs+as>3.5;break
              case 'btts': won=hs>0&&as>0;break
              case 'corners_over75': won=tc>7.5;break
              case 'corners_over85': won=tc>8.5;break
              case 'corners_over105': won=tc>10.5;break
              case 'over2cards': won=ty>2;break
              case 'over4cards': won=ty>4;break
              case 'over6cards': won=ty>6;break
              case 'home_yellow': won=match.homeYellows>0;break
              case 'red_card': won=(match.homeReds+match.awayReds)>0;break
              case 'home_win_nil': won=hs>as&&as===0;break
              case 'away_win_nil': won=as>hs&&hs===0;break
              case 'over200': won=hs+as>200;break
              case 'over215': won=hs+as>215;break
              case 'over225': won=hs+as>225;break
              case 'handicap_home': won=hs>as+5;break
              case 'handicap_away': won=as>hs+5;break
            }
            if(won) try{useGameStore.setState((st:any)=>({bal:st.bal+b.payout}))}catch{}
            return {...b,status:won?'won':'lost'}
          })
        }))
      },
    }),
    {
      name: 'tickr-sports-state',
      partialize: (s) => ({ bets: s.bets, matches: s.matches, sport: s.sport })
    }
  )
)
