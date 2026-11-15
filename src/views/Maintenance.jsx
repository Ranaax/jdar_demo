import { useState } from 'react'
import { Head, N, Money, Tag, AgentBtn, Icon } from '../components/ui.jsx'
import { PendingFor } from './Overview.jsx'
import { find, unitLabel, L, executeTool, slaState } from '../agent/tools.js'

const PK = { urgent: 'wait', high: 'wait', medium: 'run', low: 'queue' }

export default function Maintenance({ state, setState, t, lang, ask, decide }) {
  const m = t.maintenance
  const [adding, setAdding] = useState(false)
  const run = (name, input) => setState(executeTool(state, name, input, lang).state)

  return (
    <>
      <Head title={m.title} sub={m.sub} action={
        <div className="row-actions flush">
          <button className="btn btn-deep btn-sm" onClick={() => setAdding(!adding)}>+ {m.add}</button>
          <AgentBtn onClick={() => ask(t.prompts.maintenance[0])}>{m.agentBtn}</AgentBtn>
        </div>} />
      {adding && <AddTicket {...{ state, m, lang }} onCancel={() => setAdding(false)} onSave={(unit_code, description) => { run('create_ticket', { unit_code, description }); setAdding(false) }} />}
      <PendingFor state={state} module="maintenance" t={t} lang={lang} decide={decide} />

      <div className="board">
        {['new', 'assigned', 'done'].map((col) => {
          const items = state.tickets.filter((x) => x.status === col)
          return (
            <section key={col} className="tray col">
              <div className="eyebrow">{m.cols[col]} <span className="num n">{items.length}</span></div>
              <div className="stack">
                {!items.length && <p className="col-empty">{t.none}</p>}
                {items.map((x) => {
                  const sla = slaState(x), vendor = x.vendorId && find.vendor(state, x.vendorId)
                  return (
                    <article key={x.id} className="card tk">
                      <div className="tk-top ui-xs"><span className="n">{x.id}</span><span>{unitLabel(state, x.unitId, lang)}</span></div>
                      <p className="ui" dir="auto">{x.text[lang]}</p>
                      <div className="tags">
                        {x.category ? <Tag kind="done">{L.cat[lang][x.category]}</Tag> : <Tag kind="queue">{m.untriaged}</Tag>}
                        {x.priority && <Tag kind={PK[x.priority]}>{L.pri[lang][x.priority]}</Tag>}
                        {sla && col !== 'done' && (sla.responded
                          ? <Tag kind={sla.met ? 'run' : 'wait'}>{sla.met ? m.met : m.breached}</Tag>
                          : <Tag kind={sla.hoursLeft > 0 ? 'queue' : 'wait'}>{sla.hoursLeft > 0 ? <>{m.left} <N>{sla.hoursLeft}</N> {m.h}</> : m.breached}</Tag>)}
                        {x.pendingQuote && <Tag kind="wait">{m.quotePending}</Tag>}
                      </div>
                      {x.sla && <div className="ui-xs">{m.sla} <N>{x.sla}</N> {m.h}</div>}
                      {col === 'new' && x.quotes?.length > 0 && (
                        <div className="quotes">
                          <div className="ui-xs">{m.quotes}</div>
                          {x.quotes.map((q) => <div key={q.vendorId} className="ui-xs qrow"><span>{find.vendor(state, q.vendorId).name[lang]} · {m.eta} <N>{q.etaHours}</N> {m.h}</span><Money v={q.amount} lang={lang} /></div>)}
                        </div>
                      )}
                      {vendor && <div className="ui-xs vendor"><span className="ui-avatar">{vendor.name[lang].slice(0, 1)}</span>{vendor.name[lang]}{x.cost != null && <span className="push"><Money v={x.cost} lang={lang} /></span>}</div>}
                      {col === 'assigned' && <button className="btn btn-light btn-sm" onClick={() => run('complete_ticket', { ticket_id: x.id })}><Icon name="check" size={16} />{m.complete}</button>}
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <section className="card list">
        <div className="lrow lhead ui-xs vd"><span>{m.vendors}</span><span /><span /></div>
        {state.vendors.map((v) => (
          <div key={v.id} className="lrow ui vd">
            <span className="ui-strong">{v.name[lang]}</span>
            <span><Tag kind="done">{L.cat[lang][v.trade]}</Tag> <span className="ui-xs">★ <N>{v.rating}</N></span></span>
            <span className="ui-xs"><N b>{v.open}</N> {m.open}</span>
          </div>
        ))}
      </section>
      <p className="footnote">{m.limitNote}</p>
    </>
  )
}

function AddTicket({ state, m, lang, onSave, onCancel }) {
  const [unit, setUnit] = useState(state.units[0].code)
  const [text, setText] = useState('')
  return (
    <div className="card pad addform">
      <label className="ui-xs">{m.unit}
        <select className="recess" value={unit} onChange={(e) => setUnit(e.target.value)}>
          {state.units.map((u) => <option key={u.id} value={u.code}>{unitLabel(state, u.id, lang)}</option>)}
        </select>
      </label>
      <label className="ui-xs grow">{m.desc}
        <textarea className="recess" rows={2} value={text} onChange={(e) => setText(e.target.value)} dir="auto" required />
      </label>
      <div className="row-actions flush">
        <button type="button" className="btn btn-deep btn-sm" disabled={!text.trim()} onClick={() => onSave(unit, text)}>{m.save}</button>
        <button type="button" className="btn btn-light btn-sm" onClick={onCancel}>{m.cancel}</button>
      </div>
    </div>
  )
}
