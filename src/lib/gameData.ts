// ============================================================
// ALL GAME DATA — ported from tickr_v11.html
// ============================================================

export interface Stock {
  id: number; n: string; s: string; p: number; v: number; h: number; a: number
}
export interface FxItem {
  id: string; n: string; s: string; p: number; v: number; h: number; a: number; cat: string
}
export interface LsItem {
  id: string; n: string; p: number; r: number; ap: number; b: string; bc: string
  d: string; ex?: string; cat: string; qty: number; buyPrice: number
}
export interface ShopItem {
  id: string; n: string; p: number; cat: string; effect: string; emoji: string
}
export interface BmItem {
  id: string; n: string; p: number; gain: number; risk: number; emoji: string; desc: string
}
export interface Rival {
  id: string; name: string; emoji: string; clr: string; border: string
  title: string; bal: number; xp: number; lv: number; strategy: string
  msgs: { ahead: string[]; losing: string[] }
}
export interface Achievement {
  id: string; n: string; desc: string; emoji: string; unlocked: boolean
  check: (state: any) => boolean
}

// ---- STOCKS ----
export const STOCKS_DATA: Omit<Stock, 'h'|'a'>[] = [
  {id:1,  n:'Apple Inc.',        s:'TECH',   p:182.5,  v:3 },
  {id:2,  n:'NVIDIA Corp.',      s:'AI',     p:875.0,  v:8 },
  {id:3,  n:'Tesla Inc.',        s:'AUTO',   p:178.2,  v:10},
  {id:4,  n:'Microsoft',         s:'TECH',   p:415.3,  v:3 },
  {id:5,  n:'Amazon',            s:'TECH',   p:192.1,  v:5 },
  {id:6,  n:'Meta Platforms',    s:'SOCIAL', p:505.2,  v:6 },
  {id:7,  n:'Alphabet',          s:'TECH',   p:172.8,  v:4 },
  {id:8,  n:'Bitcoin ETF',       s:'CRYPTO', p:62000,  v:15},
  {id:9,  n:'Ethereum ETF',      s:'CRYPTO', p:3400,   v:14},
  {id:10, n:'Berkshire Hath.',   s:'FINANCE',p:368.4,  v:2 },
  {id:11, n:'JPMorgan Chase',    s:'FINANCE',p:198.7,  v:3 },
  {id:12, n:'ExxonMobil',        s:'ENERGY', p:116.2,  v:5 },
  {id:13, n:'LVMH',              s:'LUXURY', p:812.0,  v:4 },
  {id:14, n:'Repsol',            s:'ENERGY', p:14.8,   v:4 },
  {id:15, n:'Inditex',           s:'RETAIL', p:43.2,   v:3 },
  {id:16, n:'Santander',         s:'FINANCE',p:4.62,   v:5 },
  {id:17, n:'Iberdrola',         s:'ENERGY', p:11.8,   v:3 },
  {id:18, n:'Palantir',          s:'AI',     p:24.6,   v:12},
  {id:19, n:'AMD',               s:'TECH',   p:165.3,  v:9 },
  {id:20, n:'SpaceX (OTC)',      s:'SPACE',  p:185.0,  v:18},
]

