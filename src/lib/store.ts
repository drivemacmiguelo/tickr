import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Stock, FxItem, LsItem,
  STOCKS_DATA, FX_DATA, LS_DATA, RIVALS_DATA,
  fmtN, nextPrice, totalWealth, getLv, getNextLv, LEVELS
} from './gameData'

export { fmtN, totalWealth, getLv, getNextLv, LEVELS }

export interface Loan { n:string; amount:number; debt:number; rate:number; clr:string }

export interface GameStore {
  bal:number; xp:number; lv:number; trades:number; clicks:number
  food:number; water:number; hlth:number; farmed:number; activeTab:string
  stocks:Stock[]; stockHist:Record<number,number[]>
  fxItems:FxItem[]; fxHist:Record<string,number[]>; fxCat:string
  lsItems:LsItem[]; lsCat:string
  rivals:any[]; rivalTickCount:number
  skillPoints:number; unlockedSkills:string[]
  traderBonus:number; rentBonus:number; bmDiscount:number
  xpBonus:number; autoFarmRate:number; hackProtect:number
  buyDiscount:number
  prestigeLevel:number; prestigeMult:number
  activeLoan:Loan|null
  missionProgress:Record<string,number>; missionsLastReset:number
  casWon:number; casLost:number
  lastHackTime:number; bmIncomeUnreported:number; taxAdvisor:boolean
  empresa:{ name:string;founded:boolean;level:number;revenue:number;totalEarned:number;ipo:boolean;ipoPrice:number;upgrades:Record<string,number> }
  empresas:{ id:string;name:string;founded:boolean;level:number;revenue:number;totalEarned:number;ipo:boolean;ipoPrice:number;upgrades:Record<string,number> }[]
  currentSeasonId:string; seasonStart:number
  // actions
  setTab:(t:string)=>void
  tick:()=>void; tickRivals:()=>void
  buyStock:(id:number,qty:number)=>boolean; buyStockAmount:(id:number,amount:number)=>boolean; sellStock:(id:number,qty:number)=>boolean
  buyFx:(id:string,qty:number)=>boolean; sellFx:(id:string,qty:number)=>boolean; setFxCat:(c:string)=>void
  buyLs:(id:string)=>boolean; sellLs:(id:string)=>boolean; setLsCat:(c:string)=>void
  farmClick:()=>void; gainXP:(n:number)=>void
  unlockSkill:(id:string,cost:number,eff:(s:any)=>Partial<GameStore>)=>void
  takeLoan:(pid:string,amount:number,rate:number,n:string,clr:string)=>void
  repayLoan:(amount:number)=>void; tickLoan:()=>void
  doPrestige:()=>void; tickEmpresa:()=>void
  addCasWon:(a:number)=>void; addCasLost:(a:number)=>void
  maybeHack:()=>void; applyHealthConsequences:()=>void; tickAutoFarm:()=>void
  getTotalWealth:()=>number
}

const initStocks = ():Stock[] => STOCKS_DATA.map(s=>({...s,h:0,a:0}))
const initFx = ():FxItem[] => Object.values(FX_DATA).flat().map(f=>({...f,h:0,a:0}))
const initLs = ():LsItem[] => Object.values(LS_DATA).flat().map(i=>({...i,qty:0,buyPrice:0}))
const initRivals = () => RIVALS_DATA.map(r=>({...r,xp:0,lv:1}))

const rivalStrategy = (strat:string, bal:number):number => {
  const r = Math.random()
  switch(strat){
    case 'trader':    return Math.max(100,bal*(1+(r-.46)*.015))
    case 'quant':     return Math.max(100,bal*(1+(r-.45)*.008))
    case 'whale':     return r<.1?Math.max(100,bal*(1+(r-.4)*.12)):bal
    case 'fast':      return Math.max(50, bal*(1+(r-.47)*.025))
    case 'dark':      return Math.max(100,bal*(1+(r-.44)*.018))
    case 'steady':    return Math.max(500,bal*(1+(r-.42)*.01))
    case 'slow_burn': return Math.max(1000,bal*(1+(r-.44)*.007))
    case 'degen':     return r<.05?bal*(1.5+r*2):Math.max(100,bal*(1+(r-.5)*.04))
    case 'hedge':     return Math.max(2000,bal*(1+(r-.43)*.012))
    case 'vc':        return r<.02?bal*(2+r*5):Math.max(1000,bal*(1+(r-.46)*.02))
    case 'monster':   return r<.08?bal*(1.2+r*.8):Math.max(1000000,bal*(1+(r-.4)*.035))
    case 'god':       return r<.12?bal*(1.05+r*.15):Math.max(100000000,bal*(1+(r-.38)*.025))
    default:          return bal
  }
}

