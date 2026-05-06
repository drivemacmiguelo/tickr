'use client'
import { useState } from 'react'
import { useGameStore, fmtN, getLv, getNextLv, LEVELS, useAvatarStore } from '@/lib/store'
import { ACHIEVEMENTS, TITLES, ECONOMIC_PHASES } from '@/lib/achievementsData'
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'
import clsx from 'clsx'

type Sub = 'stats' | 'logros' | 'skills' | 'loans' | 'prestige'

const AVATARS = ['😎','🤑','💰','🦈','🐺','🦅','👑','🤖','🎩','🧠','🔥','⚡','💎','🏆','🦁','🐯','🦊','🎭','🥷','👨‍💻']

const SKILL_TREE = [
  { id:'trader',    name:'Trader',    icon:'📈', clr:'#34d399', nodes:[
    {id:'t1',name:'Análisis básico',  cost:1,effect:'+5% ventas',  req:null},
    {id:'t2',name:'Scalping',         cost:2,effect:'+12% ventas', req:'t1'},
    {id:'t3',name:'Análisis técnico', cost:3,effect:'+20% ventas', req:'t2'},
    {id:'t4',name:'Market Maker',     cost:5,effect:'+35% ventas', req:'t3'},
  ]},
  { id:'inversor',  name:'Inversor',  icon:'🏦', clr:'#818cf8', nodes:[
    {id:'i1',name:'Gestión patrimonial',cost:1,effect:'+10% rentas',req:null},
    {id:'i2',name:'Negociación',        cost:2,effect:'-5% compras',req:'i1'},
    {id:'i3',name:'Portfolio',          cost:3,effect:'+25% rentas',req:'i2'},
    {id:'i4',name:'Fondo Soberano',     cost:6,effect:'+60% rentas',req:'i3'},
  ]},
  { id:'grinder',   name:'Grinder',   icon:'⚡', clr:'#fbbf24', nodes:[
    {id:'g1',name:'Ritmo',          cost:1,effect:'+25% click', req:null},
    {id:'g2',name:'Flow State',     cost:2,effect:'+50% XP',    req:'g1'},
    {id:'g3',name:'Automatización', cost:3,effect:'Auto 3€/s',  req:'g2'},
    {id:'g4',name:'Máquina dinero', cost:5,effect:'Auto 15€/s', req:'g3'},
  ]},
  { id:'seguridad', name:'Seguridad', icon:'🛡️', clr:'#60a5fa', nodes:[
    {id:'s1',name:'Antivirus',         cost:1,effect:'Hackeos -50%', req:null},
    {id:'s2',name:'VPN',               cost:2,effect:'M. Negro safe',req:'s1'},
    {id:'s3',name:'Bunker Financiero', cost:4,effect:'Sin hackeos',  req:'s2'},
  ]},
]

const SKILL_EFFECTS: Record<string, (s:any)=>any> = {
  t1:()=>({traderBonus:1.05}), t2:()=>({traderBonus:1.12}),
  t3:()=>({traderBonus:1.20}), t4:()=>({traderBonus:1.35}),
  i1:()=>({rentBonus:1.10}),   i2:()=>({buyDiscount:0.95}),
  i3:()=>({rentBonus:1.25}),   i4:()=>({rentBonus:1.60,buyDiscount:0.85}),
  g2:()=>({xpBonus:1.5}),      g3:()=>({autoFarmRate:3}), g4:()=>({autoFarmRate:15}),
  s1:()=>({hackProtect:0.5}),  s3:()=>({hackProtect:0}),
}

const LOANS = [
  {id:'l1',n:'Microcrédito',     amount:5000,   rate:0.0008, clr:'#34d399',minLv:1},
  {id:'l2',n:'Préstamo Personal',amount:25000,  rate:0.0005, clr:'#818cf8',minLv:1},
  {id:'l3',n:'Crédito Inversor', amount:100000, rate:0.0003, clr:'#fbbf24',minLv:3},
  {id:'l4',n:'Hipoteca',         amount:500000, rate:0.00015,clr:'#e2b96f',minLv:5},
  {id:'l5',n:'Línea de Crédito', amount:2000000,rate:0.0001, clr:'#c084fc',minLv:8},
  {id:'l6',n:'Bono Corporativo', amount:10000000,rate:0.00008,clr:'#f87171',minLv:12},
]

