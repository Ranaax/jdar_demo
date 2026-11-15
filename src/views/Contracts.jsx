import { useState } from 'react'
import { Head, N, Money, Tag, AgentBtn, Icon } from '../components/ui.jsx'
import { PendingFor } from './Overview.jsx'
import { daysUntil, d } from '../data.js'
import { find, unitLabel, queueNewContract, executeTool } from '../agent/tools.js'
import { extractTerms } from '../agent/runAgent.js'
import { SAMPLE_LEASE } from '../i18n.js'
import { docs } from '../docs.js'

export default function Contracts({ state, setState, t, lang, ask, decide }) {
  const c = t.contracts
  const [creating, setCreating] = useState(false)
  const [ending, setEnding] = useState(null)
  const rows = [...state.contracts].sort((a, b) => (a.status === 'terminated') - (b.status === 'terminated') || daysUntil(a.end) - daysUntil(b.end))
  const terminate = (id, date, reason) => { setState(executeTool(state, 'propose_early_termination', { contract_id: id, termination_date: date, reason }, lang).state); setEnding(null) }

  return (
    <>
      <Head title={c.title} sub={c.sub} action={
        <div className="row-actions flush">
          <button className="btn btn-deep btn-sm" onClick={() => setCreating(!creating)}><Icon name="doc" size={16} />{c.create}</button>
          <AgentBtn onClick={() => ask(t.prompts.contracts[0])}>{c.agentBtn}</AgentBtn>
        </div>} />
      {creating && <Creator {...{ state, setState, t, lang }} onDone={() => setCreating(false)} />}
      <p className="note ui"><Icon name="spark" size={16} />{c.freeze}</p>
      <PendingFor state={state} module="contracts" t={t} lang={lang} decide={decide} />

      <section className="card list">
        <div className="lrow lhead ui-xs ct"><span>{c.tenant}</span><span>{c.unit}</span><span>{c.rent}</span><span>{c.end}</span><span>{c.ejar}</span><span /></div>
        {rows.map((x) => {
          const left = daysUntil(x.end)
          const st = x.status === 'terminated' ? ['queue', c.status.terminated] : x.status.endsWith('_pending') ? ['wait', c.status[x.status]] : x.renewed ? ['done', c.renewed] : left <= 90 ? ['wait', `${left} ${c.daysLeft}`] : ['run', c.status.active]
          return (
            <div key={x.id} className="ct-wrap">
              <div className="lrow ui ct">
                <span>
                  <span className="ui-strong">{find.tenant(state, x.tenantId)?.name[lang]}</span>
                  <span className="ui-xs block n">{x.id} · {t.sched[x.schedule]}</span>
                  {x.doc && <DocChip id={x.id} name={x.doc.name} />}
                </span>
                <span>{unitLabel(state, x.unitId, lang)}</span>
                <span><Money v={x.annualRent} lang={lang} /></span>
                <span><N>{x.end}</N> <Tag kind={st[0]}>{st[1]}</Tag></span>
                <span className="n ui-xs">{x.ejar === 'pending' ? '—' : x.ejar}</span>
                <span className="end">{x.status === 'active' && <button className="btn btn-light btn-sm" onClick={() => setEnding(ending === x.id ? null : x.id)}>{c.terminate}</button>}</span>
              </div>
              {ending === x.id && <EndForm c={c} max={x.end} onCancel={() => setEnding(null)} onSend={(date, reason) => terminate(x.id, date, reason)} />}
            </div>
          )
        })}
      </section>
    </>
  )
}

const DocChip = ({ id, name }) => {
  const url = docs.get(id)
  const body = <><Icon name="doc" size={12} /><span dir="auto">{name}</span></>
  return url ? <a className="ui-chip doc" href={url} target="_blank" rel="noreferrer">{body}</a> : <span className="ui-chip doc">{body}</span>
}

function EndForm({ c, max, onCancel, onSend }) {
  const [date, setDate] = useState(d(30) < max ? d(30) : d(1))
  const [reason, setReason] = useState('')
  return (
    <div className="endform recess">
      <label className="ui-xs">{c.termDate}<input type="date" className="n" value={date} min={d(0)} max={max} onChange={(e) => setDate(e.target.value)} required /></label>
      <label className="ui-xs grow">{c.termReason}<input value={reason} onChange={(e) => setReason(e.target.value)} dir="auto" required /></label>
      <button type="button" className="btn btn-deep btn-sm" disabled={!reason.trim() || !date} onClick={() => onSend(date, reason.trim())}>{c.termSend}</button>
      <button type="button" className="btn btn-light btn-sm" onClick={onCancel}>{c.cancel}</button>
    </div>
  )
}