export const useGameStore = create<GameStore>()(persist((set,get)=>({
  bal:1000,xp:0,lv:1,trades:0,clicks:0,food:80,water:80,hlth:80,farmed:0,activeTab:'market',
  stocks:initStocks(),stockHist:{},
  fxItems:initFx(),fxHist:{},fxCat:'forex',
  lsItems:initLs(),lsCat:'casas',
  rivals:initRivals(),rivalTickCount:0,
  skillPoints:0,unlockedSkills:[],
  traderBonus:1,rentBonus:1,bmDiscount:1,xpBonus:1,autoFarmRate:0,hackProtect:1,buyDiscount:1,
  prestigeLevel:0,prestigeMult:1,
  activeLoan:null,
  missionProgress:{},missionsLastReset:Date.now(),
  casWon:0,casLost:0,
  lastHackTime:0,bmIncomeUnreported:0,taxAdvisor:false,
  empresa:{name:'Mi Startup',founded:false,level:0,revenue:0,totalEarned:0,ipo:false,ipoPrice:0,upgrades:{marketing:0,tech:0,ops:0,expansion:0}},
  empresas:[],  // multiple companies
  currentSeasonId:'greed',seasonStart:Date.now(),

  setTab:(t)=>set({activeTab:t}),

  gainXP:(amount)=>set(state=>{
    const boosted=Math.round(amount*state.xpBonus*state.prestigeMult)
    let xp=state.xp+boosted,lv=state.lv
    let next=getNextLv(lv)
    while(next&&xp>=next.xp){lv++;next=getNextLv(lv)}
    return{xp,lv,skillPoints:Math.floor(lv/2)+state.prestigeLevel*3}
  }),

  tick:()=>set(state=>{
    // Read multipliers from shared refs (set by useAchievements hook)
    const cycleMult = (globalThis as any).__tickrCycleMult ?? 1
    const rentMult  = (globalThis as any).__tickrRentMult  ?? 1
    const eventMults: Record<string,number> = (globalThis as any).__tickrEventMults ?? {}

    const stocks=state.stocks.map(s=>{
      const sectorMult = eventMults[s.s] ?? eventMults['ALL'] ?? 1
      return {...s, p: Math.max(0.01, nextPrice(s.p, s.v, s.id) * cycleMult * sectorMult)}
    })
    const fxItems=state.fxItems.map(f=>({...f,p:Math.max(0.0001,nextPrice(f.p,f.v)*cycleMult)}))
    const lsItems=state.lsItems.map(i=>i.ap?{...i,p:Math.max(1,i.p*(1+i.ap))}:i)
    const rent=lsItems.reduce((s,i)=>s+(i.r||0)*(i.qty||0),0)*state.rentBonus*rentMult
    const food=Math.max(0,state.food-.02)
    const water=Math.max(0,state.water-.03)
    const hlth=food<10||water<10?Math.max(0,state.hlth-.05):Math.min(100,state.hlth+.01)
    const sh={...state.stockHist}
    stocks.forEach(s=>{const a=[...(sh[s.id]||[]),s.p];sh[s.id]=a.length>80?a.slice(-80):a})
    const fh={...state.fxHist}
    fxItems.forEach(f=>{const a=[...(fh[f.id]||[]),f.p];fh[f.id]=a.length>80?a.slice(-80):a})
    return{stocks,fxItems,lsItems,stockHist:sh,fxHist:fh,bal:state.bal+rent/86400*1.3,food,water,hlth}
  }),

  tickRivals:()=>set(state=>({
    rivals:state.rivals.map(r=>({...r,bal:Math.max(100,rivalStrategy(r.strategy,r.bal)),xp:r.xp+Math.floor(Math.random()*5)})),
    rivalTickCount:state.rivalTickCount+1
  })),

  buyStock:(id,qty)=>{
    const{bal,stocks}=get();const s=stocks.find(st=>st.id===id)
    if(!s||bal<s.p*qty)return false
    const newAvg=s.h>0?(s.a*s.h+s.p*qty)/(s.h+qty):s.p
    set(state=>({bal:state.bal-s.p*qty,trades:state.trades+1,stocks:state.stocks.map(st=>st.id===id?{...st,h:st.h+qty,a:newAvg}:st)}))
    get().gainXP(qty*3);return true
  },
  // Buy by € amount — calculates fractional shares
  buyStockAmount:(id,amount)=>{
    const{bal,stocks}=get();const s=stocks.find(st=>st.id===id)
    if(!s||bal<amount||amount<=0)return false
    const qty=amount/s.p  // fractional shares
    const newAvg=s.h>0?(s.a*s.h+s.p*qty)/(s.h+qty):s.p
    set(state=>({bal:state.bal-amount,trades:state.trades+1,stocks:state.stocks.map(st=>st.id===id?{...st,h:st.h+qty,a:newAvg}:st)}))
    get().gainXP(Math.max(1,Math.floor(qty*3)));return true
  },
  sellStock:(id,qty)=>{
    const{stocks,traderBonus}=get();const s=stocks.find(st=>st.id===id)
    if(!s||s.h<qty)return false
    set(state=>({bal:state.bal+s.p*qty*traderBonus,trades:state.trades+1,stocks:state.stocks.map(st=>st.id===id?{...st,h:st.h-qty,a:st.h-qty<=0?0:st.a}:st)}))
    get().gainXP(qty*2);return true
  },
  setFxCat:(c)=>set({fxCat:c}),
  buyFx:(id,qty)=>{
    const{bal,fxItems}=get();const f=fxItems.find(fx=>fx.id===id)
    if(!f||bal<f.p*qty)return false
    const newAvg=f.h>0?(f.a*f.h+f.p*qty)/(f.h+qty):f.p
    set(state=>({bal:state.bal-f.p*qty,fxItems:state.fxItems.map(fx=>fx.id===id?{...fx,h:fx.h+qty,a:newAvg}:fx)}))
    get().gainXP(5);return true
  },
  sellFx:(id,qty)=>{
    const{fxItems}=get();const f=fxItems.find(fx=>fx.id===id)
    if(!f||f.h<qty)return false
    set(state=>({bal:state.bal+f.p*qty,fxItems:state.fxItems.map(fx=>fx.id===id?{...fx,h:fx.h-qty,a:fx.h-qty<=0?0:fx.a}:fx)}))
    get().gainXP(3);return true
  },
  setLsCat:(c)=>set({lsCat:c}),
  buyLs:(id)=>{
    const{bal,lsItems,buyDiscount}=get();const item=lsItems.find(i=>i.id===id)
    if(!item||bal<item.p*buyDiscount)return false
    set(state=>({bal:state.bal-item.p*state.buyDiscount,lsItems:state.lsItems.map(i=>i.id===id?{...i,qty:(i.qty||0)+1,buyPrice:item.p}:i)}))
    get().gainXP(Math.ceil(item.p/1000));return true
  },
  sellLs:(id)=>{
    const{lsItems}=get();const item=lsItems.find(i=>i.id===id)
    if(!item||(item.qty||0)<=0)return false
    set(state=>({bal:state.bal+item.p*.9,lsItems:state.lsItems.map(i=>i.id===id?{...i,qty:Math.max(0,(i.qty||0)-1)}:i)}))
    return true
  },
  farmClick:()=>set(state=>{
    const earn=Math.floor(state.lv*2*state.prestigeMult)
    return{bal:state.bal+earn,clicks:state.clicks+1,farmed:state.farmed+earn}
  }),
  unlockSkill:(id,cost,eff)=>set(state=>{
    if(state.skillPoints<cost||state.unlockedSkills.includes(id))return state
    return{...eff(state),skillPoints:state.skillPoints-cost,unlockedSkills:[...state.unlockedSkills,id]}
  }),
  takeLoan:(pid,amount,rate,n,clr)=>set(state=>({bal:state.bal+amount,activeLoan:{n,amount,debt:amount,rate,clr}})),
  repayLoan:(amount)=>set(state=>{
    if(!state.activeLoan)return state
    const pay=Math.min(amount,state.activeLoan.debt,state.bal)
    if(pay<=0)return state
    const newDebt=state.activeLoan.debt-pay
    return{bal:state.bal-pay,activeLoan:newDebt<=.01?null:{...state.activeLoan,debt:newDebt}}
  }),
  tickLoan:()=>set(state=>{
    if(!state.activeLoan)return state
    const newDebt=state.activeLoan.debt*(1+state.activeLoan.rate)
    return{activeLoan:{...state.activeLoan,debt:newDebt}}
  }),
  doPrestige:()=>set(state=>{
    const mults=[1,1.5,2,3,5,10]
    const mult=mults[Math.min(5,state.prestigeLevel+1)]
    return{...state,bal:1000*mult,xp:0,lv:1,trades:0,clicks:0,farmed:0,food:70,water:70,hlth:80,
      stocks:initStocks(),fxItems:initFx(),lsItems:initLs(),activeLoan:null,
      unlockedSkills:[],skillPoints:0,traderBonus:1,rentBonus:1,bmDiscount:1,
      autoFarmRate:0,hackProtect:1,buyDiscount:1,prestigeLevel:state.prestigeLevel+1,prestigeMult:mult}
  }),
  tickEmpresa:()=>set(state=>{
    if(!state.empresa.founded)return state
    const earn=state.empresa.revenue*state.prestigeMult*(1+state.empresa.level*.05)/76
    return{bal:state.bal+earn,empresa:{...state.empresa,totalEarned:state.empresa.totalEarned+earn}}
  }),
  addCasWon:(a)=>set(s=>({bal:s.bal+a,casWon:s.casWon+a})),
  addCasLost:(a)=>set(s=>({bal:s.bal-a,casLost:s.casLost+a})),
  maybeHack:()=>set(state=>{
    if(Date.now()-state.lastHackTime<90000||state.bal<5000||Math.random()>.006||state.hackProtect===0||Math.random()>.12*state.hackProtect)return state
    const stolen=state.bal*(.05+Math.random()*.12)*state.hackProtect
    return{bal:state.bal-stolen,lastHackTime:Date.now()}
  }),
  applyHealthConsequences:()=>set(state=>{
    if(state.hlth<=0)return{xp:Math.max(0,state.xp-Math.floor(state.xp*.3))}
    return state
  }),
  tickAutoFarm:()=>set(state=>{
    if(state.autoFarmRate<=0)return state
    return{bal:state.bal+state.autoFarmRate*state.prestigeMult}
  }),
  getTotalWealth:()=>{const{bal,stocks,lsItems}=get();return totalWealth(bal,stocks,lsItems)},
}),{
  name:'tickr-v11-state',
  partialize:(s)=>({
    bal:s.bal,xp:s.xp,lv:s.lv,trades:s.trades,clicks:s.clicks,
    food:s.food,water:s.water,hlth:s.hlth,farmed:s.farmed,
    stocks:s.stocks,fxItems:s.fxItems,lsItems:s.lsItems,
    rivals:s.rivals,stockHist:s.stockHist,fxHist:s.fxHist,
    skillPoints:s.skillPoints,unlockedSkills:s.unlockedSkills,
    traderBonus:s.traderBonus,rentBonus:s.rentBonus,bmDiscount:s.bmDiscount,
    xpBonus:s.xpBonus,autoFarmRate:s.autoFarmRate,hackProtect:s.hackProtect,
    buyDiscount:s.buyDiscount,prestigeLevel:s.prestigeLevel,prestigeMult:s.prestigeMult,
    activeLoan:s.activeLoan,casWon:s.casWon,casLost:s.casLost,
    empresa:s.empresa,empresas:s.empresas??[],bmIncomeUnreported:s.bmIncomeUnreported,taxAdvisor:s.taxAdvisor,
  })
}))