// ---- FOREX ----
export const FX_DATA: Record<string, Omit<FxItem,'h'|'a'>[]> = {
  forex: [
    {id:'eur',n:'EUR/USD',s:'FOREX',p:1.0821,v:0.08,cat:'forex'},
    {id:'gbp',n:'GBP/USD',s:'FOREX',p:1.2654,v:0.1, cat:'forex'},
    {id:'jpy',n:'USD/JPY',s:'FOREX',p:151.42,v:0.15,cat:'forex'},
    {id:'chf',n:'USD/CHF',s:'FOREX',p:0.9012,v:0.08,cat:'forex'},
    {id:'aud',n:'AUD/USD',s:'FOREX',p:0.6534,v:0.12,cat:'forex'},
    {id:'cad',n:'USD/CAD',s:'FOREX',p:1.3621,v:0.09,cat:'forex'},
  ],
  metals: [
    {id:'xau',n:'Oro (XAU/USD)',   s:'METAL',p:2318.5,v:0.6,cat:'metals'},
    {id:'xag',n:'Plata (XAG/USD)', s:'METAL',p:27.42,  v:1.2,cat:'metals'},
    {id:'xpt',n:'Platino (XPT/USD)',s:'METAL',p:980.0,  v:0.9,cat:'metals'},
    {id:'xpd',n:'Paladio (XPD/USD)',s:'METAL',p:1040.0, v:1.5,cat:'metals'},
  ],
  energy: [
    {id:'wti',n:'Petróleo WTI',   s:'ENERGY',p:78.5, v:1.5,cat:'energy'},
    {id:'brent',n:'Brent Crude',  s:'ENERGY',p:82.3, v:1.4,cat:'energy'},
    {id:'natgas',n:'Gas Natural', s:'ENERGY',p:1.82, v:3.0,cat:'energy'},
  ],
  crypto: [
    {id:'btc',n:'Bitcoin (BTC)',  s:'CRYPTO',p:62000, v:3.0,cat:'crypto'},
    {id:'eth',n:'Ethereum (ETH)', s:'CRYPTO',p:3400,  v:3.5,cat:'crypto'},
    {id:'sol',n:'Solana (SOL)',   s:'CRYPTO',p:148.0, v:5.0,cat:'crypto'},
    {id:'bnb',n:'BNB',           s:'CRYPTO',p:570.0, v:4.0,cat:'crypto'},
    {id:'xrp',n:'Ripple (XRP)',  s:'CRYPTO',p:0.52,  v:6.0,cat:'crypto'},
  ],
}

