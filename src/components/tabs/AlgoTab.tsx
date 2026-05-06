'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameStore, fmtN } from '@/lib/store'
import { STOCKS_DATA } from '@/lib/gameData'
import clsx from 'clsx'
import { Plus, Trash2, Play, Pause } from 'lucide-react'

// ─── TYPES ─────────────────────────────────────────────────────
type Condition = 'price_below' | 'price_above' | 'drop_pct' | 'rise_pct'
type Action    = 'buy' | 'sell'

interface BotRule {
  id: string
  name: string
  stockId: number
  condition: Condition
  conditionValue: number   // precio o porcentaje
  action: Action
  qty: number
  active: boolean
  triggered: number        // veces ejecutado
  lastTriggered?: number   // timestamp
  pnl: number
}

interface BotLog {
  id: string
  ts: number
  ruleName: string
  stockName: string
  action: Action
  qty: number
  price: number
  result: string
}

const CONDITION_LABELS: Record<Condition, string> = {
  price_below: 'Precio baja de',
  price_above: 'Precio sube de',
  drop_pct:    'Caída de',
  rise_pct:    'Subida de',
}

const CONDITION_UNITS: Record<Condition, string> = {
  price_below: '€',
  price_above: '€',
  drop_pct:    '%',
  rise_pct:    '%',
}