// ============================================================
// Extended store fields - added via zustand setState directly
// These are stored in the same persist key
// ============================================================

// Avatar store (separate small store for profile customization)
import { create as createAvatar } from 'zustand'
import { persist as persistAvatar } from 'zustand/middleware'

export interface AvatarStore {
  avatarEmoji: string
  playerName: string
  activeTitle: string
  unlockedAchievements: string[]
  unlockedTitles: string[]
  wealthHistory: { ts: number; val: number }[]
  economicPhase: string
  economicPhaseStart: number
  activeEventId: string | null
  activeEventEnd: number
  setAvatar: (emoji: string) => void
  setPlayerName: (name: string) => void
  setActiveTitle: (id: string) => void
  unlockAchievement: (id: string) => void
  unlockTitle: (id: string) => void
  addWealthPoint: (val: number) => void
  setEconomicPhase: (phase: string) => void
  setActiveEvent: (id: string | null, endTime: number) => void
}

export const useAvatarStore = createAvatar<AvatarStore>()(
  persistAvatar(
    (set) => ({
      avatarEmoji: '😎',
      playerName: 'Jugador',
      activeTitle: 'novice',
      unlockedAchievements: [],
      unlockedTitles: ['novice'],
      wealthHistory: [],
      economicPhase: 'expansion',
      economicPhaseStart: Date.now(),
      activeEventId: null,
      activeEventEnd: 0,
      setAvatar: (emoji) => set({ avatarEmoji: emoji }),
      setPlayerName: (name) => set({ playerName: name }),
      setActiveTitle: (id) => set({ activeTitle: id }),
      unlockAchievement: (id) => set(s => ({
        unlockedAchievements: s.unlockedAchievements.includes(id)
          ? s.unlockedAchievements
          : [...s.unlockedAchievements, id]
      })),
      unlockTitle: (id) => set(s => ({
        unlockedTitles: s.unlockedTitles.includes(id)
          ? s.unlockedTitles
          : [...s.unlockedTitles, id]
      })),
      addWealthPoint: (val) => set(s => {
        const now = Date.now()
        const hist = [...s.wealthHistory, { ts: now, val }]
        // Keep one point per minute, max 24h
        const filtered = hist.filter((p, i) => i === hist.length - 1 || now - p.ts < 86400000)
        return { wealthHistory: filtered.slice(-1440) }
      }),
      setEconomicPhase: (phase) => set({ economicPhase: phase, economicPhaseStart: Date.now() }),
      setActiveEvent: (id, endTime) => set({ activeEventId: id, activeEventEnd: endTime }),
    }),
    { name: 'tickr-avatar-state' }
  )
)
