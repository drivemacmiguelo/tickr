'use client'
import { useState } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { EMPRESA_LEVELS, EMPRESA_UPGRADES } from '@/lib/gameData'
import { useNewsStore } from '@/lib/newsStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import clsx from 'clsx'

// ─── TYPES ─────────────────────────────────────────────────────
interface Company {
  id: string
  name: string
  sector: string
  emoji: string
  level: number
  revenue: number
  totalEarned: number
  ipo: boolean
  ipoPrice: number
  upgrades: Record<string, number>
}

// ─── PERSISTENT STORE ──────────────────────────────────────────
interface EmpresaStore {
  companies: Company[]
  activeCompanyId: string | null
  addCompany: (c: Company) => void
  updateCompany: (id: string, updates: Partial<Company>) => void
  setActive: (id: string) => void
  tickAllRevenue: () => void
}

export const useEmpresaStore = create<EmpresaStore>()(persist((set, get) => ({
  companies: [],
  activeCompanyId: null,
  addCompany: (c) => set(s => ({ companies: [...s.companies, c], activeCompanyId: c.id })),
  updateCompany: (id, updates) => set(s => ({
    companies: s.companies.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  setActive: (id) => set({ activeCompanyId: id }),
  tickAllRevenue: () => {
    const { companies } = get()
    let total = 0
    const updated = companies.map(c => {
      const earn = c.revenue / 76
      total += earn
      return { ...c, totalEarned: c.totalEarned + earn }
    })
    if (total > 0) useGameStore.setState(s => ({ bal: s.bal + total }))
    set({ companies: updated })
  },
}), { name: 'tickr-empresas-v2' }))

const SECTORS = [
  { id: 'tech',     name: 'Tecnología',   emoji: '💻' },
  { id: 'food',     name: 'Alimentación', emoji: '🍔' },
  { id: 'fashion',  name: 'Moda',         emoji: '👗' },
  { id: 'realestate',name:'Inmobiliaria', emoji: '🏠' },
  { id: 'finance',  name: 'Finanzas',     emoji: '💰' },
  { id: 'energy',   name: 'Energía',      emoji: '⚡' },
  { id: 'health',   name: 'Salud',        emoji: '🏥' },
  { id: 'gaming',   name: 'Videojuegos',  emoji: '🎮' },
]

const UPGRADE_CATS = ['marketing', 'tech', 'ops', 'expansion'] as const
const UPGRADE_LABELS: Record<string, string> = {
  marketing: '📣 Marketing', tech: '💻 Tecnología',
  ops: '⚙️ Operaciones', expansion: '🌍 Expansión'
}

type EmpresaTab = 'lista' | 'detalle' | 'nueva'

export default function EmpresaTab() {
  const { bal, gainXP } = useGameStore()
  const set = useGameStore.setState
  const addNews = useNewsStore(s => s.addNews)
  const { companies, activeCompanyId, addCompany, updateCompany, setActive } = useEmpresaStore()
  const [sub, setSub] = useState<EmpresaTab>('lista')
  const [newName, setNewName] = useState('')
  const [newSector, setNewSector] = useState('tech')

  const active = companies.find(c => c.id === activeCompanyId)
  const lvData = active ? EMPRESA_LEVELS[active.level] : null
  const nextLv = active ? EMPRESA_LEVELS[active.level + 1] : null

  function createCompany() {
    if (!newName.trim() || bal < EMPRESA_LEVELS[1].cost) return
    const sector = SECTORS.find(s => s.id === newSector)!
    const company: Company = {
      id: 'emp_' + Date.now(),
      name: newName.trim(),
      sector: newSector,
      emoji: sector.emoji,
      level: 1,
      revenue: EMPRESA_LEVELS[1].revenue,
      totalEarned: 0,
      ipo: false,
      ipoPrice: 0,
      upgrades: { marketing: 0, tech: 0, ops: 0, expansion: 0 }
    }
    set(s => ({ bal: s.bal - EMPRESA_LEVELS[1].cost }))
    addCompany(company)
    gainXP(200)
    addNews(`🏢 Nueva empresa fundada: ${newName}. El mercado está atento.`)
    setNewName('')
    setSub('detalle')
  }

  function upgradeLevel(id: string, company: Company) {
    const next = EMPRESA_LEVELS[company.level + 1]
    if (!next || bal < next.cost) return
    set(s => ({ bal: s.bal - next.cost }))
    updateCompany(id, { level: company.level + 1, revenue: next.revenue })
    gainXP(500)
    addNews(`🚀 ${company.name} escala a ${next.name}.`)
    if (company.level + 1 === 4) addNews(`🦄 ${company.name} alcanza valoración de 1.000M€. ¡Unicornio!`)
  }

  function doIPO(id: string, company: Company) {
    if (company.level < 3 || company.ipo) return
    const ipoPrice = company.revenue * 100
    set(s => ({ bal: s.bal + ipoPrice * 10 }))
    updateCompany(id, { ipo: true, ipoPrice })
    gainXP(1000)
    addNews(`📈 ${company.name} debuta en bolsa a ${fmtN(ipoPrice)}€/acción.`)
  }

  function buyUpgrade(id: string, company: Company, cat: string, idx: number) {
    const ups = EMPRESA_UPGRADES[cat]
    if (!ups?.[idx] || (company.upgrades[cat] ?? 0) !== idx || bal < ups[idx].cost) return
    const up = ups[idx]
    set(s => ({ bal: s.bal - up.cost }))
    updateCompany(id, {
      revenue: company.revenue * (1 + up.revBonus),
      upgrades: { ...company.upgrades, [cat]: (company.upgrades[cat] ?? 0) + 1 }
    })
    gainXP(100)
  }

  const totalRevenue = companies.reduce((s, c) => s + c.revenue, 0)

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Sub tabs */}
      <div className="flex-shrink-0 flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {([
          { id: 'lista',   label: `🏢 Empresas (${companies.length})` },
          { id: 'detalle', label: '📊 Detalle', disabled: !active },
          { id: 'nueva',   label: '＋ Nueva' },
        ] as { id: EmpresaTab; label: string; disabled?: boolean }[]).map(t => (
          <button key={t.id} onClick={() => !t.disabled && setSub(t.id)}
            className="flex-1 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: sub === t.id ? 'var(--text)' : t.disabled ? 'var(--muted2)' : 'var(--muted)',
              borderBottom: sub === t.id ? '2px solid var(--blue)' : '2px solid transparent',
              opacity: t.disabled ? 0.4 : 1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── LISTA ─────────────────────────────────────────── */}
        {sub === 'lista' && (
          <div className="flex flex-col gap-0">
            {/* Total income header */}
            {companies.length > 0 && (
              <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
                <div>
                  <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Ingresos totales/día</div>
                  <div className="text-base font-black" style={{ color: 'var(--green)' }}>
                    +{fmtN(totalRevenue * 86400 / 1.3)}€
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Empresas activas</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--blue)' }}>{companies.length}</div>
                </div>
              </div>
            )}

            {companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
                <div className="text-5xl">🏢</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Sin empresas todavía</div>
                <button onClick={() => setSub('nueva')}
                  className="px-4 py-2 rounded-xl text-xs font-bold border"
                  style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
                  Crear tu primera empresa
                </button>
              </div>
            ) : (
              companies.map(c => {
                const lv = EMPRESA_LEVELS[c.level]
                return (
                  <button key={c.id}
                    onClick={() => { setActive(c.id); setSub('detalle') }}
                    className="flex items-center gap-3 px-4 py-3 border-b text-left transition-colors hover:bg-bg3"
                    style={{ borderColor: 'var(--border)', background: activeCompanyId === c.id ? 'rgba(129,140,248,.05)' : 'transparent' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'rgba(129,140,248,.12)', border: '1px solid rgba(129,140,248,.2)' }}>
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{c.name}</div>
                      <div className="text-[9px]" style={{ color: 'var(--muted)' }}>
                        {lv.name} · {SECTORS.find(s => s.id === c.sector)?.name}
                        {c.ipo && ' · 🔵 Cotizando'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold" style={{ color: 'var(--green)' }}>
                        +{fmtN(c.revenue * 86400 / 1.3)}€/día
                      </div>
                      <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Nv.{c.level}/5</div>
                    </div>
                  </button>
                )
              })
            )}

            {companies.length > 0 && (
              <div className="p-4">
                <button onClick={() => setSub('nueva')}
                  className="w-full py-3 rounded-xl text-xs font-bold border"
                  style={{ background: 'rgba(52,211,153,.08)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.2)' }}>
                  + Fundar nueva empresa
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── DETALLE ───────────────────────────────────────── */}
        {sub === 'detalle' && active && (
          <div className="flex flex-col gap-3 p-4">
            {/* Company selector */}
            {companies.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {companies.map(c => (
                  <button key={c.id} onClick={() => setActive(c.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                    style={{
                      background: activeCompanyId === c.id ? 'rgba(129,140,248,.15)' : 'var(--bg3)',
                      color: activeCompanyId === c.id ? 'var(--blue)' : 'var(--muted)',
                      borderColor: activeCompanyId === c.id ? 'rgba(129,140,248,.3)' : 'var(--border)',
                    }}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Header card */}
            <div className="card p-4" style={{ background: 'linear-gradient(135deg,rgba(129,140,248,.08),rgba(52,211,153,.05))', borderColor: 'rgba(129,140,248,.2)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(129,140,248,.15)', border: '1.5px solid rgba(129,140,248,.3)' }}>
                  {active.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{active.name}</div>
                  <div className="text-xs" style={{ color: 'var(--blue)' }}>{lvData?.name}</div>
                  {active.ipo && <div className="text-[9px]" style={{ color: 'var(--green)' }}>🔵 Cotizando en bolsa</div>}
                </div>
              </div>
              {/* Level bar */}
              <div className="flex gap-1 mb-3">
                {EMPRESA_LEVELS.slice(1).map((l, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full"
                    style={{ background: active.level > i ? 'var(--blue)' : 'var(--bg4)' }} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Ingresos/día', v: '+' + fmtN(active.revenue * 86400 / 1.3) + '€', c: 'var(--green)' },
                  { l: 'Total ganado',  v: fmtN(active.totalEarned) + '€',                  c: 'var(--amber)' },
                ].map(({ l, v, c }) => (
                  <div key={l} className="card p-2.5">
                    <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{l}</div>
                    <div className="text-sm font-bold" style={{ color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade to next level */}
            {nextLv && (
              <div className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>→ {nextLv.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{nextLv.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold" style={{ color: 'var(--amber)' }}>{fmtN(nextLv.cost)}€</div>
                    <div className="text-[9px]" style={{ color: 'var(--green)' }}>+{fmtN((nextLv.revenue - active.revenue) * 86400 / 1.3)}€/día</div>
                  </div>
                </div>
                <button onClick={() => upgradeLevel(active.id, active)} disabled={bal < nextLv.cost}
                  className="w-full py-2.5 rounded-xl text-xs font-bold border disabled:opacity-30"
                  style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
                  Escalar — {fmtN(nextLv.cost)}€
                </button>
              </div>
            )}

            {/* IPO */}
            {active.level >= 3 && !active.ipo && (
              <div className="card p-3 flex flex-col gap-2" style={{ borderColor: 'rgba(251,191,36,.2)', background: 'rgba(251,191,36,.04)' }}>
                <div className="text-xs font-bold" style={{ color: 'var(--amber)' }}>📈 IPO disponible</div>
                <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  Captar {fmtN(active.revenue * 1000)}€ de inversores institucionales.
                </div>
                <button onClick={() => doIPO(active.id, active)}
                  className="w-full py-2 rounded-xl text-xs font-bold border"
                  style={{ background: 'rgba(251,191,36,.12)', color: 'var(--amber)', borderColor: 'rgba(251,191,36,.3)' }}>
                  Lanzar IPO — +{fmtN(active.revenue * 1000)}€
                </button>
              </div>
            )}

            {/* Upgrades */}
            {UPGRADE_CATS.map(cat => {
              const ups = EMPRESA_UPGRADES[cat]
              const done = active.upgrades[cat] ?? 0
              return (
                <div key={cat} className="card overflow-hidden">
                  <div className="px-3 py-2.5 border-b text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    {UPGRADE_LABELS[cat]}
                  </div>
                  {ups.map((up, i) => {
                    const owned = done > i, available = done === i
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b last:border-0"
                        style={{ borderColor: 'var(--border)', opacity: owned || available ? 1 : 0.35 }}>
                        <span>{owned ? '✅' : available ? '🔓' : '🔒'}</span>
                        <div className="flex-1">
                          <div className="text-xs font-medium" style={{ color: owned ? 'var(--green)' : 'var(--text)' }}>{up.name}</div>
                          <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{up.desc} · +{Math.round(up.revBonus * 100)}%</div>
                        </div>
                        {owned ? (
                          <span className="text-[9px] font-bold" style={{ color: 'var(--green)' }}>Activo</span>
                        ) : available ? (
                          <button onClick={() => buyUpgrade(active.id, active, cat, i)} disabled={bal < up.cost}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold border disabled:opacity-30"
                            style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
                            {fmtN(up.cost)}€
                          </button>
                        ) : (
                          <span className="text-[9px]" style={{ color: 'var(--muted2)' }}>{fmtN(up.cost)}€</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* ── NUEVA ─────────────────────────────────────────── */}
        {sub === 'nueva' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>FUNDAR NUEVA EMPRESA</div>
            <div>
              <label className="block text-[9px] font-bold mb-1.5" style={{ color: 'var(--muted)' }}>NOMBRE</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Ej: NovaTech Solutions"
                className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[9px] font-bold mb-1.5" style={{ color: 'var(--muted)' }}>SECTOR</label>
              <div className="grid grid-cols-4 gap-2">
                {SECTORS.map(s => (
                  <button key={s.id} onClick={() => setNewSector(s.id)}
                    className="py-2.5 rounded-xl border flex flex-col items-center gap-1 text-[9px] font-medium transition-all"
                    style={{
                      background: newSector === s.id ? 'rgba(129,140,248,.15)' : 'var(--bg3)',
                      color: newSector === s.id ? 'var(--blue)' : 'var(--muted)',
                      borderColor: newSector === s.id ? 'rgba(129,140,248,.35)' : 'var(--border)',
                    }}>
                    <span className="text-xl">{s.emoji}</span>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="card p-3 flex flex-col gap-1.5" style={{ borderColor: 'rgba(129,140,248,.2)' }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>Coste inicial</span>
                <span className="font-bold" style={{ color: 'var(--amber)' }}>{fmtN(EMPRESA_LEVELS[1].cost)}€</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>Ingresos/día</span>
                <span className="font-bold" style={{ color: 'var(--green)' }}>+{fmtN(EMPRESA_LEVELS[1].revenue * 86400 / 1.3)}€</span>
              </div>
            </div>
            <button onClick={createCompany} disabled={!newName.trim() || bal < EMPRESA_LEVELS[1].cost}
              className="w-full py-3 rounded-xl text-sm font-bold border disabled:opacity-30"
              style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.3)' }}>
              Fundar empresa — {fmtN(EMPRESA_LEVELS[1].cost)}€
            </button>
            {bal < EMPRESA_LEVELS[1].cost && (
              <div className="text-center text-[10px]" style={{ color: 'var(--red)' }}>
                Necesitas {fmtN(EMPRESA_LEVELS[1].cost - bal)}€ más
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