// ---- LIFESTYLE ----
export const LS_DATA: Record<string, Omit<LsItem,'qty'|'buyPrice'>[]> = {
  casas: [
    {id:'ca1',n:'Estudio Lavapiés',   p:72000,   r:.09,  ap:0,      b:'Básico',   bc:'#818cf8',d:'28m², Madrid centro.',           ex:'Renta: 270€/mes',    cat:'casas'},
    {id:'ca2',n:'Piso en Gracia',     p:185000,  r:.22,  ap:0,      b:'Popular',  bc:'#34d399',d:'54m², Barcelona.',                ex:'Renta: 660€/mes',    cat:'casas'},
    {id:'ca3',n:'Ático Salamanca',    p:420000,  r:.51,  ap:.00002, b:'Premium',  bc:'#818cf8',d:'95m², Madrid. Terraza.',          ex:'Renta: 1.530€/mes',  cat:'casas'},
    {id:'ca4',n:'Chalet Pozuelo',     p:680000,  r:.82,  ap:.00003, b:'Lujo',     bc:'#e2b96f',d:'320m², piscina y jardín.',       ex:'Renta: 2.460€/mes',  cat:'casas'},
    {id:'ca5',n:'Villa Costa Brava',  p:950000,  r:1.1,  ap:.00004, b:'Premium',  bc:'#34d399',d:'480m², acceso playa.',           ex:'Renta: 3.300€/mes',  cat:'casas'},
    {id:'ca6',n:'Villa en Ibiza',     p:3500000, r:4.8,  ap:.00008, b:'Elite',    bc:'#c084fc',d:'650m², 6 suites.',               ex:'Renta: 14.400€/mes', cat:'casas'},
    {id:'ca7',n:'Penthouse Dubai',    p:12000000,r:18.5, ap:.0002,  b:'Mega',     bc:'#c084fc',d:'500m², Burj Khalifa views.',     ex:'Renta: 55.500€/mes', cat:'casas'},
    {id:'ca8',n:'Isla privada',       p:85000000,r:120,  ap:.0003,  b:'Único',    bc:'#fbbf24',d:'8 hectáreas. Helipuerto.',       ex:'Renta: 360.000€/mes',cat:'casas'},
  ],
  coches: [
    {id:'co1',n:'Tesla Model 3',       p:42000,   r:0,ap:-.0003,b:'Eléctrico', bc:'#34d399',d:'Autopilot incluido.',cat:'coches'},
    {id:'co2',n:'BMW M3 Competition',  p:98000,   r:0,ap:-.0002,b:'Sport',     bc:'#818cf8',d:'510cv, 3.9s de 0 a 100.',cat:'coches'},
    {id:'co3',n:'Porsche 911 Carrera', p:175000,  r:0,ap:.0002, b:'Icónico',   bc:'#fbbf24',d:'El deportivo más equilibrado.',cat:'coches'},
    {id:'co4',n:'Ferrari Roma',        p:235000,  r:0,ap:.0003, b:'Ferrari',   bc:'#f87171',d:'Grand tourer italiano.',cat:'coches'},
    {id:'co5',n:'Lamborghini Huracán', p:280000,  r:0,ap:.0003, b:'Raro',      bc:'#e2b96f',d:'V10 atmosférico. 640cv.',cat:'coches'},
    {id:'co6',n:'Bugatti Chiron',      p:3200000, r:0,ap:.001,  b:'Hypercar',  bc:'#818cf8',d:'1.500cv. 304mph.',cat:'coches'},
    {id:'co7',n:'Pagani Utopia',       p:3500000, r:0,ap:.0015, b:'Arte',      bc:'#e2b96f',d:'99 unidades. Obra de arte.',cat:'coches'},
  ],
  relojes: [
    {id:'re1',n:'TAG Heuer Carrera',   p:3200,   r:0,ap:.00006,b:'Sport',    bc:'#f87171',d:'Cronógrafo del automovilismo.',cat:'relojes'},
    {id:'re2',n:'Omega Seamaster',     p:6500,   r:0,ap:.00008,b:'Icónico',  bc:'#818cf8',d:'El reloj de James Bond.',cat:'relojes'},
    {id:'re3',n:'Rolex Submariner',    p:14800,  r:0,ap:.00015,b:'Iconic',   bc:'#34d399',d:'El rey del mercado secundario.',cat:'relojes'},
    {id:'re4',n:'Rolex Daytona',       p:28500,  r:0,ap:.0002, b:'Waiting',  bc:'#e2b96f',d:'Lista espera 10 años.',cat:'relojes'},
    {id:'re5',n:'AP Royal Oak',        p:68000,  r:0,ap:.00022,b:'Ultra',    bc:'#818cf8',d:'El primer reloj de lujo sport.',cat:'relojes'},
    {id:'re6',n:'Richard Mille RM 11', p:185000, r:0,ap:.0003, b:'Elite',    bc:'#c084fc',d:'El reloj de los deportistas de élite.',cat:'relojes'},
    {id:'re7',n:'Patek Philippe 5711', p:340000, r:0,ap:.0004, b:'Leyenda',  bc:'#fbbf24',d:'Descatalogado. Récord en subastas.',cat:'relojes'},
  ],
  joyas: [
    {id:'jo1',n:'Anillo Cartier Love',  p:7200,   r:0,ap:.0001, b:'Iconic',    bc:'#f87171',d:'El anillo más reconocible del mundo.',cat:'joyas'},
    {id:'jo2',n:'Diamante 1ct VVS1',    p:12000,  r:0,ap:.00012,b:'Premium',   bc:'#818cf8',d:'GIA certificado.',cat:'joyas'},
    {id:'jo3',n:'Esmeralda Colombia',   p:45000,  r:0,ap:.0002, b:'Rara',      bc:'#34d399',d:'Las mejores esmeraldas del mundo.',cat:'joyas'},
    {id:'jo4',n:'Zafiro Cachemira 5ct', p:120000, r:0,ap:.0003, b:'Excepcional',bc:'#818cf8',d:'El origen más valorado.',cat:'joyas'},
    {id:'jo5',n:'Pink Diamond 3ct',     p:4200000,r:0,ap:.0008, b:'Único',     bc:'#c084fc',d:'Solo 30 ud/década en el mundo.',cat:'joyas'},
  ],
  yates: [
    {id:'ya1',n:'Velero Bavaria 37',    p:85000,   r:.08,ap:-.0002,b:'Básico', bc:'#818cf8',d:'37 pies. Alquiler vacacional.',ex:'Charter: 2.400€/sem',cat:'yates'},
    {id:'ya2',n:'Lancha Sunseeker 48',  p:420000,  r:.45,ap:-.0001,b:'Sport',  bc:'#818cf8',d:'Lujo. Costa del Sol.',ex:'Charter: 13.500€/sem',cat:'yates'},
    {id:'ya3',n:'Yate Princess 60',     p:1800000, r:1.8,ap:.0001, b:'Lujo',   bc:'#e2b96f',d:'60 pies, 4 camarotes VIP.',ex:'Charter: 54.000€/sem',cat:'yates'},
    {id:'ya4',n:'Superyate 40m',        p:12000000,r:14.2,ap:.0003,b:'Super',  bc:'#c084fc',d:'Charter 180k€/semana.',ex:'Charter: 540.000€/sem',cat:'yates'},
    {id:'ya5',n:'Megayate 80m',         p:85000000,r:98, ap:.0005, b:'Mega',   bc:'#fbbf24',d:'Helipuerto, submarino.',ex:'Charter: 2.9M€/sem',cat:'yates'},
  ],
  jets: [
    {id:'je1',n:'Cessna Citation M2',     p:4200000,  r:2.8, ap:-.0002,b:'Entry',  bc:'#818cf8',d:'8 pasajeros. 4.000km.',ex:'Renta: 84.000€/mes',  cat:'jets'},
    {id:'je2',n:'Embraer Phenom 300',     p:9800000,  r:7.2, ap:-.0001,b:'Light',  bc:'#34d399',d:'El más vendido del mundo.',ex:'Renta: 216.000€/mes',cat:'jets'},
    {id:'je3',n:'Gulfstream G650',        p:65000000, r:55,  ap:.0001, b:'Ultra LR',bc:'#e2b96f',d:'13.900km de alcance.',ex:'Renta: 1.65M€/mes',  cat:'jets'},
    {id:'je4',n:'Boeing BBJ',             p:120000000,r:110, ap:.0002, b:'VIP',    bc:'#c084fc',d:'Boeing 737 privado.',ex:'Renta: 3.3M€/mes',    cat:'jets'},
    {id:'je5',n:'Airbus A380 Private',    p:500000000,r:420, ap:.0003, b:'Único',  bc:'#fbbf24',d:'El avión privado más grande.',ex:'Renta: 12.6M€/mes',  cat:'jets'},
  ],
}