const PRESTIGE_TIERS = [
  {lv:1,need:10000000,   bonus:1.5,badge:'⭐',   title:'Primer Prestige'},
  {lv:2,need:100000000,  bonus:2,  badge:'⭐⭐', title:'Doble Prestige'},
  {lv:3,need:1000000000, bonus:3,  badge:'⭐⭐⭐',title:'Triple Prestige'},
  {lv:4,need:10000000000,bonus:5,  badge:'💫',   title:'Legendario'},
  {lv:5,need:1e12,       bonus:10, badge:'👑',   title:'El Último'},
]

const MISSIONS = [
  {id:'m1',title:'Operador activo',desc:'5 operaciones',   type:'trades', target:5,    reward:{xp:100,money:500}},
  {id:'m2',title:'Trabajador',     desc:'50 clics',        type:'clicks', target:50,   reward:{xp:60, money:200}},
  {id:'m3',title:'Jugador',        desc:'1.000€ casino',   type:'casWon', target:1000, reward:{xp:80, money:300}},
  {id:'m4',title:'Inversor',       desc:'50k€ Lifestyle',  type:'lsValue',target:50000,reward:{xp:200,money:1000}},
  {id:'m5',title:'Magnate',        desc:'100k€ patrimonio',type:'wealth', target:100000,reward:{xp:300,money:2000}},
]

// Sector colors for pie chart
const SECTOR_COLORS: Record<string,string> = {
  TECH:'#818cf8',AI:'#c084fc',CRYPTO:'#fbbf24',FINANCE:'#34d399',
  ENERGY:'#fb923c',AUTO:'#60a5fa',SOCIAL:'#f87171',LUXURY:'#e2b96f',
  RETAIL:'#34d399',SPACE:'#818cf8',
}

