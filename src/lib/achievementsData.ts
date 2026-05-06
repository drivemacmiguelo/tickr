// ============================================================
// ACHIEVEMENTS
// ============================================================
export interface Achievement {
  id: string
  name: string
  desc: string
  emoji: string
  xp: number
  money: number
  badge?: string  // badge color
  check: (s: AchievementCheckState) => boolean
}

export interface AchievementCheckState {
  bal: number
  trades: number
  clicks: number
  lv: number
  casWon: number
  casLost: number
  prestigeLevel: number
  lsItems: { qty: number; p: number }[]
  stocks: { h: number; p: number }[]
  empresa: { level: number; ipo: boolean }
  hlth: number
  food: number
  water: number
  farmed: number
  activeLoan: { debt: number; amount: number } | null
  unlockedSkills: string[]
  bmIncomeUnreported: number
  getTotalWealth: () => number
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Beginner ─────────────────────────────────────────────
  {
    id: 'first_trade', name: 'Primer trade', emoji: '📈',
    desc: 'Realiza tu primera operación en bolsa',
    xp: 50, money: 100, badge: '#34d399',
    check: s => s.trades >= 1,
  },
  {
    id: 'first_loss', name: 'Primera pérdida', emoji: '📉',
    desc: 'Vende con pérdidas por primera vez. Bienvenido.',
    xp: 30, money: 200, badge: '#f87171',
    check: s => s.trades >= 3 && s.bal < 900,
  },
  {
    id: 'farm_100', name: 'Trabajador', emoji: '⚡',
    desc: 'Consigue 100 clics en Farmear',
    xp: 80, money: 500, badge: '#fbbf24',
    check: s => s.clicks >= 100,
  },
  {
    id: 'casino_first_win', name: 'Principiante con suerte', emoji: '🎰',
    desc: 'Gana en el casino por primera vez',
    xp: 60, money: 300, badge: '#c084fc',
    check: s => s.casWon > 0,
  },
  // ── Wealth milestones ────────────────────────────────────
  {
    id: 'wealth_10k', name: 'Cinco cifras', emoji: '💰',
    desc: 'Alcanza 10.000€ de patrimonio',
    xp: 200, money: 1000, badge: '#34d399',
    check: s => s.getTotalWealth() >= 10000,
  },
  {
    id: 'wealth_100k', name: 'Seis cifras', emoji: '💵',
    desc: 'Alcanza 100.000€ de patrimonio',
    xp: 500, money: 5000, badge: '#34d399',
    check: s => s.getTotalWealth() >= 100000,
  },
  {
    id: 'millionaire', name: 'Millonario', emoji: '🤑',
    desc: 'Alcanza 1.000.000€ de patrimonio',
    xp: 1000, money: 10000, badge: '#fbbf24',
    check: s => s.getTotalWealth() >= 1000000,
  },
  {
    id: 'wealth_10m', name: 'Magnate', emoji: '🏆',
    desc: 'Alcanza 10.000.000€ de patrimonio',
    xp: 3000, money: 50000, badge: '#fbbf24',
    check: s => s.getTotalWealth() >= 10000000,
  },
  {
    id: 'billionaire', name: 'Billonario', emoji: '👑',
    desc: 'Alcanza 1.000.000.000€ de patrimonio',
    xp: 10000, money: 500000, badge: '#e2b96f',
    check: s => s.getTotalWealth() >= 1000000000,
  },
  // ── Trading ──────────────────────────────────────────────
  {
    id: 'trades_50', name: 'Day Trader', emoji: '⚡',
    desc: 'Realiza 50 operaciones en bolsa',
    xp: 300, money: 2000, badge: '#818cf8',
    check: s => s.trades >= 50,
  },
  {
    id: 'trades_500', name: 'Máquina de trades', emoji: '🤖',
    desc: 'Realiza 500 operaciones en bolsa',
    xp: 1000, money: 10000, badge: '#818cf8',
    check: s => s.trades >= 500,
  },
  {
    id: 'all_in', name: 'All-in', emoji: '😤',
    desc: 'Invierte más del 95% de tu balance en un solo stock',
    xp: 200, money: 0, badge: '#f87171',
    check: s => {
      const maxPos = s.stocks.reduce((max, st) => Math.max(max, st.h * st.p), 0)
      return maxPos > s.bal * 0.95 && maxPos > 1000
    },
  },
  // ── Lifestyle ────────────────────────────────────────────
  {
    id: 'first_property', name: 'Propietario', emoji: '🏠',
    desc: 'Compra tu primera propiedad',
    xp: 150, money: 1000, badge: '#34d399',
    check: s => s.lsItems.some(i => i.qty > 0),
  },
  {
    id: 'ls_empire', name: 'Imperio inmobiliario', emoji: '🏙️',
    desc: 'Acumula 1M€ en activos de Lifestyle',
    xp: 800, money: 20000, badge: '#34d399',
    check: s => s.lsItems.reduce((t, i) => t + i.p * i.qty, 0) >= 1000000,
  },
  // ── Casino ───────────────────────────────────────────────
  {
    id: 'casino_big_win', name: 'Jackpot', emoji: '🎯',
    desc: 'Gana más de 10.000€ en una sola sesión de casino',
    xp: 400, money: 5000, badge: '#c084fc',
    check: s => s.casWon >= 10000,
  },
  {
    id: 'casino_addict', name: 'Adicto', emoji: '🎰',
    desc: 'Pierde más de 50.000€ en el casino',
    xp: 100, money: 0, badge: '#f87171',
    check: s => s.casLost >= 50000,
  },
  // ── Life ─────────────────────────────────────────────────
  {
    id: 'healthy', name: 'Sano y rico', emoji: '❤️',
    desc: 'Mantén los 3 vitales al 100% al mismo tiempo',
    xp: 200, money: 2000, badge: '#f87171',
    check: s => s.hlth >= 99 && s.food >= 99 && s.water >= 99,
  },
  {
    id: 'near_death', name: 'Al límite', emoji: '💀',
    desc: 'Llega al borde de la muerte (salud < 5)',
    xp: 50, money: 500, badge: '#6b7280',
    check: s => s.hlth < 5,
  },
  // ── Empresa ──────────────────────────────────────────────
  {
    id: 'unicorn', name: 'Unicornio', emoji: '🦄',
    desc: 'Escala tu empresa a nivel Unicornio',
    xp: 2000, money: 100000, badge: '#c084fc',
    check: s => s.empresa.level >= 4,
  },
  {
    id: 'ipo_done', name: 'Wall Street', emoji: '🏛️',
    desc: 'Lanza el IPO de tu empresa',
    xp: 1500, money: 50000, badge: '#fbbf24',
    check: s => s.empresa.ipo,
  },
  // ── Prestige ─────────────────────────────────────────────
  {
    id: 'first_prestige', name: 'Renacido', emoji: '🌟',
    desc: 'Completa tu primer Prestige',
    xp: 5000, money: 100000, badge: '#fbbf24',
    check: s => s.prestigeLevel >= 1,
  },
  // ── Skills ───────────────────────────────────────────────
  {
    id: 'skill_master', name: 'Maestro de habilidades', emoji: '🧠',
    desc: 'Desbloquea 10 habilidades',
    xp: 500, money: 10000, badge: '#818cf8',
    check: s => s.unlockedSkills.length >= 10,
  },
  // ── Dark ─────────────────────────────────────────────────
  {
    id: 'criminal_mind', name: 'Mente criminal', emoji: '🕶️',
    desc: 'Acumula 100.000€ sin declarar en el mercado negro',
    xp: 300, money: 0, badge: '#ff6b35',
    check: s => s.bmIncomeUnreported >= 100000,
  },
  {
    id: 'debt_free', name: 'Libre de deudas', emoji: '🗽',
    desc: 'Paga completamente un préstamo',
    xp: 200, money: 1000, badge: '#34d399',
    check: s => !s.activeLoan && s.trades > 5,
  },
]