// ---- SHOP ----
export const SHOP_DATA: Record<string, ShopItem[]> = {
  comida: [
    {id:'sh1',n:'Bocadillo',      p:5,  cat:'comida',effect:'+15 comida, +5 agua',   emoji:'🥪'},
    {id:'sh2',n:'Menú del día',   p:15, cat:'comida',effect:'+30 comida, +15 agua',  emoji:'🍱'},
    {id:'sh3',n:'Cena gourmet',   p:80, cat:'comida',effect:'+60 comida, +30 agua +10 salud',emoji:'🍽️'},
    {id:'sh4',n:'Chef privado',   p:500,cat:'comida',effect:'Comida siempre al 100%',emoji:'👨‍🍳'},
  ],
  bebidas: [
    {id:'sh5',n:'Agua',           p:2,  cat:'bebidas',effect:'+20 agua',             emoji:'💧'},
    {id:'sh6',n:'Energy drink',   p:8,  cat:'bebidas',effect:'+30 agua, +5 farm mult',emoji:'⚡'},
    {id:'sh7',n:'Champagne',      p:120,cat:'bebidas',effect:'+40 agua, +20 salud',  emoji:'🥂'},
  ],
  tabaco: [
    {id:'sh8',n:'Cigarrillo',     p:5,  cat:'tabaco',effect:'-5 salud, +2 XP',       emoji:'🚬'},
    {id:'sh9',n:'Puro habano',    p:80, cat:'tabaco',effect:'-2 salud, +10 XP',      emoji:'🪵'},
  ],
  salud: [
    {id:'sh10',n:'Vitaminas',     p:30, cat:'salud',effect:'+20 salud',              emoji:'💊'},
    {id:'sh11',n:'Médico privado',p:500,cat:'salud',effect:'Salud al 100%',          emoji:'👨‍⚕️'},
    {id:'sh12',n:'Seguro médico', p:2000,cat:'salud',effect:'Salud nunca baja de 40',emoji:'🏥'},
  ],
}