export default function ProfileTab() {
  const store = useGameStore()
  const avatar = useAvatarStore()
  const [sub, setSub] = useState<Sub>('stats')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(avatar.playerName)

  const lvData = getLv(store.lv)
  const nextLv = getNextLv(store.lv)
  const xpPct = nextLv ? Math.min(100,((store.xp-(lvData?.xp||0))/((nextLv.xp||1)-(lvData?.xp||0)))*100) : 100
  const wealth = store.getTotalWealth()

  const activeTitle = TITLES.find(t => t.id === avatar.activeTitle)
  const currentPhase = ECONOMIC_PHASES[avatar.economicPhase as keyof typeof ECONOMIC_PHASES]

  // Portfolio breakdown by sector
  const sectorValues: Record<string,number> = {}
  store.stocks.forEach(s => {
    if (s.h > 0) sectorValues[s.s] = (sectorValues[s.s]||0) + s.p * s.h
  })
  const pieData = Object.entries(sectorValues).map(([sector, val]) => ({ name: sector, value: val }))

  // Stats
  // bestDay unused
  // worstDay unused
  const casinoRatio = store.casWon + store.casLost > 0
    ? (store.casWon / (store.casWon + store.casLost) * 100).toFixed(1)
    : '0.0'

  async function logout() {
    const { createClient } = await import('@/lib/supabase')
    const { useRouter: getRouter } = await import('next/navigation')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const SUBS: {id:Sub;label:string}[] = [
    {id:'stats',   label:'Stats'},
    {id:'logros',  label:'Logros'},
    {id:'skills',  label:'Skills'},
    {id:'loans',   label:'Créditos'},
    {id:'prestige',label:'Prestige'},
  ]

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Sub tabs */}
      <div className="flex-shrink-0 flex overflow-x-auto border-b" style={{borderColor:'var(--border)',background:'var(--bg2)'}}>
        {SUBS.map(s=>(
          <button key={s.id} onClick={()=>setSub(s.id)}
            className="flex-shrink-0 px-3 py-2.5 text-xs font-medium"
            style={{color:sub===s.id?'var(--text)':'var(--muted)',borderBottom:sub===s.id?'2px solid var(--blue)':'2px solid transparent'}}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── STATS ─────────────────────────────────────────── */}
        {sub==='stats'&&(
          <div className="flex flex-col gap-4 p-4">
            {/* Avatar card */}
            <div className="card p-4 flex items-center gap-3">
              {/* Avatar picker trigger */}
              <button onClick={()=>setShowAvatarPicker(v=>!v)}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border-2 relative hover:opacity-80 transition-opacity"
                style={{background:lvData.clr+'18',borderColor:lvData.clr+'44'}}>
                {avatar.avatarEmoji}
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-blue rounded-full w-4 h-4 flex items-center justify-center">✏️</span>
              </button>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex gap-2 mb-1">
                    <input value={nameInput} onChange={e=>setNameInput(e.target.value)}
                      className="flex-1 text-sm font-bold rounded-lg px-2 py-1 border outline-none"
                      style={{background:'var(--bg3)',borderColor:'var(--border)',color:'var(--text)'}}
                      onKeyDown={e=>{if(e.key==='Enter'){avatar.setPlayerName(nameInput);setEditingName(false)}}}
                      autoFocus />
                    <button onClick={()=>{avatar.setPlayerName(nameInput);setEditingName(false)}}
                      className="text-xs px-2 rounded-lg" style={{background:'var(--blue)',color:'#fff'}}>✓</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="text-sm font-bold" style={{color:'var(--text)'}}>{avatar.playerName}</div>
                    <button onClick={()=>{setNameInput(avatar.playerName);setEditingName(true)}}
                      className="text-[9px] opacity-50 hover:opacity-100">✏️</button>
                  </div>
                )}
                {activeTitle && (
                  <div className="text-[10px] font-bold mb-1" style={{color:activeTitle.clr}}>
                    {activeTitle.emoji} {activeTitle.name}
                  </div>
                )}
                <div className="text-xs font-bold" style={{color:lvData.clr}}>Nivel {store.lv} — {lvData.name}</div>
                <div className="mt-2">
                  <div className="flex justify-between text-[9px] mb-1" style={{color:'var(--muted)'}}>
                    <span>{store.xp.toLocaleString()} XP</span>
                    {nextLv&&<span>{nextLv.xp.toLocaleString()} XP</span>}
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{background:'var(--bg3)'}}>
                    <div className="h-full rounded-full transition-all" style={{width:`${xpPct}%`,background:lvData.clr}}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar picker */}
            {showAvatarPicker&&(
              <div className="card p-3">
                <div className="text-[9px] font-bold mb-2" style={{color:'var(--muted)'}}>ELIGE TU AVATAR</div>
                <div className="grid grid-cols-10 gap-1.5">
                  {AVATARS.map(e=>(
                    <button key={e} onClick={()=>{avatar.setAvatar(e);setShowAvatarPicker(false)}}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110"
                      style={{background:avatar.avatarEmoji===e?'rgba(129,140,248,.2)':'var(--bg3)',border:avatar.avatarEmoji===e?'1.5px solid var(--blue)':'1.5px solid transparent'}}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title selector */}
            {avatar.unlockedTitles.length > 1 && (
              <div className="card p-3">
                <div className="text-[9px] font-bold mb-2" style={{color:'var(--muted)'}}>TÍTULO ACTIVO</div>
                <div className="flex flex-wrap gap-1.5">
                  {avatar.unlockedTitles.map(tid=>{
                    const t=TITLES.find(t=>t.id===tid)
                    if(!t)return null
                    return(
                      <button key={tid} onClick={()=>avatar.setActiveTitle(tid)}
                        className="px-2.5 py-1.5 rounded-full text-[9px] font-bold border transition-all"
                        style={{
                          background:avatar.activeTitle===tid?t.clr+'18':'var(--bg3)',
                          color:avatar.activeTitle===tid?t.clr:'var(--muted)',
                          borderColor:avatar.activeTitle===tid?t.clr+'44':'var(--border)',
                        }}>
                        {t.emoji} {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Economic cycle indicator */}
            {currentPhase && (
              <div className="card p-3 flex items-center gap-3"
                style={{borderColor:currentPhase.color+'30',background:currentPhase.color+'06'}}>
                <span className="text-2xl">{currentPhase.emoji}</span>
                <div>
                  <div className="text-xs font-bold" style={{color:currentPhase.color}}>Ciclo: {currentPhase.label}</div>
                  <div className="text-[9px]" style={{color:'var(--muted)'}}>{currentPhase.desc}</div>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {l:'Patrimonio',  v:fmtN(wealth)+'€',           c:'#fbbf24'},
                {l:'Balance',     v:fmtN(store.bal)+'€',         c:'#34d399'},
                {l:'Operaciones', v:store.trades.toLocaleString(),c:'#818cf8'},
                {l:'Clics',       v:store.clicks.toLocaleString(),c:'#60a5fa'},
              ].map(({l,v,c})=>(
                <div key={l} className="card p-3">
                  <div className="text-[9px]" style={{color:'var(--muted)'}}>{l}</div>
                  <div className="text-sm font-bold" style={{color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Vitals */}
            <div className="card p-3">
              <div className="text-[9px] font-bold mb-2" style={{color:'var(--muted)'}}>VITALES</div>
              {[{l:'🍔',v:store.food,c:'#fb923c'},{l:'💧',v:store.water,c:'#60a5fa'},{l:'❤️',v:store.hlth,c:'#f87171'}].map(({l,v,c})=>(
                <div key={l} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs w-6">{l}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'var(--bg4)'}}>
                    <div className="h-full rounded-full" style={{width:`${v}%`,background:c}}/>
                  </div>
                  <span className="text-[9px] w-7 text-right" style={{color:'var(--muted)'}}>{Math.round(v)}%</span>
                </div>
              ))}
            </div>

            {/* Advanced stats */}
            <div className="card p-3">
              <div className="text-[9px] font-bold mb-3" style={{color:'var(--muted)'}}>ESTADÍSTICAS AVANZADAS</div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center"><div className="text-[8px]" style={{color:'var(--muted)'}}>Win rate casino</div><div className="text-sm font-bold" style={{color:'var(--green)'}}>{casinoRatio}%</div></div>
                <div className="text-center"><div className="text-[8px]" style={{color:'var(--muted)'}}>Casino ganado</div><div className="text-xs font-bold" style={{color:'var(--green)'}}>+{fmtN(store.casWon)}€</div></div>
                <div className="text-center"><div className="text-[8px]" style={{color:'var(--muted)'}}>Casino perdido</div><div className="text-xs font-bold" style={{color:'var(--red)'}}>-{fmtN(store.casLost)}€</div></div>
              </div>
              {/* Wealth chart */}
              {avatar.wealthHistory.length > 2 && (
                <div>
                  <div className="text-[9px] mb-2" style={{color:'var(--muted)'}}>Evolución patrimonio (últimas 24h)</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={avatar.wealthHistory.map((p:any)=>({v:p.val}))}>
                      <defs>
                        <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={1.5} fill="url(#wealthGrad)" dot={false} isAnimationActive={false}/>
                      <Tooltip formatter={(v:number)=>[fmtN(v)+'€','Patrimonio']} labelFormatter={()=>''} contentStyle={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:8,fontSize:10}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Portfolio pie */}
              {pieData.length > 0 && (
                <div className="mt-3">
                  <div className="text-[9px] mb-2" style={{color:'var(--muted)'}}>Distribución cartera por sector</div>
                  <div className="flex items-center gap-3">
                    <PieChart width={80} height={80}>
                      <Pie data={pieData} cx={36} cy={36} outerRadius={36} innerRadius={20} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry,i)=>(
                          <Cell key={i} fill={SECTOR_COLORS[entry.name]||'#818cf8'}/>
                        ))}
                      </Pie>
                    </PieChart>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {pieData.map(d=>(
                        <div key={d.name} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{background:SECTOR_COLORS[d.name]||'#818cf8'}}/>
                          <span className="text-[9px]" style={{color:'var(--muted)'}}>{d.name} {fmtN(d.value)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={logout} className="w-full py-3 rounded-xl text-xs font-bold border"
              style={{background:'rgba(248,113,113,.1)',color:'var(--red)',borderColor:'rgba(248,113,113,.2)'}}>
              Cerrar sesión
            </button>
          </div>
        )}

        {/* ── LOGROS ────────────────────────────────────────── */}
        {sub==='logros'&&(
          <div className="flex flex-col">
            <div className="px-4 py-2 border-b flex items-center justify-between" style={{borderColor:'var(--border)',background:'var(--bg2)'}}>
              <span className="text-xs" style={{color:'var(--muted)'}}>Desbloqueados</span>
              <span className="text-sm font-bold" style={{color:'var(--amber)'}}>{avatar.unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 overflow-hidden" style={{background:'var(--bg4)'}}>
              <div className="h-full" style={{width:`${(avatar.unlockedAchievements.length/ACHIEVEMENTS.length)*100}%`,background:'linear-gradient(90deg,var(--amber),#c084fc)',transition:'width .5s'}}/>
            </div>
            {ACHIEVEMENTS.map(ach=>{
              const done=avatar.unlockedAchievements.includes(ach.id)
              return(
                <div key={ach.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{borderColor:'var(--border)',opacity:done?1:0.4}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{background:done?(ach.badge||'#818cf8')+'18':'var(--bg3)',border:`1.5px solid ${done?(ach.badge||'#818cf8')+'40':'var(--border)'}`}}>
                    {done?ach.emoji:'🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold" style={{color:done?'var(--text)':'var(--muted)'}}>{ach.name}</div>
                    <div className="text-[9px]" style={{color:'var(--muted2)'}}>{ach.desc}</div>
                    {done&&<div className="text-[9px] mt-0.5" style={{color:'var(--green)'}}>+{ach.xp} XP{ach.money>0?` · +${fmtN(ach.money)}€`:''}</div>}
                  </div>
                  {done&&<span className="text-[10px] font-bold" style={{color:'var(--green)',flexShrink:0}}>✅</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* ── SKILLS ────────────────────────────────────────── */}
        {sub==='skills'&&(
          <div className="flex flex-col p-3 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{color:'var(--muted)'}}>Puntos disponibles</span>
              <span className="text-sm font-bold" style={{color:'var(--blue)'}}>{store.skillPoints} pts</span>
            </div>
            {SKILL_TREE.map(branch=>{
              const cnt=branch.nodes.filter(n=>store.unlockedSkills.includes(n.id)).length
              return(
                <div key={branch.id} className="card overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{borderColor:'var(--border)',background:branch.clr+'08'}}>
                    <span className="text-lg">{branch.icon}</span>
                    <div className="flex-1"><div className="text-xs font-bold" style={{color:branch.clr}}>{branch.name}</div></div>
                    <span className="text-[9px]" style={{color:branch.clr}}>{cnt}/{branch.nodes.length}</span>
                  </div>
                  {branch.nodes.map(node=>{
                    const isUnl=store.unlockedSkills.includes(node.id)
                    const reqOk=!node.req||store.unlockedSkills.includes(node.req)
                    const canUnl=!isUnl&&reqOk&&store.skillPoints>=node.cost
                    return(
                      <div key={node.id} onClick={()=>canUnl&&store.unlockSkill(node.id,node.cost,SKILL_EFFECTS[node.id]||(()=>({})))}
                        className="flex items-center gap-3 px-3 py-2.5 border-b last:border-0"
                        style={{borderColor:'var(--border)',opacity:isUnl||canUnl?1:0.35,cursor:canUnl?'pointer':'default'}}>
                        <span>{isUnl?'✅':'🔒'}</span>
                        <div className="flex-1"><div className="text-[11px] font-medium" style={{color:'var(--text)'}}>{node.name}</div><div className="text-[9px]" style={{color:'var(--muted)'}}>{node.effect}</div></div>
                        <div className="text-[10px] font-bold" style={{color:isUnl?'var(--green)':canUnl?'var(--amber)':'var(--muted)'}}>{isUnl?'Activo':node.cost+' pts'}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* ── LOANS ─────────────────────────────────────────── */}
        {sub==='loans'&&(
          <div className="flex flex-col p-3 gap-3">
            {store.activeLoan?(
              <div className="card p-3 flex flex-col gap-2" style={{borderColor:'rgba(248,113,113,.3)',background:'rgba(248,113,113,.04)'}}>
                <div className="flex justify-between"><span className="text-xs font-bold" style={{color:store.activeLoan.clr}}>{store.activeLoan.n}</span><span className="text-[9px] font-bold" style={{color:'var(--red)'}}>ACTIVO</span></div>
                <div className="flex justify-between text-xs"><span style={{color:'var(--muted)'}}>Deuda:</span><span className="font-bold" style={{color:'var(--red)'}}>{fmtN(store.activeLoan.debt)}€</span></div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:'var(--bg4)'}}>
                  <div className="h-full rounded-full" style={{width:`${Math.max(0,(1-store.activeLoan.debt/store.activeLoan.amount)*100).toFixed(1)}%`,background:store.activeLoan.clr}}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>store.repayLoan(store.activeLoan!.debt*.25)} className="flex-1 py-2 rounded-lg text-xs font-bold border" style={{background:'rgba(52,211,153,.1)',color:'var(--green)',borderColor:'rgba(52,211,153,.2)'}}>25%</button>
                  <button onClick={()=>store.repayLoan(store.activeLoan!.debt)} className="flex-1 py-2 rounded-lg text-xs font-bold border" style={{background:'rgba(52,211,153,.1)',color:'var(--green)',borderColor:'rgba(52,211,153,.2)'}}>Todo</button>
                </div>
              </div>
            ):<div className="text-[10px] p-2" style={{color:'var(--muted)'}}>Sin préstamos activos</div>}
            {LOANS.map(p=>{
              const canTake=!store.activeLoan&&store.lv>=p.minLv
              return(
                <div key={p.id} className="card p-3 flex flex-col gap-1.5">
                  <div className="flex justify-between"><span className="text-xs font-bold" style={{color:p.clr}}>{p.n}</span><span className="text-sm font-bold" style={{color:'var(--text)'}}>{fmtN(p.amount)}€</span></div>
                  <div className="text-[9px]" style={{color:'var(--muted)'}}>{(p.rate*100).toFixed(3)}%/tick · Nivel {p.minLv}+</div>
                  <button onClick={()=>store.takeLoan(p.id,p.amount,p.rate,p.n,p.clr)} disabled={!canTake}
                    className="w-full py-2 rounded-lg text-xs font-bold disabled:opacity-30"
                    style={canTake?{background:p.clr+'18',color:p.clr,border:`0.5px solid ${p.clr}44`}:{background:'var(--bg3)',color:'var(--muted)',border:'0.5px solid var(--border)'}}>
                    {store.activeLoan?'Paga primero':store.lv<p.minLv?`Nivel ${p.minLv} req.`:'Solicitar'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── PRESTIGE ──────────────────────────────────────── */}
        {sub==='prestige'&&(
          <div className="flex flex-col p-4 gap-4">
            <div className="card p-4 flex flex-col gap-2" style={{background:'linear-gradient(135deg,rgba(251,191,36,.06),rgba(192,132,252,.04))',borderColor:'rgba(251,191,36,.2)'}}>
              <div className="text-sm font-bold" style={{color:'var(--amber)'}}>Sistema Prestige</div>
              <div className="text-[10px] leading-relaxed" style={{color:'var(--muted)'}}>Resetea tu progreso y obtén un <b style={{color:'var(--amber)'}}>multiplicador permanente</b> de todo lo que ganes.</div>
              {store.prestigeLevel>0&&<div className="px-3 py-2 rounded-lg text-xs" style={{background:'rgba(251,191,36,.08)'}}><span style={{color:'var(--muted)'}}>Multiplicador activo: </span><span className="font-bold" style={{color:'var(--amber)'}}>x{store.prestigeMult}</span></div>}
            </div>
            {PRESTIGE_TIERS.filter(t=>t.lv===store.prestigeLevel+1).map(next=>{
              const canP=wealth>=next.need
              return(
                <div key={next.lv} className="card p-4 flex flex-col gap-3">
                  <div className="flex justify-between text-xs"><span style={{color:'var(--text)'}}>{next.badge} {next.title}</span><span className="font-bold" style={{color:'var(--amber)'}}>x{next.bonus}</span></div>
                  <div className="h-2 rounded-full overflow-hidden" style={{background:'var(--bg3)'}}>
                    <div className="h-full rounded-full" style={{width:`${Math.min(100,(wealth/next.need)*100).toFixed(1)}%`,background:'linear-gradient(90deg,#fbbf24,#c084fc)'}}/>
                  </div>
                  <div className="flex justify-between text-[9px]" style={{color:'var(--muted)'}}><span>{fmtN(wealth)}€</span><span>{fmtN(next.need)}€</span></div>
                  <button onClick={()=>canP&&store.doPrestige()} disabled={!canP}
                    className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-30"
                    style={canP?{background:'linear-gradient(135deg,#fbbf24,#c084fc)',color:'#000'}:{background:'var(--bg3)',color:'var(--muted)',cursor:'not-allowed'}}>
                    {canP?`🌟 HACER PRESTIGE — x${next.bonus}`:`Necesitas ${fmtN(next.need-wealth)}€ más`}
                  </button>
                </div>
              )
            })}
            {store.prestigeLevel>=5&&<div className="text-center py-8 opacity-70" style={{color:'var(--amber)'}}>👑 Máximo prestige.</div>}
          </div>
        )}

      </div>
    </div>
  )
}