// ============================================================
// TITLES
// ============================================================
export interface Title {
  id: string
  name: string
  emoji: string
  desc: string
  clr: string
  check: (s: AchievementCheckState & { unlockedAchievements: string[] }) => boolean
}

export const TITLES: Title[] = [
  { id: 'novice',      name: 'El Novato',          emoji: '🐣', clr: '#6b7280', desc: 'Acaba de llegar', check: () => true },
  { id: 'daytrader',   name: 'Day Trader',          emoji: '⚡', clr: '#818cf8', desc: '50+ operaciones',      check: s => s.trades >= 50 },
  { id: 'whale',       name: 'La Ballena',          emoji: '🐋', clr: '#60a5fa', desc: '10M€ en stocks',      check: s => s.stocks.reduce((t,st)=>t+st.h*st.p,0) >= 10000000 },
  { id: 'landlord',    name: 'El Rentista',         emoji: '🏠', clr: '#34d399', desc: '1M€ en Lifestyle',    check: s => s.lsItems.reduce((t,i)=>t+i.p*i.qty,0) >= 1000000 },
  { id: 'gambler',     name: 'El Jugador',          emoji: '🎰', clr: '#c084fc', desc: '50k€ en casino',      check: s => s.casWon + s.casLost >= 50000 },
  { id: 'narco',       name: 'El Narco',            emoji: '🕶️', clr: '#ff6b35', desc: '50k€ mercado negro', check: s => s.bmIncomeUnreported >= 50000 },
  { id: 'millionaire', name: 'Millonario',          emoji: '💰', clr: '#fbbf24', desc: '1M€ patrimonio',     check: s => s.getTotalWealth() >= 1000000 },
  { id: 'tech_ceo',    name: 'Tech CEO',            emoji: '🏢', clr: '#818cf8', desc: 'Empresa nivel 3+',   check: s => s.empresa.level >= 3 },
  { id: 'unicorn',     name: 'El Unicornio',        emoji: '🦄', clr: '#c084fc', desc: 'Empresa nivel 4',    check: s => s.empresa.level >= 4 },
  { id: 'prestige1',   name: 'El Renacido',         emoji: '🌟', clr: '#fbbf24', desc: 'Primer prestige',    check: s => s.prestigeLevel >= 1 },
  { id: 'legend',      name: 'Leyenda',             emoji: '👑', clr: '#e2b96f', desc: 'Prestige 3+',        check: s => s.prestigeLevel >= 3 },
  { id: 'grinder',     name: 'El Grinder',          emoji: '⚙️', clr: '#fbbf24', desc: '10k clics',          check: s => s.clicks >= 10000 },
  { id: 'healthy',     name: 'El Saludable',        emoji: '❤️', clr: '#f87171', desc: 'Vitales 100%',       check: s => s.hlth >= 99 && s.food >= 99 && s.water >= 99 },
  { id: 'wallstreet',  name: 'Wall Street',         emoji: '🏛️', clr: '#fbbf24', desc: 'IPO lanzado',        check: s => s.empresa.ipo },
  { id: 'all_in_king', name: 'Rey del All-in',      emoji: '😤', clr: '#f87171', desc: '5+ logros',          check: s => s.unlockedAchievements.length >= 5 },
]