// ---- BLACK MARKET ----
export const BM_ITEMS: BmItem[] = [
  {id:'bm1',n:'Info privilegiada',p:50000,gain:150000,risk:0.35,emoji:'🕵️',desc:'Tip de un insider. Puede quintuplicar.'},
  {id:'bm2',n:'Hackeo rival',     p:30000,gain:80000, risk:0.4, emoji:'💻',desc:'Roba el 15% del balance de un rival.'},
  {id:'bm3',n:'Pump & Dump',      p:80000,gain:240000,risk:0.5, emoji:'📈',desc:'Manipula un stock 5 minutos.'},
  {id:'bm4',n:'Evasión fiscal',   p:20000,gain:60000, risk:0.25,emoji:'🏝️',desc:'Oculta ingresos a Hacienda.'},
  {id:'bm5',n:'Datos bancarios',  p:15000,gain:45000, risk:0.3, emoji:'💳',desc:'Acceso a cuentas ajenas.'},
  {id:'bm6',n:'Contrabando',      p:100000,gain:350000,risk:0.55,emoji:'📦',desc:'Alto riesgo, alto premio.'},
  {id:'bm7',n:'Asesor fiscal BM', p:200000,gain:0,    risk:0,   emoji:'🧑‍💼',desc:'Protege de inspecciones. Permanente.'},
]

// ---- RIVALS ----
export const RIVALS_DATA: Omit<Rival,'xp'|'lv'>[] = [
  {id:'r1', name:'María García',    emoji:'👩‍💼',clr:'#34d399',border:'rgba(52,211,153,.5)',  title:'Inversora Pro',      bal:1000, strategy:'trader',
   msgs:{ahead:['¡Esto es demasiado fácil!','¿Ya te rindes?'],losing:['Voy a por ti...','Qué suerte tienes.']}},
  {id:'r2', name:'Carlos Ruiz',     emoji:'👨‍💻',clr:'#818cf8',border:'rgba(129,140,248,.5)', title:'Quant Developer',    bal:1000, strategy:'quant',
   msgs:{ahead:['El algoritmo nunca falla.','RIP tu portfolio.'],losing:['Recalculando estrategia.','Glitch temporal.']}},
  {id:'r3', name:'Ibrahim Al-Saud', emoji:'👳',  clr:'#e2b96f',border:'rgba(226,185,111,.5)',title:'Fondo Soberano',     bal:1000, strategy:'whale',
   msgs:{ahead:['El petróleo siempre gana.'],losing:['Paciencia, largo plazo.']}},
  {id:'r4', name:'Yuki Tanaka',     emoji:'👩‍🔬',clr:'#c084fc',border:'rgba(192,132,252,.5)', title:'Daytrader Tokio',   bal:1000, strategy:'fast',
   msgs:{ahead:['速い！⚡ Too slow!'],losing:['Japón nunca se rinde.']}},
  {id:'r5', name:'Viktor Kozlov',   emoji:'🧔',  clr:'#f87171',border:'rgba(248,113,113,.5)', title:'Oligarca Ruso',     bal:1000, strategy:'dark',
   msgs:{ahead:['Recursos ilimitados.'],losing:['Pagarás por esto.']}},
  {id:'r6', name:'Sofia Marchetti', emoji:'👩‍🎨',clr:'#fb923c',border:'rgba(251,146,60,.5)',  title:'Angel Investor',    bal:2500, strategy:'steady',
   msgs:{ahead:['Las startups me dan de comer 😎'],losing:['El riesgo tiene su precio.']}},
  {id:'r7', name:'Aitor Etxeberria',emoji:'🧑‍🏭',clr:'#60a5fa',border:'rgba(96,165,250,.5)',  title:'Industrial',        bal:3000, strategy:'slow_burn',
   msgs:{ahead:['Ladrillo y acero, siempre ganan.'],losing:['Paciencia industrial.']}},
  {id:'r8', name:'Priya Kapoor',    emoji:'👩‍💻',clr:'#34d399',border:'rgba(52,211,153,.4)',  title:'Crypto Degen',      bal:800,  strategy:'degen',
   msgs:{ahead:['WAGMI 🚀🚀🚀'],losing:['NGMI...']}},
  {id:'r9', name:'Benoit Lefèvre',  emoji:'🧑‍💼',clr:'#818cf8',border:'rgba(129,140,248,.4)', title:'Hedge Fund Paris',  bal:5000, strategy:'hedge',
   msgs:{ahead:['Le marché travaille pour moi.'],losing:['C\'est la vie.']}},
  {id:'r10',name:'Min-jun Lee',     emoji:'👨‍🔬',clr:'#c084fc',border:'rgba(192,132,252,.4)', title:'VC Silicon Valley', bal:8000, strategy:'vc',
   msgs:{ahead:['10x o nada.'],losing:['Pivot necesario.']}},
  {id:'r11',name:'Elon-style Mega', emoji:'🦅',  clr:'#fbbf24',border:'rgba(251,191,36,.6)',  title:'Billonario Tech',   bal:50000000,  strategy:'monster',
   msgs:{ahead:['¿Cuánto llevas tú? 😂','Eso no es ni una comisión mía.'],losing:['Igual te compro a ti también.']}},
  {id:'r12',name:'BlackRock Bot',   emoji:'🤖',  clr:'#f87171',border:'rgba(248,113,113,.6)', title:'IA Gestión Activos', bal:500000000, strategy:'god',
   msgs:{ahead:['ERROR 404: rival not found.','Eres un rounding error.'],losing:['Anomalía detectada. Analizando.']}},
]