function Creator({ state, setState, t, lang, onDone }) {
  const c = t.contracts
  const [tab, setTab] = useState('pdf')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const ready = tab === 'pdf' ? !!file : !!text.trim()
  const pick = (f) => { setRes(null); setFile(f && f.size > 3_000_000 ? null : f); if (f && f.size > 3_000_000) setRes({ error: 'pdf_too_large' }) }
  const run = async () => { setLoading(true); setRes(null); try { setRes(await extractTerms(tab === 'pdf' ? { file } : { text })) } catch { setRes({ error: 'other' }) } finally { setLoading(false) } }

  const submit = () => {
    const x = res.terms
    const unit = state.units.find((u) => u.code === x.unit_code)
    const id = `C-${1049 + state.contracts.length}`, tenantId = `T-${Date.now()}`
    const useFile = tab === 'pdf' && file
    if (useFile) docs.set(id, URL.createObjectURL(file))
    const payload = { id, unitId: unit?.id || x.unit_code, tenantId, start: x.start, end: x.end, annualRent: unit && x.annual_rent > unit.rent ? unit.rent : x.annual_rent, schedule: x.payment_schedule, doc: useFile ? { name: file.name } : null }
    const flags = x.risks?.length ? x.risks.join(lang === 'ar' ? '؛ ' : '; ') : ''
    const next = queueNewContract(state, payload,
      { ar: `عقد جديد – ${x.tenant_name} – ${x.unit_code}`, en: `New contract – ${x.tenant_name} – ${x.unit_code}` },
      { ar: `${x.start} إلى ${x.end}، ${x.annual_rent?.toLocaleString('en-US')} ر.س سنوياً. ${flags && 'تنبيهات: ' + flags}`, en: `${x.start} to ${x.end}, ${x.annual_rent?.toLocaleString('en-US')} SAR/yr. ${flags && 'Flags: ' + flags}` })
    next.tenants.push({ id: tenantId, name: { ar: x.tenant_name, en: x.tenant_name }, phone: '' })
    setState(next); onDone()
  }
  const complete = res?.terms && res.terms.tenant_name && res.terms.unit_code && res.terms.start && res.terms.end && res.terms.annual_rent

  return (
    <section className="card pad extract">
      <h2 className="sh"><Icon name="doc" />{c.extractTitle}</h2>
      <p className="ui muted">{c.extractSub}</p>
      <div className="tabs" role="tablist">
        {[['pdf', c.tabPdf], ['text', c.tabText]].map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => { setTab(k); setRes(null) }}>{label}</button>)}
      </div>
      {tab === 'pdf' ? (
        <label className="drop recess">
          <input type="file" accept="application/pdf,.pdf" onChange={(e) => pick(e.target.files[0])} />
          <Icon name="doc" size={22} />
          <span className="ui-strong" dir="auto">{file ? file.name : c.choosePdf}</span>
          <span className="ui-xs">{c.pdfHint}</span>
        </label>
      ) : (
        <textarea className="recess" rows={7} value={text} onChange={(e) => setText(e.target.value)} dir="auto" placeholder="…" />
      )}
      <div className="row-actions">
        {tab === 'text' && <button className="btn btn-light btn-sm" onClick={() => setText(SAMPLE_LEASE)}>{c.useSample}</button>}
        <button className="btn btn-sage btn-sm" disabled={!ready || loading} onClick={run}><Icon name="spark" size={16} />{c.extract}</button>
        {loading && <span className="ui-xs thinking"><span className="ui-dot run" />{t.thinking}</span>}
      </div>
      {res?.error && <p className="note warn ui">{c.err[res.error] || c.err.other}</p>}
      {res?.terms && (
        <div className="terms">
          <div className="tgrid">
            {Object.entries(c.fields).map(([k, label]) => (
              <div key={k} className="ui-row tcell">
                <span className="ui-xs">{label}</span>
                <span className="ui-strong">{k === 'annual_rent' || k === 'deposit' ? (res.terms[k] ? <Money v={res.terms[k]} lang={lang} /> : '—') : k === 'payment_schedule' ? t.sched[res.terms[k]] || res.terms[k] : <span className={/start|end|ejar|unit/.test(k) ? 'n' : ''} dir="auto">{res.terms[k] || '—'}</span>}</span>
              </div>
            ))}
          </div>
          {res.terms.risks?.length > 0 && <div className="risks"><div className="ui-xs">{c.risks}</div>{res.terms.risks.map((r) => <div key={r} className="ui" dir="auto"><Tag kind="wait">!</Tag> {r}</div>)}</div>}
          {res.terms.special_terms?.length > 0 && <div className="risks"><div className="ui-xs">{c.special}</div>{res.terms.special_terms.map((r) => <div key={r} className="ui" dir="auto">· {r}</div>)}</div>}
          {res.mode === 'local' && <p className="ui-xs">{c.localNote}</p>}
          <div className="row-actions">
            <button className="btn btn-deep btn-sm" disabled={!complete} onClick={submit}>{c.createDraft}</button>
            <span className="ui-xs">{res.mode === 'llm' ? t.llm : t.local}</span>
          </div>
        </div>
      )}
    </section>
  )
}