// ============================================================
// HISTORICAL EVENTS
// ============================================================
export interface HistoricalEvent {
  id: string
  name: string
  emoji: string
  desc: string
  durationMs: number
  color: string
  // Returns stock multipliers by sector (or all)
  sectorMultipliers: Record<string, number>  // sector -> price multiplier per tick
  newsText: string
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'crisis_2008',
    name: 'Crisis Financiera 2008',
    emoji: '💥',
    desc: 'Colapso bancario global. Los mercados caen en picado.',
    durationMs: 120000,
    color: '#f87171',
    sectorMultipliers: { FINANCE: 0.94, TECH: 0.96, ENERGY: 0.97, ALL: 0.97 },
    newsText: '🚨 CRISIS 2008: Lehman Brothers colapsa. Mercados en caída libre. Esto es histórico.',
  },
  {
    id: 'dotcom_2000',
    name: 'Burbuja .com 2000',
    emoji: '💻',
    desc: 'Las tecnológicas explotan. Sector TECH cae 60%.',
    durationMs: 90000,
    color: '#818cf8',
    sectorMultipliers: { TECH: 0.92, AI: 0.91, SPACE: 0.93, ALL: 0.99 },
    newsText: '💻 BURBUJA .COM: Las tecnológicas se desploman. El fin de la ilusión de internet.',
  },
  {
    id: 'covid_2020',
    name: 'COVID Crash 2020',
    emoji: '🦠',
    desc: 'Pandemia global. Todo cae. Luego rebota con fuerza.',
    durationMs: 150000,
    color: '#34d399',
    sectorMultipliers: { ALL: 0.95, FINANCE: 0.93, ENERGY: 0.92, TECH: 0.97 },
    newsText: '🦠 COVID-19: OMS declara pandemia. Mercados en pánico. Venta masiva histórica.',
  },
  {
    id: 'bull_run_2021',
    name: 'Bull Run 2021',
    emoji: '🚀',
    desc: 'Euforia total. Todo sube. El mercado no conoce el techo.',
    durationMs: 120000,
    color: '#fbbf24',
    sectorMultipliers: { ALL: 1.03, CRYPTO: 1.06, TECH: 1.04, AI: 1.05 },
    newsText: '🚀 BULL RUN: Mercados en máximos históricos. Bitcoin supera 60.000$. Todo sube.',
  },
  {
    id: 'oil_crisis',
    name: 'Crisis del Petróleo',
    emoji: '🛢️',
    desc: 'Conflicto geopolítico. Energía +40%, Tech sufre.',
    durationMs: 90000,
    color: '#fb923c',
    sectorMultipliers: { ENERGY: 1.04, FINANCE: 0.98, TECH: 0.97, ALL: 0.99 },
    newsText: '🛢️ CRISIS PETRÓLEO: Tensiones geopolíticas disparan el crudo. Energía en máximos.',
  },
  {
    id: 'crypto_winter',
    name: 'Crypto Winter',
    emoji: '🥶',
    desc: 'Regulación global aplasta las criptomonedas.',
    durationMs: 100000,
    color: '#60a5fa',
    sectorMultipliers: { CRYPTO: 0.88, TECH: 0.97, ALL: 0.99 },
    newsText: '🥶 CRYPTO WINTER: Gobiernos regulan las criptos. Bitcoin cae un 70% en semanas.',
  },
  {
    id: 'ai_boom',
    name: 'Boom de la IA',
    emoji: '🤖',
    desc: 'ChatGPT cambia el mundo. Tech y AI en euforia.',
    durationMs: 120000,
    color: '#c084fc',
    sectorMultipliers: { AI: 1.06, TECH: 1.04, SPACE: 1.03, ALL: 1.01 },
    newsText: '🤖 BOOM IA: La inteligencia artificial es el nuevo petróleo. NVIDIA sube 200%.',
  },
  {
    id: 'market_crash',
    name: 'Crack Bursátil',
    emoji: '📉',
    desc: 'Venta masiva instantánea. Todo cae 40-60% de golpe.',
    durationMs: 60000,
    color: '#f87171',
    sectorMultipliers: { ALL: 0.90 },
    newsText: '📉 CRACK BURSÁTIL: Venta masiva. Circuit breakers activados. Momento histórico.',
  },
]