// ---- LEVELS ----
export const LEVELS = [
  {lv:1,  name:'Novato',            xp:0,      clr:'#6b7280'},
  {lv:2,  name:'Aprendiz',          xp:100,    clr:'#34d399'},
  {lv:3,  name:'Trader Junior',     xp:300,    clr:'#34d399'},
  {lv:4,  name:'Especulador',       xp:700,    clr:'#818cf8'},
  {lv:5,  name:'Inversor',          xp:1500,   clr:'#818cf8'},
  {lv:6,  name:'Analista',          xp:3000,   clr:'#fbbf24'},
  {lv:7,  name:'Broker Pro',        xp:6000,   clr:'#fbbf24'},
  {lv:8,  name:'Portfolio Manager', xp:12000,  clr:'#f87171'},
  {lv:9,  name:'Hedge Fund',        xp:25000,  clr:'#f87171'},
  {lv:10, name:'Market Maker',      xp:50000,  clr:'#fb923c'},
  {lv:11, name:'Wolf of Tickr',     xp:100000, clr:'#c084fc'},
  {lv:12, name:'Billonario',        xp:200000, clr:'#e2b96f'},
  {lv:13, name:'Magnate',           xp:400000, clr:'#e2b96f'},
  {lv:14, name:'El Arquitecto',     xp:800000, clr:'#ffffff'},
  {lv:15, name:'Dios del Mercado',  xp:1600000,clr:'#fbbf24'},
]

