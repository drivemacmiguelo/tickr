'use client'
import { useState } from 'react'
import { useGameStore } from '@/lib/store'
import { useInboxStore } from '@/lib/inboxStore'
import { useNewsStore } from '@/lib/newsStore'
import { INBOX_MESSAGES } from '@/lib/inboxData'
import { applyConsequence } from '@/lib/useInbox'
import { fmtN } from '@/lib/store'
import clsx from 'clsx'

const SENDER_TYPE_LABELS: Record<string, string> = {
  rival: 'Rival', hacienda: 'Hacienda', banco: 'Banco',
  periodista: 'Prensa', hacker: 'Hacker', gobierno: 'Gobierno', cliente: 'Cliente'
}
const SENDER_TYPE_COLORS: Record<string, string> = {
  rival: '#818cf8', hacienda: '#f87171', banco: '#34d399',
  periodista: '#60a5fa', hacker: '#fbbf24', gobierno: '#e2b96f', cliente: '#34d399'
}

export default function InboxTab() {
  const store = useGameStore()
  const inbox = useInboxStore()
  const addNews = useNewsStore(s => s.addNews)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deciding, setDeciding] = useState(false)

  const messages = inbox.messages
  const selected = selectedId ? messages.find(m => m.id === selectedId) : null
  const selectedTemplate = selected ? INBOX_MESSAGES.find(t => t.id === selected.templateId) : null

  const now = Date.now()
  const pending = messages.filter(m => !m.answered && now < m.expiresAt)
  const answered = messages.filter(m => m.answered)
  const expired = messages.filter(m => !m.answered && now >= m.expiresAt)

  function openMessage(id: string) {
    setSelectedId(id)
    inbox.markRead(id)
  }

  async function decide(msgId: string, choice: 'accept' | 'reject') {
    if (!selectedTemplate || deciding) return
    setDeciding(true)

    const consequence = choice === 'accept' ? selectedTemplate.accept : selectedTemplate.reject
    const outcome = choice === 'accept'
      ? `✅ Aceptaste: "${selectedTemplate.accept.label}"`
      : `❌ Rechazaste: "${selectedTemplate.reject.label}"`

    inbox.answer(msgId, choice, outcome)
    applyConsequence(consequence, useGameStore.getState(), addNews)

    setTimeout(() => setDeciding(false), 500)
  }

  const senderTypeColor = selectedTemplate ? SENDER_TYPE_COLORS[selectedTemplate.senderType] : '#818cf8'

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* Left: message list */}
      <div className="w-[160px] flex-shrink-0 border-r flex flex-col overflow-hidden"
        style={{ borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-3 py-2.5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>Bandeja</span>
          {pending.length > 0 && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#f87171', color: '#fff' }}>
              {pending.length}
            </span>
          )}
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div className="flex-shrink-0 px-2 pt-2">
            <div className="text-[8px] font-bold px-1 mb-1" style={{ color: 'var(--muted2)' }}>
              PENDIENTES
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {[...pending, ...answered.slice(0, 10), ...expired.slice(0, 5)].map(msg => {
            const tmpl = INBOX_MESSAGES.find(t => t.id === msg.templateId)
            if (!tmpl) return null
            const isExpired = !msg.answered && now >= msg.expiresAt
            const isPending = !msg.answered && !isExpired
            const typeColor = SENDER_TYPE_COLORS[tmpl.senderType]
            const timeLeft = Math.max(0, Math.ceil((msg.expiresAt - now) / 1000))

            return (
              <button key={msg.id} onClick={() => openMessage(msg.id)}
                className="w-full px-3 py-3 text-left border-b transition-all"
                style={{
                  borderColor: 'var(--border)',
                  background: selectedId === msg.id
                    ? 'var(--bg4)'
                    : isPending && !msg.read
                    ? typeColor + '08'
                    : 'transparent',
                }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{tmpl.senderEmoji}</span>
                  {!msg.read && isPending && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: typeColor }} />
                  )}
                  {msg.answered === 'accept' && <span className="text-[9px]">✅</span>}
                  {msg.answered === 'reject' && <span className="text-[9px]">❌</span>}
                  {isExpired && <span className="text-[9px] opacity-40">⏰</span>}
                </div>
                <div className="text-[10px] font-bold leading-tight" style={{ color: isExpired ? 'var(--muted)' : 'var(--text)' }}>
                  {tmpl.senderName}
                </div>
                <div className="text-[9px] leading-tight mt-0.5"
                  style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tmpl.subject}
                </div>
                {isPending && (
                  <div className="text-[8px] mt-1 font-medium" style={{ color: timeLeft < 30 ? '#f87171' : 'var(--muted2)' }}>
                    ⏱ {timeLeft < 60 ? timeLeft + 's' : Math.ceil(timeLeft / 60) + 'min'}
                  </div>
                )}
              </button>
            )
          })}

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-12 opacity-40">
              <div className="text-3xl">📭</div>
              <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Sin mensajes</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: message detail */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!selected || !selectedTemplate ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-30">
            <div className="text-5xl">📬</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {messages.length > 0 ? 'Selecciona un mensaje' : 'Tu bandeja está vacía'}
            </div>
            <div className="text-[9px] text-center px-4" style={{ color: 'var(--muted2)' }}>
              Recibirás mensajes de rivales, bancos, Hacienda y otros personajes mientras juegas.
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Sender header */}
            <div className="flex-shrink-0 px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)', background: senderTypeColor + '06' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: senderTypeColor + '18', border: `1.5px solid ${senderTypeColor}33` }}>
                  {selectedTemplate.senderEmoji}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    {selectedTemplate.senderName}
                  </div>
                  <div className="text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 font-medium"
                    style={{ background: senderTypeColor + '18', color: senderTypeColor }}>
                    {SENDER_TYPE_LABELS[selectedTemplate.senderType]}
                  </div>
                </div>
                {/* Countdown if pending */}
                {!selected.answered && now < selected.expiresAt && (
                  <div className="text-xs font-bold flex-shrink-0"
                    style={{ color: now > selected.expiresAt - 30000 ? '#f87171' : 'var(--amber)' }}>
                    ⏱ {Math.max(0, Math.ceil((selected.expiresAt - now) / 1000))}s
                  </div>
                )}
              </div>
              <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {selectedTemplate.subject}
              </div>
            </div>

            {/* Body */}
            <div className="flex-shrink-0 px-4 py-4">
              <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                {selectedTemplate.body}
              </div>
            </div>

            {/* Consequences preview */}
            {!selected.answered && now < selected.expiresAt && (
              <div className="flex-shrink-0 px-4 pb-2 flex flex-col gap-2">
                <div className="text-[9px] font-bold tracking-widest" style={{ color: 'var(--muted2)' }}>
                  CONSECUENCIAS
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Accept preview */}
                  <div className="card p-3 flex flex-col gap-1.5"
                    style={{ borderColor: 'rgba(52,211,153,.2)', background: 'rgba(52,211,153,.03)' }}>
                    <div className="text-[9px] font-bold" style={{ color: 'var(--green)' }}>SI ACEPTAS</div>
                    {selectedTemplate.accept.balChange && (
                      <div className="text-[10px]" style={{ color: selectedTemplate.accept.balChange > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {selectedTemplate.accept.balChange > 0 ? '+' : ''}{fmtN(selectedTemplate.accept.balChange)}€
                      </div>
                    )}
                    {selectedTemplate.accept.balPct && (
                      <div className="text-[10px]" style={{ color: selectedTemplate.accept.balPct > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {selectedTemplate.accept.balPct > 0 ? '+' : ''}{(selectedTemplate.accept.balPct * 100).toFixed(0)}% balance
                      </div>
                    )}
                    {selectedTemplate.accept.xp && (
                      <div className="text-[10px]" style={{ color: 'var(--blue)' }}>+{selectedTemplate.accept.xp} XP</div>
                    )}
                    {selectedTemplate.accept.stockShock && (
                      <div className="text-[10px]" style={{ color: 'var(--amber)' }}>
                        Mercado {selectedTemplate.accept.stockShock.mult > 1 ? '📈' : '📉'} {selectedTemplate.accept.stockShock.sector}
                      </div>
                    )}
                    {selectedTemplate.accept.special && (
                      <div className="text-[10px]" style={{ color: 'var(--amber)' }}>
                        ⚡ Efecto especial
                      </div>
                    )}
                  </div>

                  {/* Reject preview */}
                  <div className="card p-3 flex flex-col gap-1.5"
                    style={{ borderColor: 'rgba(248,113,113,.2)', background: 'rgba(248,113,113,.03)' }}>
                    <div className="text-[9px] font-bold" style={{ color: 'var(--red)' }}>SI RECHAZAS</div>
                    {selectedTemplate.reject.balChange && (
                      <div className="text-[10px]" style={{ color: selectedTemplate.reject.balChange > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {selectedTemplate.reject.balChange > 0 ? '+' : ''}{fmtN(selectedTemplate.reject.balChange)}€
                      </div>
                    )}
                    {selectedTemplate.reject.balPct && (
                      <div className="text-[10px]" style={{ color: selectedTemplate.reject.balPct > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {selectedTemplate.reject.balPct > 0 ? '+' : ''}{(selectedTemplate.reject.balPct * 100).toFixed(0)}% balance
                      </div>
                    )}
                    {selectedTemplate.reject.xp && (
                      <div className="text-[10px]" style={{ color: 'var(--blue)' }}>+{selectedTemplate.reject.xp} XP</div>
                    )}
                    {selectedTemplate.reject.stockShock && (
                      <div className="text-[10px]" style={{ color: 'var(--amber)' }}>
                        Mercado {selectedTemplate.reject.stockShock.mult > 1 ? '📈' : '📉'}
                      </div>
                    )}
                    {!selectedTemplate.reject.balChange && !selectedTemplate.reject.balPct &&
                     !selectedTemplate.reject.xp && !selectedTemplate.reject.stockShock && (
                      <div className="text-[10px]" style={{ color: 'var(--muted2)' }}>Sin efecto inmediato</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Decision buttons or outcome */}
            <div className="flex-shrink-0 px-4 pb-4 mt-auto">
              {selected.answered ? (
                <div className="card p-3 text-center">
                  <div className="text-xs font-bold mb-1"
                    style={{ color: selected.answered === 'accept' ? 'var(--green)' : 'var(--red)' }}>
                    {selected.outcome}
                  </div>
                  {selected.outcome && (
                    <div className="text-[9px]" style={{ color: 'var(--muted)' }}>Decisión tomada</div>
                  )}
                </div>
              ) : now >= selected.expiresAt ? (
                <div className="card p-3 text-center" style={{ borderColor: 'rgba(255,255,255,.05)' }}>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>⏰ Mensaje expirado — ya no puedes responder</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button onClick={() => decide(selected.id, 'accept')} disabled={deciding}
                    className="w-full py-3 rounded-xl text-sm font-bold border transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)', borderColor: 'rgba(52,211,153,.3)' }}>
                    ✅ {selectedTemplate.accept.label}
                  </button>
                  <button onClick={() => decide(selected.id, 'reject')} disabled={deciding}
                    className="w-full py-3 rounded-xl text-sm font-bold border transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{ background: 'rgba(248,113,113,.1)', color: 'var(--red)', borderColor: 'rgba(248,113,113,.25)' }}>
                    ❌ {selectedTemplate.reject.label}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