// ============================================================
// ECONOMIC CYCLE
// ============================================================
export type EconomicPhase = 'expansion' | 'peak' | 'recession' | 'recovery'

export interface EconomicCycle {
  phase: EconomicPhase
  label: string
  emoji: string
  color: string
  desc: string
  priceMultiplier: number   // tick multiplier
  rentMultiplier: number
  durationMs: number
}

export const ECONOMIC_PHASES: Record<EconomicPhase, EconomicCycle> = {
  expansion: {
    phase: 'expansion', label: 'Expansión', emoji: '📈', color: '#34d399',
    desc: 'Economía en crecimiento. Buenos tiempos.',
    priceMultiplier: 1.002, rentMultiplier: 1.1, durationMs: 600000, // 10 min
  },
  peak: {
    phase: 'peak', label: 'Pico', emoji: '🔝', color: '#fbbf24',
    desc: 'Máximos históricos. ¿Sostenible?',
    priceMultiplier: 1.001, rentMultiplier: 1.2, durationMs: 300000, // 5 min
  },
  recession: {
    phase: 'recession', label: 'Recesión', emoji: '📉', color: '#f87171',
    desc: 'Contracción económica. Cuidado.',
    priceMultiplier: 0.999, rentMultiplier: 0.8, durationMs: 480000, // 8 min
  },
  recovery: {
    phase: 'recovery', label: 'Recuperación', emoji: '🌱', color: '#60a5fa',
    desc: 'Los mercados se recuperan lentamente.',
    priceMultiplier: 1.001, rentMultiplier: 0.95, durationMs: 420000, // 7 min
  },
}

export const CYCLE_SEQUENCE: EconomicPhase[] = ['expansion', 'peak', 'recession', 'recovery']