// ---- HELPERS ----
export function fmtN(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return (n/1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return (n/1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return (n/1e3).toFixed(1) + 'k'
  return n.toFixed(abs < 10 && n % 1 !== 0 ? 2 : 0)
}

// Market trend state (shared, reset on import)
const stockTrends: Record<number, { dir: number; strength: number; ticks: number }> = {}

export function nextPrice(price: number, vol: number, stockId?: number): number {
  // Get or init trend for this stock
  const id = stockId ?? 0
  if (!stockTrends[id] || stockTrends[id].ticks <= 0) {
    // New trend: direction (-1 bear / +1 bull), strength, duration
    stockTrends[id] = {
      dir: Math.random() > 0.48 ? 1 : -1,
      strength: 0.3 + Math.random() * 0.7,
      ticks: 5 + Math.floor(Math.random() * 20),
    }
  }
  const trend = stockTrends[id]
  trend.ticks--

  // Base random noise
  const noise = (Math.random() - 0.5) * (vol / 100)
  // Trend bias: stronger trend = more directional movement
  const bias = trend.dir * trend.strength * (vol / 400)
  // Occasional spike (5% chance)
  const spike = Math.random() < 0.05 ? (Math.random() - 0.5) * (vol / 50) : 0

  const move = noise + bias + spike
  return Math.max(0.01, price * (1 + move))
}

export function totalWealth(bal: number, stocks: Stock[], lsItems: LsItem[]): number {
  const stockVal = stocks.reduce((s, a) => s + a.p * a.h, 0)
  const lsVal = lsItems.reduce((s, i) => s + i.p * (i.qty || 0), 0)
  return bal + stockVal + lsVal
}

export function getLv(lv: number) {
  return LEVELS.find(l => l.lv === lv) || LEVELS[0]
}

export function getNextLv(lv: number) {
  return LEVELS.find(l => l.lv === lv + 1) || null
}

// ---- EMPRESA ----
export const EMPRESA_LEVELS = [
  { lv:0, name:'Idea en servilleta', cost:0,        revenue:0,      desc:'Todavía no has fundado nada' },
  { lv:1, name:'Startup',            cost:5000,     revenue:50,     desc:'App de delivery para mascotas. 3 empleados.' },
  { lv:2, name:'Scale-up',           cost:50000,    revenue:500,    desc:'Serie A cerrada. 15 empleados.' },
  { lv:3, name:'Empresa mediana',    cost:500000,   revenue:5000,   desc:'100 empleados. Rentable por primera vez.' },
  { lv:4, name:'Unicornio',          cost:5000000,  revenue:50000,  desc:'Valoración 1.000M€. 500 empleados.' },
  { lv:5, name:'Tech Giant',         cost:50000000, revenue:500000, desc:'Fortune 500. Presencia global.' },
]

export const EMPRESA_UPGRADES: Record<string, {name:string; cost:number; desc:string; revBonus:number}[]> = {
  marketing: [
    { name:'Blog corporativo',  cost:1000,   desc:'Contenido que convierte',    revBonus:0.10 },
    { name:'Campaña viral',     cost:10000,  desc:'Awareness masivo',           revBonus:0.25 },
    { name:'Super Bowl ad',     cost:200000, desc:'Máxima visibilidad global',  revBonus:0.50 },
  ],
  tech: [
    { name:'MVP básico',        cost:2000,   desc:'Lanzas el producto',         revBonus:0.15 },
    { name:'IA integrada',      cost:25000,  desc:'Eficiencia x3',              revBonus:0.30 },
    { name:'Quantum edge',      cost:500000, desc:'Tecnología imposible de copiar', revBonus:0.60 },
  ],
  ops: [
    { name:'CRM',               cost:3000,   desc:'Gestión de clientes',        revBonus:0.08 },
    { name:'CFO externo',       cost:30000,  desc:'Finanzas optimizadas',       revBonus:0.20 },
    { name:'Board of directors',cost:300000, desc:'Gobernanza de clase mundial',revBonus:0.35 },
  ],
  expansion: [
    { name:'Oficina Madrid',    cost:50000,  desc:'Mercado local consolidado',  revBonus:0.20 },
    { name:'Europa',            cost:500000, desc:'15 países. 10x clientes.',   revBonus:0.40 },
    { name:'Global',            cost:5000000,desc:'Presencia en 80 países.',    revBonus:0.80 },
  ],
}

// ---- COLECCIONABLES ----
export const COL_CATS = [
  { id:'cromos',    name:'Cromos',         icon:'🃏', clr:'#fbbf24' },
  { id:'camisetas', name:'Camisetas',      icon:'👕', clr:'#34d399' },
  { id:'botas',     name:'Botas firmadas', icon:'👟', clr:'#818cf8' },
  { id:'trofeos',   name:'Trofeos',        icon:'🏆', clr:'#e2b96f' },
  { id:'fotos',     name:'Fotografías',    icon:'📸', clr:'#60a5fa' },
  { id:'contratos', name:'Contratos',      icon:'📄', clr:'#c084fc' },
]

export const COL_ITEMS: {
  id:string; cat:string; name:string; rarity:string; basePrice:number; icon:string; desc:string
}[] = [
  // CROMOS
  {id:'cr1',cat:'cromos',  name:'Cromo Messi Debut 2004',      rarity:'Legendario',  basePrice:85000,  icon:'🃏',desc:'Primer cromo oficial de Messi en el Barça. PSA 10.'},
  {id:'cr2',cat:'cromos',  name:'Cromo Ronaldo Sporting 2001', rarity:'Épico',       basePrice:42000,  icon:'🃏',desc:'CR7 a los 16 años. Serie limitada.'},
  {id:'cr3',cat:'cromos',  name:'Cromo Maradona 1986',         rarity:'Legendario',  basePrice:120000, icon:'🃏',desc:'Panini WC86. Grado Mint. Solo 3 conocidos.'},
  {id:'cr4',cat:'cromos',  name:'Cromo Zidane rookie 1992',    rarity:'Raro',        basePrice:8500,   icon:'🃏',desc:'Temporada debut en Burdeos.'},
  {id:'cr5',cat:'cromos',  name:'Cromo Pelé Santos 1958',      rarity:'Único',       basePrice:350000, icon:'🃏',desc:'El cromo de fútbol más caro del mundo.'},
  {id:'cr6',cat:'cromos',  name:'Cromo Neymar debut 2009',     rarity:'Poco común',  basePrice:1200,   icon:'🃏',desc:'Santos FC. Serie brasileña.'},
  // CAMISETAS
  {id:'ca1',cat:'camisetas',name:'Camiseta Maradona "Mano de Dios"',rarity:'Único',  basePrice:8200000,icon:'👕',desc:'La camiseta del partido vs Inglaterra 1986.'},
  {id:'ca2',cat:'camisetas',name:'Camiseta Messi Copa América 2021',rarity:'Legendario',basePrice:450000,icon:'👕',desc:'Final vs Brasil. Firmada y numerada.'},
  {id:'ca3',cat:'camisetas',name:'Camiseta Ronaldo UCL 2018',   rarity:'Épico',      basePrice:280000, icon:'👕',desc:'Final Madrid vs Liverpool.'},
  {id:'ca4',cat:'camisetas',name:'Camiseta Zidane final 2002',  rarity:'Raro',       basePrice:95000,  icon:'👕',desc:'WC2002. Autógrafo certificado FIFA.'},
  {id:'ca5',cat:'camisetas',name:'Camiseta Jordan Bulls 1996',  rarity:'Épico',      basePrice:320000, icon:'👕',desc:'Temporada del 72-10. Game-worn.'},
  // BOTAS
  {id:'bo1',cat:'botas',   name:'Botas Messi UCL 2015',        rarity:'Legendario',  basePrice:180000, icon:'👟',desc:'Hat-trick vs Leverkusen. Firmadas.'},
  {id:'bo2',cat:'botas',   name:'Botas Ronaldo 500 goles',     rarity:'Épico',       basePrice:95000,  icon:'👟',desc:'Edición limitada. 1 de 7.'},
  {id:'bo3',cat:'botas',   name:'Air Jordan I originales 1984',rarity:'Único',       basePrice:560000, icon:'👟',desc:'Sin abrir. El par más valioso del mundo.'},
  // TROFEOS
  {id:'tr1',cat:'trofeos', name:'Réplica Balón de Oro 2023',   rarity:'Raro',        basePrice:15000,  icon:'🏆',desc:'Réplica oficial numerada 1/100.'},
  {id:'tr2',cat:'trofeos', name:'Réplica Copa del Mundo 2022', rarity:'Poco común',  basePrice:4500,   icon:'🏆',desc:'Réplica FIFA oficial dorada.'},
  {id:'tr3',cat:'trofeos', name:'Mini Champions League',       rarity:'Épico',       basePrice:85000,  icon:'🏆',desc:'Miniatura oficial UEFA firmada por árbitro final.'},
  // FOTOGRAFÍAS
  {id:'fo1',cat:'fotos',   name:'Foto Maradona Mano de Dios',  rarity:'Legendario',  basePrice:220000, icon:'📸',desc:'Foto original del fotógrafo oficial. Única.'},
  {id:'fo2',cat:'fotos',   name:'Foto Ali vs Liston 1965',     rarity:'Único',       basePrice:380000, icon:'📸',desc:'Neil Leifer. La foto deportiva más famosa.'},
  {id:'fo3',cat:'fotos',   name:'Foto Messi primer gol Barça', rarity:'Épico',       basePrice:75000,  icon:'📸',desc:'1 mayo 2005. Firmada por Messi y Ronaldinho.'},
  // CONTRATOS
  {id:'co1',cat:'contratos',name:'Contrato Zidane Real Madrid',rarity:'Único',       basePrice:1200000,icon:'📄',desc:'Contrato original 2001. 75M€.'},
  {id:'co2',cat:'contratos',name:'Contrato Neymar PSG 2017',   rarity:'Legendario',  basePrice:650000, icon:'📄',desc:'222M€. El traspaso más caro.'},
  {id:'co3',cat:'contratos',name:'Contrato rookie Jordan NBA', rarity:'Épico',       basePrice:290000, icon:'📄',desc:'Chicago Bulls 1984. Firmado.'},
]
