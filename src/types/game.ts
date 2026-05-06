export interface Stock {
  id: number
  n: string   // name
  s: string   // sector
  p: number   // price
  v: number   // volatility
  h: number   // holdings
  a: number   // avg buy price
}

export interface GameState {
  bal: number
  xp: number
  lv: number
  trades: number
  clicks: number
  food: number
  water: number
  hlth: number
  farmed: number
  stocks: Stock[]
  activeTab: string
  prestigeLevel: number
  prestigeMult: number
  skillPoints: number
  unlockedSkills: string[]
}

export const DEFAULT_GAME_STATE: GameState = {
  bal: 1000,
  xp: 0,
  lv: 1,
  trades: 0,
  clicks: 0,
  food: 80,
  water: 80,
  hlth: 80,
  farmed: 0,
  stocks: [],
  activeTab: 'market',
  prestigeLevel: 0,
  prestigeMult: 1,
  skillPoints: 0,
  unlockedSkills: [],
}

export interface Level {
  lv: number
  name: string
  xp: number
  clr: string
}

export const LEVELS: Level[] = [
  { lv:1,  name:'Novato',           xp:0,      clr:'#6b7280' },
  { lv:2,  name:'Aprendiz',         xp:100,    clr:'#34d399' },
  { lv:3,  name:'Trader Junior',    xp:300,    clr:'#34d399' },
  { lv:4,  name:'Especulador',      xp:700,    clr:'#818cf8' },
  { lv:5,  name:'Inversor',         xp:1500,   clr:'#818cf8' },
  { lv:6,  name:'Analista',         xp:3000,   clr:'#fbbf24' },
  { lv:7,  name:'Broker Pro',       xp:6000,   clr:'#fbbf24' },
  { lv:8,  name:'Portfolio Manager',xp:12000,  clr:'#f87171' },
  { lv:9,  name:'Hedge Fund',       xp:25000,  clr:'#f87171' },
  { lv:10, name:'Market Maker',     xp:50000,  clr:'#fb923c' },
  { lv:11, name:'Wolf of Tickr',    xp:100000, clr:'#c084fc' },
  { lv:12, name:'Billonario',       xp:200000, clr:'#e2b96f' },
  { lv:13, name:'Magnate',          xp:400000, clr:'#e2b96f' },
  { lv:14, name:'El Arquitecto',    xp:800000, clr:'#fff'    },
  { lv:15, name:'Dios del Mercado', xp:1600000,clr:'#fbbf24' },
]
