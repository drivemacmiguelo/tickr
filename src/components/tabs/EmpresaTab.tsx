'use client'
import { useState } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { EMPRESA_LEVELS, EMPRESA_UPGRADES } from '@/lib/gameData'
import { useNewsStore } from '@/lib/newsStore'
import clsx from 'clsx'

type EmpresaTab = 'overview' | 'upgrades' | 'ipo'
const UPGRADE_CATS = ['marketing', 'tech', 'ops', 'expansion'] as const
const UPGRADE_LABELS = { marketing: '📣 Marketing', tech: '💻 Tecnología', ops: '⚙️ Operaciones', expansion: '🌍 Expansión' }

export default function EmpresaTab() {
  const { bal, lv, empresa, gainXP } = useGameStore()
  const set = useGameStore.setState
  const addNews = useNewsStore(s => s.addNews)
  const [sub, setSub] = useState<EmpresaTab>('overview')

  const lvData = EMPRESA_LEVELS[empresa.level]
  const nextLv = EMPRESA_LEVELS[empresa.level + 1]
  const dailyRevenue = empresa.revenue * 86400 / 1.3

  function found() {
    const cost = EMPRESA_LEVELS[1].cost
    if (bal < cost) return
    set(s => ({
      bal: s.bal - cost,
      empresa: { ...s.empresa, founded: true, level: 1, revenue: EMPRESA_LEVELS[1].revenue }
    }))
    gainXP(200)
    addNews(`🏢 ${empresa.name} ha sido fundada. Primer ronda de financiación cerrada.`)
  }

  function upgrade() {
    if (!nextLv || bal < nextLv.cost) return
    set(s => ({
      bal: s.bal - nextLv.cost,
      empresa: { ...s.empresa, level: s.empresa.level + 1, revenue: nextLv.revenue }
    }))
    gainXP(500)
    addNews(`🚀 ${empresa.name} escala a ${nextLv.name}. El mercado celebra la noticia.`)
    if (empresa.level + 1 === 4) {
      addNews(`🦄 ${empresa.name} alcanza valoración de 1.000M€. ¡Unicornio confirmado!`)
    }
  }

  function doIPO() {
    if (empresa.level < 3 || empresa.ipo) return
    const ipoPrice = empresa.revenue * 100
    set(s => ({
      bal: s.bal + ipoPrice * 10, // raises money from IPO
      empresa: { ...s.empresa, ipo: true, ipoPrice }
    }))
    gainXP(1000)
    addNews(`📈 ${empresa.name} debuta en bolsa a ${fmtN(ipoPrice)}€/acción. Precio de salida histórico.`)
  }

  function buyUpgrade(cat: string, idx: number) {
    const ups = EMPRESA_UPGRADES[cat]
    if (!ups || !ups[idx]) return
    const up = ups[idx]
    if (empresa.upgrades[cat] !== idx) return // must be sequential
    if (bal < up.cost) return
    const newRevenue = empresa.revenue * (1 + up.revBonus)
    set(s => ({
      bal: s.bal - up.cost,
      empresa: {
        ...s.empresa,
        revenue: newRevenue,
        upgrades: { ...s.empresa.upgrades, [cat]: (s.empresa.upgrades[cat] ?? 0) + 1 }
      }
    }))
    gainXP(100)
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Sub tabs */}
      <div className="flex-shrink-0 flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {([
          { id: 'overview',  label: '🏢 Empresa' },
          { id: 'upgrades',  label: '⬆️ Upgrades' },
          { id: 'ipo',       label: '📈 IPO'      },
        ] as {id:EmpresaTab;label:string}[]).map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className="flex-1 py-2.5 text-xs font-medium"
            style={{ color: sub === t.id ? 'var(--text)' : 'var(--muted)', borderBottom: sub === t.id ? '2px solid var(--blue)' : '2px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* ─── OVERVIEW ─────────────────────────────── */}
        {sub === 'overview' && (<>
          {/* Company card */}
          <div className="card p-4" style={{ background: 'linear-gradient(135deg,rgba(129,140,248,.08),rgba(52,211,153,.05))', borderColor: 'rgba(129,140,248,.2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(129,140,248,.15)', border: '1.5px solid rgba(129,140,248,.3)' }}>
                🏢
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{empresa.name}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--blue)' }}>{lvData.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{lvData.desc}</div>
              </div>
              {empresa.ipo && (
                <div className="text-[9px] px-2 py-1 rounded-full font-bold"
                  style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)', border: '0.5px solid rgba(52,211,153,.3)' }}>
                  🔵 En bolsa
                </div>
              )}
            </div>

            {/* Level progress bar */}
            <div className="flex gap-1 mb-3">
              {EMPRESA_LEVELS.slice(1).map((l, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: empresa.level > i ? 'var(--blue)' : 'var(--bg4)' }} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ingresos/día', value: empresa.founded ? '+' + fmtN(dailyRevenue) + '€' : '—', color: 'var(--green)' },
                { label: 'Total ganado', value: fmtN(empresa.totalEarned) + '€', color: 'var(--amber)' },
                { label: 'Nivel',        value: `${empresa.level} / 5`,          color: 'var(--blue)'  },
                { label: 'Estado',       value: empresa.ipo ? 'Cotizando' : empresa.founded ? 'Activa' : 'Sin fundar', color: empresa.founded ? 'var(--green)' : 'var(--muted)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-2.5">
                  <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{label}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!empresa.founded && (
            <button onClick={found} disabled={bal < EMPRESA_LEVELS[1].cost}
              className="w-full py-3 rounded-xl text-sm font-bold border disabled:opacity-30"
              style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.3)' }}>
              Fundar empresa — {fmtN(EMPRESA_LEVELS[1].cost)}€
            </button>
          )}

          {empresa.founded && nextLv && (
            <div className="card p-4 flex flex-col gap-3">
              <div className="text-[9px] font-bold tracking-widest" style={{ color: 'var(--muted)' }}>SIGUIENTE NIVEL</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{nextLv.name}</div>
                  <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{nextLv.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: 'var(--amber)' }}>{fmtN(nextLv.cost)}€</div>
                  <div className="text-[9px]" style={{ color: 'var(--green)' }}>+{fmtN((nextLv.revenue - empresa.revenue) * 86400 / 1.3)}€/día</div>
                </div>
              </div>
              <button onClick={upgrade} disabled={bal < nextLv.cost}
                className="w-full py-2.5 rounded-xl text-xs font-bold border disabled:opacity-30"
                style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
                Escalar a {nextLv.name} — {fmtN(nextLv.cost)}€
              </button>
            </div>
          )}

          {empresa.level >= 3 && !empresa.ipo && (
            <div className="card p-4 flex flex-col gap-2" style={{ borderColor: 'rgba(251,191,36,.2)', background: 'rgba(251,191,36,.04)' }}>
              <div className="text-xs font-bold" style={{ color: 'var(--amber)' }}>📈 IPO disponible</div>
              <div className="text-[10px]" style={{ color: 'var(--muted)' }}>Sal a bolsa y capta {fmtN(empresa.revenue * 1000)}€ de inversores institucionales.</div>
              <button onClick={doIPO}
                className="w-full py-2.5 rounded-xl text-xs font-bold border"
                style={{ background: 'rgba(251,191,36,.12)', color: 'var(--amber)', borderColor: 'rgba(251,191,36,.3)' }}>
                Lanzar IPO — Captar {fmtN(empresa.revenue * 1000)}€
              </button>
            </div>
          )}
        </>)}

        {/* ─── UPGRADES ─────────────────────────────── */}
        {sub === 'upgrades' && (
          empresa.founded ? (
            UPGRADE_CATS.map(cat => {
              const ups = EMPRESA_UPGRADES[cat]
              const done = empresa.upgrades[cat] ?? 0
              return (
                <div key={cat} className="card overflow-hidden">
                  <div className="px-3 py-2.5 border-b font-medium text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    {UPGRADE_LABELS[cat]}
                  </div>
                  {ups.map((up, i) => {
                    const owned = done > i
                    const available = done === i
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-3 border-b last:border-0"
                        style={{ borderColor: 'var(--border)', opacity: owned || available ? 1 : 0.35 }}>
                        <span className="text-xl flex-shrink-0">{owned ? '✅' : available ? '🔓' : '🔒'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium" style={{ color: owned ? 'var(--green)' : 'var(--text)' }}>{up.name}</div>
                          <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{up.desc} · +{Math.round(up.revBonus * 100)}% ingresos</div>
                        </div>
                        {owned ? (
                          <span className="text-[9px] font-bold" style={{ color: 'var(--green)' }}>Activo</span>
                        ) : available ? (
                          <button onClick={() => buyUpgrade(cat, i)} disabled={bal < up.cost}
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
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2 opacity-40">
              <div className="text-4xl">🔒</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Funda tu empresa primero</div>
            </div>
          )
        )}

        {/* ─── IPO ──────────────────────────────────── */}
        {sub === 'ipo' && (
          <div className="flex flex-col gap-4">
            <div className="card p-4 flex flex-col gap-2">
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>¿Qué es el IPO?</div>
              <div className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                Una OPV (Oferta Pública de Venta) te permite captar capital de inversores institucionales
                vendiendo acciones de tu empresa en el mercado. El dinero recaudado va directo a tu balance.
              </div>
            </div>
            <div className="card p-4 flex flex-col gap-3">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>Requisito mínimo</span>
                <span className="font-bold" style={{ color: empresa.level >= 3 ? 'var(--green)' : 'var(--red)' }}>
                  {empresa.level >= 3 ? '✅ Nivel 3+' : `❌ Nivel 3 (tienes ${empresa.level})`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>Precio de salida</span>
                <span className="font-bold" style={{ color: 'var(--amber)' }}>{empresa.founded ? fmtN(empresa.revenue * 100) + '€/acc' : '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>Capital a captar</span>
                <span className="font-bold" style={{ color: 'var(--green)' }}>{empresa.founded ? '+' + fmtN(empresa.revenue * 1000) + '€' : '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>Estado</span>
                <span className="font-bold" style={{ color: empresa.ipo ? 'var(--green)' : 'var(--muted)' }}>
                  {empresa.ipo ? '🔵 Cotizando en bolsa' : 'No cotiza'}
                </span>
              </div>
            </div>
            {empresa.level >= 3 && !empresa.ipo && (
              <button onClick={doIPO}
                className="w-full py-3 rounded-xl text-sm font-bold border"
                style={{ background: 'linear-gradient(135deg,rgba(251,191,36,.15),rgba(129,140,248,.12))', color: 'var(--amber)', borderColor: 'rgba(251,191,36,.3)' }}>
                🚀 Lanzar IPO — Captar {empresa.founded ? fmtN(empresa.revenue * 1000) : '0'}€
              </button>
            )}
            {empresa.ipo && (
              <div className="card p-4 text-center" style={{ borderColor: 'rgba(52,211,153,.2)' }}>
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-sm font-bold" style={{ color: 'var(--green)' }}>¡{empresa.name} ya cotiza!</div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>Precio de salida: {fmtN(empresa.ipoPrice)}€/acción</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