// ─── COMPONENT ─────────────────────────────────────────────────
export default function AlgoTab() {
  const { stocks, buyStock, sellStock, bal, gainXP } = useGameStore()
  const [rules, setRules] = useState<BotRule[]>([])
  const [logs, setLogs] = useState<BotLog[]>([])
  const [tab, setTab] = useState<'bots' | 'logs' | 'new'>('bots')

  // New rule form state
  const [form, setForm] = useState({
    name: '',
    stockId: STOCKS_DATA[0].id,
    condition: 'drop_pct' as Condition,
    conditionValue: 5,
    action: 'buy' as Action,
    qty: 1,
  })

  const prevPrices = useRef<Record<number, number>>({})

  // ─ Evaluate rules every tick
  useEffect(() => {
    const iv = setInterval(() => {
      const currentPrices: Record<number, number> = {}
      stocks.forEach(s => { currentPrices[s.id] = s.p })

      setRules(prev => prev.map(rule => {
        if (!rule.active) return rule

        const stock = stocks.find(s => s.id === rule.stockId)
        if (!stock) return rule

        const prevPrice = prevPrices.current[rule.stockId] ?? stock.p
        const price = stock.p
        let triggered = false

        switch (rule.condition) {
          case 'price_below': triggered = price < rule.conditionValue; break
          case 'price_above': triggered = price > rule.conditionValue; break
          case 'drop_pct': {
            const drop = ((prevPrice - price) / prevPrice) * 100
            triggered = drop >= rule.conditionValue
            break
          }
          case 'rise_pct': {
            const rise = ((price - prevPrice) / prevPrice) * 100
            triggered = rise >= rule.conditionValue
            break
          }
        }

        // Cooldown: no re-trigger within 10s
        if (triggered && (!rule.lastTriggered || Date.now() - rule.lastTriggered > 10000)) {
          let success = false
          if (rule.action === 'buy') {
            success = buyStock(rule.stockId, rule.qty)
          } else {
            success = sellStock(rule.stockId, rule.qty)
          }

          if (success) {
            gainXP(5)
            const log: BotLog = {
              id: 'log_' + Date.now(),
              ts: Date.now(),
              ruleName: rule.name,
              stockName: stock.n,
              action: rule.action,
              qty: rule.qty,
              price,
              result: rule.action === 'buy'
                ? `Comprado x${rule.qty} a ${fmtN(price)}€`
                : `Vendido x${rule.qty} a ${fmtN(price)}€`,
            }
            setLogs(l => [log, ...l.slice(0, 49)])
            return {
              ...rule,
              triggered: rule.triggered + 1,
              lastTriggered: Date.now(),
              pnl: rule.pnl + (rule.action === 'sell' ? price * rule.qty : -price * rule.qty),
            }
          }
        }
        return rule
      }))

      prevPrices.current = currentPrices
    }, 1500)

    return () => clearInterval(iv)
  }, [stocks, buyStock, sellStock, gainXP])

  function addRule() {
    if (!form.name.trim()) return
    const rule: BotRule = {
      id: 'r' + Date.now(),
      ...form,
      active: true,
      triggered: 0,
      pnl: 0,
    }
    setRules(prev => [...prev, rule])
    setTab('bots')
    setForm({ name: '', stockId: STOCKS_DATA[0].id, condition: 'drop_pct', conditionValue: 5, action: 'buy', qty: 1 })
  }

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const activeCount = rules.filter(r => r.active).length
  const totalTriggers = rules.reduce((s, r) => s + r.triggered, 0)

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Header stats */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-b text-[10px]"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div><span style={{ color: 'var(--muted)' }}>Bots activos: </span>
          <span className="font-bold" style={{ color: activeCount > 0 ? 'var(--green)' : 'var(--muted)' }}>{activeCount}</span>
        </div>
        <div><span style={{ color: 'var(--muted)' }}>Operaciones: </span>
          <span className="font-bold" style={{ color: 'var(--blue)' }}>{totalTriggers}</span>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="live-dot" />
            <span style={{ color: 'var(--green)' }}>Activo</span>
          </div>
        )}
      </div>

      {/* Sub tabs */}
      <div className="flex-shrink-0 flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {[
          { id: 'bots', label: `🤖 Mis bots (${rules.length})` },
          { id: 'logs', label: `📋 Historial (${logs.length})` },
          { id: 'new',  label: '＋ Nuevo bot' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: tab === t.id ? 'var(--text)' : 'var(--muted)',
              borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* BOTS LIST */}
      {tab === 'bots' && (
        <div className="flex-1 overflow-y-auto">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40 p-8">
              <div className="text-5xl">🤖</div>
              <div className="text-center">
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Sin bots configurados</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Crea tu primer bot de trading algorítmico</div>
              </div>
              <button onClick={() => setTab('new')}
                className="px-4 py-2 rounded-xl text-xs font-bold border"
                style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
                Crear bot
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {rules.map(rule => {
                const stock = STOCKS_DATA.find(s => s.id === rule.stockId)
                const currentPrice = stocks.find(s => s.id === rule.stockId)?.p ?? 0
                const condUnit = CONDITION_UNITS[rule.condition]
                return (
                  <div key={rule.id} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start gap-3">
                      {/* Status indicator */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: rule.active ? 'rgba(52,211,153,.12)' : 'var(--bg3)', border: `1px solid ${rule.active ? 'rgba(52,211,153,.3)' : 'var(--border)'}` }}>
                        <span className="text-sm">{rule.active ? '🟢' : '⏸️'}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{rule.name}</span>
                          {rule.triggered > 0 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)' }}>
                              {rule.triggered}x
                            </span>
                          )}
                        </div>

                        {/* Rule description */}
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                          Si <b style={{ color: 'var(--text)' }}>{stock?.n}</b> → {CONDITION_LABELS[rule.condition]}{' '}
                          <b style={{ color: 'var(--amber)' }}>{rule.conditionValue}{condUnit}</b>{' '}
                          → <b style={{ color: rule.action === 'buy' ? 'var(--green)' : 'var(--red)' }}>
                            {rule.action === 'buy' ? 'COMPRAR' : 'VENDER'} x{rule.qty}
                          </b>
                        </div>

                        {/* Current price */}
                        <div className="text-[9px] mt-0.5" style={{ color: 'var(--muted2)' }}>
                          Precio actual: {fmtN(currentPrice)}€
                          {rule.lastTriggered && ` · Última ejecución: hace ${Math.round((Date.now() - rule.lastTriggered) / 1000)}s`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => toggleRule(rule.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:opacity-80"
                          style={{
                            background: rule.active ? 'rgba(251,191,36,.1)' : 'rgba(52,211,153,.1)',
                            borderColor: rule.active ? 'rgba(251,191,36,.25)' : 'rgba(52,211,153,.25)',
                          }}
                          title={rule.active ? 'Pausar' : 'Activar'}>
                          {rule.active
                            ? <Pause size={13} style={{ color: 'var(--amber)' }} />
                            : <Play size={13} style={{ color: 'var(--green)' }} />}
                        </button>
                        <button onClick={() => deleteRule(rule.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:opacity-80"
                          style={{ background: 'rgba(248,113,113,.08)', borderColor: 'rgba(248,113,113,.2)' }}
                          title="Eliminar">
                          <Trash2 size={13} style={{ color: 'var(--red)' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* LOGS */}
      {tab === 'logs' && (
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
              <div className="text-4xl">📋</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Sin operaciones todavía</div>
            </div>
          ) : (
            <div className="flex flex-col">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-base flex-shrink-0">{log.action === 'buy' ? '🟢' : '🔴'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {log.action === 'buy' ? 'COMPRA' : 'VENTA'} — {log.stockName} x{log.qty}
                    </div>
                    <div className="text-[9px]" style={{ color: 'var(--muted)' }}>
                      {log.ruleName} · {fmtN(log.price)}€/acc · hace {Math.round((Date.now() - log.ts) / 1000)}s
                    </div>
                  </div>
                  <div className="text-xs font-bold flex-shrink-0"
                    style={{ color: log.action === 'buy' ? 'var(--red)' : 'var(--green)' }}>
                    {log.action === 'buy' ? '-' : '+'}{fmtN(log.price * log.qty)}€
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW BOT FORM */}
      {tab === 'new' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>CONFIGURAR NUEVO BOT</div>

          {/* Name */}
          <div>
            <label className="text-[9px] font-bold block mb-1.5" style={{ color: 'var(--muted)' }}>NOMBRE DEL BOT</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Comprador de caídas NVDA"
              className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
              style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>

          {/* Stock */}
          <div>
            <label className="text-[9px] font-bold block mb-1.5" style={{ color: 'var(--muted)' }}>ACTIVO</label>
            <select value={form.stockId} onChange={e => setForm(f => ({ ...f, stockId: +e.target.value }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
              style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {STOCKS_DATA.map(s => (
                <option key={s.id} value={s.id}>{s.n} ({s.s})</option>
              ))}
            </select>
            <div className="text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
              Precio actual: <span style={{ color: 'var(--amber)' }}>{fmtN(stocks.find(s => s.id === form.stockId)?.p ?? 0)}€</span>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="text-[9px] font-bold block mb-1.5" style={{ color: 'var(--muted)' }}>CONDICIÓN</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {(Object.entries(CONDITION_LABELS) as [Condition, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setForm(f => ({ ...f, condition: k }))}
                  className="py-2 rounded-xl border text-[10px] font-medium transition-all"
                  style={{
                    background: form.condition === k ? 'rgba(129,140,248,.15)' : 'var(--bg3)',
                    color: form.condition === k ? 'var(--blue)' : 'var(--muted)',
                    borderColor: form.condition === k ? 'rgba(129,140,248,.35)' : 'var(--border)',
                  }}>
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={form.conditionValue}
                onChange={e => setForm(f => ({ ...f, conditionValue: +e.target.value }))}
                className="flex-1 rounded-xl px-3 py-2 text-sm text-center border outline-none font-bold"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--amber)' }}>
                {CONDITION_UNITS[form.condition]}
              </span>
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="text-[9px] font-bold block mb-1.5" style={{ color: 'var(--muted)' }}>ACCIÓN</label>
            <div className="grid grid-cols-2 gap-2">
              {(['buy', 'sell'] as Action[]).map(a => (
                <button key={a} onClick={() => setForm(f => ({ ...f, action: a }))}
                  className="py-2.5 rounded-xl border text-xs font-bold transition-all"
                  style={{
                    background: form.action === a
                      ? a === 'buy' ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)'
                      : 'var(--bg3)',
                    color: form.action === a
                      ? a === 'buy' ? 'var(--green)' : 'var(--red)'
                      : 'var(--muted)',
                    borderColor: form.action === a
                      ? a === 'buy' ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'
                      : 'var(--border)',
                  }}>
                  {a === 'buy' ? '🟢 COMPRAR' : '🔴 VENDER'}
                </button>
              ))}
            </div>
          </div>

          {/* Qty */}
          <div>
            <label className="text-[9px] font-bold block mb-1.5" style={{ color: 'var(--muted)' }}>CANTIDAD</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setForm(f => ({ ...f, qty: Math.max(1, f.qty - 1) }))}
                className="w-10 h-10 rounded-xl border font-bold text-lg flex items-center justify-center"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }}>−</button>
              <input type="number" min={1} value={form.qty}
                onChange={e => setForm(f => ({ ...f, qty: Math.max(1, +e.target.value) }))}
                className="flex-1 rounded-xl px-3 py-2 text-center text-sm font-bold border outline-none"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              <button onClick={() => setForm(f => ({ ...f, qty: f.qty + 1 }))}
                className="w-10 h-10 rounded-xl border font-bold text-lg flex items-center justify-center"
                style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }}>+</button>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-3 border" style={{ background: 'var(--bg3)', borderColor: 'rgba(129,140,248,.2)' }}>
            <div className="text-[9px] font-bold mb-1" style={{ color: 'var(--muted)' }}>PREVISUALIZACIÓN</div>
            <div className="text-xs" style={{ color: 'var(--text)' }}>
              Si <b>{STOCKS_DATA.find(s => s.id === form.stockId)?.n}</b> →{' '}
              {CONDITION_LABELS[form.condition]}{' '}
              <b style={{ color: 'var(--amber)' }}>{form.conditionValue}{CONDITION_UNITS[form.condition]}</b>{' '}
              → automáticamente{' '}
              <b style={{ color: form.action === 'buy' ? 'var(--green)' : 'var(--red)' }}>
                {form.action === 'buy' ? 'COMPRAR' : 'VENDER'} x{form.qty}
              </b>
            </div>
          </div>

          <button onClick={addRule} disabled={!form.name.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold border disabled:opacity-30 flex items-center justify-center gap-2"
            style={{ background: 'rgba(129,140,248,.12)', color: 'var(--blue)', borderColor: 'rgba(129,140,248,.25)' }}>
            <Plus size={16} /> Crear bot
          </button>
        </div>
      )}
    </div>
  )
}
