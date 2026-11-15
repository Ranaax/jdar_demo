import { useState } from 'react'
import { Head, N, Money, Tag, AgentBtn } from '../components/ui.jsx'
import { find, unitLabel, executeTool } from '../agent/tools.js'

export default function Leasing({ state, setState, t, lang, ask }) {
  const l = t.leasing
  const [adding, setAdding] = useState(false)
  const save = (lead, run) => {
    setState(executeTool(state, 'create_lead', lead, lang).state)
    setAdding(false)
    if (run) ask(t.prompts.leasing[0])
  }
  return (
    <>
      <Head title={l.title} sub={l.sub} action={
        <div className="row-actions flush">
          <button className="btn btn-deep btn-sm" onClick={() => setAdding(!adding)}>+ {l.add}</button>
          <AgentBtn onClick={() => ask(t.prompts.leasing[0])}>{l.agentBtn}</AgentBtn>
        </div>} />
      {adding && <AddLead l={l} onSave={save} onCancel={() => setAdding(false)} />}
      <div className="board">
        {['new', 'qualified', 'viewing'].map((col) => {
          const items = state.leads.filter((x) => x.status === col)
          return (
            <section key={col} className="tray col">
              <div className="eyebrow">{l.cols[col]} <span className="num n">{items.length}</span></div>
              <div className="stack">
                {!items.length && <p className="col-empty">{t.none}</p>}
                {items.map((x) => (
                  <article key={x.id} className="card tk">
                    <div className="tk-top ui-xs"><span className="n">{x.id}</span><span>{l.source[x.source]}</span></div>
                    <div className="ui-strong" dir="auto">{x.name[lang]}</div>
                    {x.need.note[lang] && <p className="ui-xs" dir="auto">{x.need.note[lang]}</p>}
                    <div className="tags">
                      <Tag kind="done">{l.type[x.need.type]}{x.need.beds ? <> · <N>{x.need.beds}</N> {l.beds}</> : null}</Tag>
                      <Tag kind="queue">{l.budget} <N>{x.need.budget.toLocaleString('en-US')}</N></Tag>
                      {x.score != null && <Tag kind="run"><N>{x.score}</N>/100</Tag>}
                    </div>
                    {x.viewing && <div className="ui-xs vendor">{l.viewing}: <N>{x.viewing}</N> · {find.unit(state, x.unitId)?.code}</div>}
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="card list">
        <div className="lrow lhead ui-xs vd"><span>{l.vacant}</span><span /><span>{l.lastEjar}</span></div>
        {state.units.filter((u) => u.status === 'vacant').map((u) => (
          <div key={u.id} className="lrow ui vd">
            <span className="ui-strong">{unitLabel(state, u.id, lang)}</span>
            <span className="ui-xs">{l.type[u.type]}{u.beds ? <> · <N>{u.beds}</N> {l.beds}</> : null} · <N>{u.area}</N> {l.m2}</span>
            <span><Money v={u.rent} lang={lang} /></span>
          </div>
        ))}
      </section>
    </>
  )
}

function AddLead({ l, onSave, onCancel }) {
  const [f, setF] = useState({ name: '', phone: '', type: 'apartment', bedrooms: 2, budget: '', note: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const ok = f.name.trim() && Number(f.budget) > 0
  const lead = () => ({ ...f, bedrooms: Number(f.bedrooms), budget: Number(f.budget) })
  return (
    <div className="card pad addform lead">
      <div className="lead-head"><h2 className="sh">{l.addTitle}</h2><p className="muted">{l.addHint}</p></div>
      <label className="ui-xs grow">{l.name}<input value={f.name} onChange={set('name')} dir="auto" /></label>
      <label className="ui-xs">{l.phone}<input className="n" value={f.phone} onChange={set('phone')} inputMode="tel" dir="ltr" /></label>
      <label className="ui-xs">{l.wants}
        <select value={f.type} onChange={set('type')}>{Object.entries(l.type).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </label>
      {f.type === 'apartment' && <label className="ui-xs">{l.bedsWanted}<input className="n" type="number" min="1" max="8" value={f.bedrooms} onChange={set('bedrooms')} /></label>}
      <label className="ui-xs">{l.budgetYear}<input className="n" type="number" min="0" step="1000" value={f.budget} onChange={set('budget')} inputMode="numeric" /></label>
      <label className="ui-xs wide">{l.notes}<textarea rows={2} value={f.note} onChange={set('note')} dir="auto" /></label>
      <div className="row-actions flush wide">
        <button type="button" className="btn btn-deep btn-sm" disabled={!ok} onClick={() => onSave(lead(), true)}>{l.saveRun}</button>
        <button type="button" className="btn btn-light btn-sm" disabled={!ok} onClick={() => onSave(lead(), false)}>{l.saveOnly}</button>
        <button type="button" className="btn btn-light btn-sm" onClick={onCancel}>{l.cancel}</button>
      </div>
    </div>
  )
}
