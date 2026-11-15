import { useEffect, useRef, useState, useCallback } from 'react'
import { seed } from './data.js'
import { T } from './i18n.js'
import { runAgent } from './agent/runAgent.js'
import { resolveApproval } from './agent/tools.js'
import { Icon, bidi } from './components/ui.jsx'
import AgentPanel from './components/AgentPanel.jsx'
import Overview from './views/Overview.jsx'
import Contracts from './views/Contracts.jsx'
import Collections from './views/Collections.jsx'
import Maintenance from './views/Maintenance.jsx'
import Leasing from './views/Leasing.jsx'

const KEY = 'jdar-pm-demo-v2'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed() } catch { return seed() } }
const VIEWS = { overview: Overview, contracts: Contracts, collections: Collections, maintenance: Maintenance, leasing: Leasing }

export default function App() {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem(KEY + ':lang') || 'ar' } catch { return 'ar' } })
  const [view, setView] = useState('overview')
  const [state, _setState] = useState(load)
  const ref = useRef(state)
  const setState = useCallback((s) => { ref.current = s; _setState(s) }, [])
  const [chat, setChat] = useState([])
  const [history, setHistory] = useState([])
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState(null)
  const [model, setModel] = useState(null)
  const [panel, setPanel] = useState(false)
  const t = T[lang]

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {} }, [state])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = `${t.brand} · ${t.product}`
    try { localStorage.setItem(KEY + ':lang', lang) } catch {}
  }, [lang])

  const ask = async (prompt) => {
    if (busy || !prompt.trim()) return
    setPanel(true); setBusy(true)
    const id = Date.now()
    setChat((c) => [...c, { id: id - 1, role: 'user', text: prompt }, { id, role: 'agent', steps: [], text: '' }])
    const patch = (fn) => setChat((c) => c.map((m) => (m.id === id ? fn(m) : m)))
    const onStep = (step) => {
      const key = Math.random()
      patch((m) => ({ ...m, steps: [...m.steps, { ...step, key }] }))
      return { done: (status) => patch((m) => ({ ...m, steps: m.steps.map((s) => (s.key === key ? { ...s, status } : s)) })) }
    }
    try {
      const r = await runAgent({ prompt, lang, history, getState: () => ref.current, setState, onStep, onText: (text) => patch((m) => ({ ...m, text })) })
      setHistory(r.messages); setMode(r.mode); setModel(r.model || null)
      patch((m) => ({ ...m, text: r.text, mode: r.mode }))
    } finally { setBusy(false) }
  }

  const [toast, setToast] = useState(null)
  const [armed, setArmed] = useState(false)
  // Direct actions (buttons) confirm with a brief message; agent runs report in the panel instead.
  const act = (next) => {
    const changed = next !== ref.current && next.activity[0]?.id !== ref.current.activity[0]?.id
    setState(next)
    if (changed) setToast({ id: Date.now(), text: next.activity[0].text })
  }
  useEffect(() => { if (!toast) return; const x = setTimeout(() => setToast(null), 4000); return () => clearTimeout(x) }, [toast])
  useEffect(() => { if (!armed) return; const x = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(x) }, [armed])
  useEffect(() => { const k = (e) => e.key === 'Escape' && setPanel(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  const decide = (id, ok) => act(resolveApproval(ref.current, id, ok))
  const reset = () => { if (!armed) return setArmed(true); setArmed(false); setState(seed()); setChat([]); setHistory([]); setToast({ id: Date.now(), text: { ar: t.resetDone, en: t.resetDone } }) }
  const badge = {
    overview: state.approvals.length,
    collections: state.invoices.filter((i) => i.status === 'overdue').length,
    maintenance: state.tickets.filter((x) => x.status === 'new').length,
    leasing: state.leads.filter((x) => x.status === 'new').length,
  }
  const View = VIEWS[view]
  const ctx = { state, setState: act, lang, t, ask, decide, busy, go: setView }

  return (
    <div className="shell">
      <header className="top">
        <div className="logo">
          <img src="/brand/jdar-mark.svg" alt="" width="34" height="26" />
          <span className="word">{lang === 'ar' ? 'جدار' : 'jdar'}</span>
          <span className="logo-sub">{t.product}</span>
        </div>
        <nav className="nav">
          {Object.keys(VIEWS).map((k) => (
            <button key={k} className={`navi${view === k ? ' on' : ''}`} aria-current={view === k ? 'page' : undefined} onClick={() => setView(k)}>
              <span className="lbl">{t.nav[k]}</span>
              {badge[k] ? <span className="bdg n">{badge[k]}</span> : null}
            </button>
          ))}
        </nav>
        <div className="top-end">
          <button className="navi lang" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label={t.lang}>{lang === 'ar' ? 'EN' : 'ع'}</button>
          <button className={`icon-btn reset${armed ? ' armed' : ''}`} onClick={reset} title={t.reset} aria-label={armed ? t.resetConfirm : t.reset}><Icon name="reset" />{armed && <span>{t.resetConfirm}</span>}</button>
          <button className="btn btn-sage btn-sm agent-toggle" onClick={() => setPanel(!panel)}><Icon name="spark" size={16} />{t.agent}</button>
        </div>
      </header>

      <main className="main">
        <div className="content"><View {...ctx} /></div>
        <p className="foot ui-xs">{t.footer}</p>
      </main>

      {panel && <button className="scrim" aria-label={t.close} onClick={() => setPanel(false)} />}
      <div className="toasts" role="status" aria-live="polite">{toast && <div key={toast.id} className="toast"><Icon name="check" size={16} />{bidi(toast.text[lang])}</div>}</div>
      <AgentPanel open={panel} onClose={() => setPanel(false)} {...{ chat, busy, mode, model, lang, t, ask, view }} />
    </div>
  )
}
