import type { Stock } from '@/types/game'

export const INITIAL_STOCKS: Omit<Stock, 'h' | 'a'>[] = [
  { id:1,  n:'Apple Inc.',       s:'TECH',   p:182.5,  v:3  },
  { id:2,  n:'NVIDIA Corp.',     s:'AI',     p:875.0,  v:8  },
  { id:3,  n:'Tesla Inc.',       s:'AUTO',   p:178.2,  v:10 },
  { id:4,  n:'Microsoft',        s:'TECH',   p:415.3,  v:3  },
  { id:5,  n:'Amazon',           s:'TECH',   p:192.1,  v:5  },
  { id:6,  n:'Meta Platforms',   s:'SOCIAL', p:505.2,  v:6  },
  { id:7,  n:'Alphabet',         s:'TECH',   p:172.8,  v:4  },
  { id:8,  n:'Bitcoin ETF',      s:'CRYPTO', p:62000,  v:15 },
  { id:9,  n:'Ethereum ETF',     s:'CRYPTO', p:3400,   v:14 },
  { id:10, n:'Berkshire Hath.',  s:'FINANCE',p:368.4,  v:2  },
  { id:11, n:'JPMorgan Chase',   s:'FINANCE',p:198.7,  v:3  },
  { id:12, n:'ExxonMobil',       s:'ENERGY', p:116.2,  v:5  },
  { id:13, n:'LVMH',             s:'LUXURY', p:812.0,  v:4  },
  { id:14, n:'Repsol',           s:'ENERGY', p:14.8,   v:4  },
  { id:15, n:'Inditex',          s:'RETAIL', p:43.2,   v:3  },
  { id:16, n:'Santander',        s:'FINANCE',p:4.62,   v:5  },
  { id:17, n:'Iberdrola',        s:'ENERGY', p:11.8,   v:3  },
  { id:18, n:'Palantir',         s:'AI',     p:24.6,   v:12 },
  { id:19, n:'AMD',              s:'TECH',   p:165.3,  v:9  },
  { id:20, n:'SpaceX (OTC)',     s:'SPACE',  p:185.0,  v:18 },
]

export function getInitialStocks(): Stock[] {
  return INITIAL_STOCKS.map(s => ({ ...s, h: 0, a: 0 }))
}

export function fmtN(n: number): string {
  if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(2) + 'B'
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(1) + 'k'
  return n.toFixed(n % 1 === 0 ? 0 : 2)
}

export function totalWealth(bal: number, stocks: Stock[]): number {
  return bal + stocks.reduce((s, a) => s + a.p * a.h, 0)
}

export function nextPrice(price: number, vol: number, shock = 1): number {
  const move = (Math.random() - 0.495) * (vol / 100)
  return Math.max(0.01, price * (1 + move) * shock)
}
