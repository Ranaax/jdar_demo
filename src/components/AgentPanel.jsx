import { useEffect, useRef, useState } from 'react'
import { Icon, bidi } from './ui.jsx'

export default function AgentPanel({ open, onClose, chat, busy, mode, lang, t, ask, view }) {
  const [q, setQ] = useState('')
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [chat])
  const submit = () => { if (q.trim() && !busy) { ask(q); setQ('') } }

  return (
    <aside className={`agent${open ? ' open' : ''}`} aria-label={t.agent}>
      <div className="agent-head">
        <div className="agent-id">
          <span className="agent-mark"><img src="/brand/jdar-mark-cream.svg" alt="" width="20" height="16" /></span>
          <div>
            <div className="ui-strong">{t.agent}</div>
            <div className="ui-xs">{mode ? (mode === 'llm' ? t.llm : t.local) : t.agentSub}</div>
          </div>
        </div>
        <button className="icon-btn agent-close" onClick={onClose} aria-label={t.close}><Icon name="x" /></button>
      </div>

      <div className="agent-body dotgrid" role="log" aria-live="polite">
        {!chat.length && (
          <div className="caps">
            <div className="ui-xs">{t.caps}</div>
            {['collections', 'contracts', 'maintenance', 'leasing'].map((k) => (
              <button key={k} className="cap" disabled={busy} onClick={() => ask(t.prompts[k][0])}>
                <span className="cap-ic"><Icon name={k} size={16} /></span>
                <span><span className="cap-t">{t.nav[k]}</span><span className="cap-d">{t.prompts[k][0]}</span></span>
              </button>
            ))}
          </div>
        )}
        {chat.map((m) => m.role === 'user'
          ? <div key={m.id} className="msg me ui">{m.text}</div>
          : (
            <div key={m.id} className="msg bot">
              {m.steps.length > 0 && (
                <div className="steps">
                  {m.steps.map((s) => (
                    <div key={s.key} className="step ui-xs">
                      <span className={`ui-dot ${s.status === 'run' ? 'run' : s.status === 'error' ? 'wait' : 'done'}`} />
                      <span>{t.tools[s.name] || s.name}</span>
                      {stepArg(s.input) && <span className="n arg">{stepArg(s.input)}</span>}
                    </div>
                  ))}
                </div>
              )}
              {m.text ? <div className="ui bot-text">{bidi(m.text)}</div> : busy && <div className="ui-xs thinking"><span className="ui-dot run" />{t.thinking}</div>}
            </div>
          ))}
        <div ref={end} />
      </div>

      <div className="agent-foot">
        <div className="chips">
          {t.prompts[view].map((p) => <button key={p} className="ui-chip" disabled={busy} onClick={() => ask(p)}>{p}</button>)}
        </div>
        <div className="ask recess">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ask} disabled={busy} dir="auto" onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit() }} />
          <button type="button" className="btn btn-deep btn-sm" disabled={busy || !q.trim()} aria-label={t.send} onClick={submit}><Icon name="send" size={16} /></button>
        </div>
      </div>
    </aside>
  )
}

const stepArg = (input = {}) => input.invoice_id || input.contract_id || input.ticket_id || input.lead_id || input.status || ''
