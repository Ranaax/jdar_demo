import { Head, N, Money, Tag, AgentBtn, Kpi } from '../components/ui.jsx'
import { PendingFor } from './Overview.jsx'
import { daysUntil, total } from '../data.js'
import { find, unitLabel, contractOfInvoice, executeTool } from '../agent/tools.js'

const KIND = { paid: 'done', due: 'run', overdue: 'wait' }

export default function Collections({ state, setState, t, lang, ask, decide }) {
  const c = t.collections
  const open = state.invoices.filter((i) => i.status !== 'paid')
  const overdue = open.filter((i) => i.status === 'overdue')
  const billed = state.invoices.filter((i) => daysUntil(i.due) <= 0)
  const rate = Math.round((billed.filter((i) => i.status === 'paid').reduce((a, i) => a + total(i), 0) / billed.reduce((a, i) => a + total(i), 0)) * 100)
  const bal = {}
  state.ledger.forEach((j) => { bal[j.debit] = (bal[j.debit] || 0) + j.amount; bal[j.credit] = (bal[j.credit] || 0) - j.amount })
  const record = (id) => setState(executeTool(state, 'record_payment', { invoice_id: id }, lang).state)
  const order = { overdue: 0, due: 1, paid: 2 }
  const late = (i) => -daysUntil(i.due)
  const aging = [['1–15', (n) => n <= 15], ['16–30', (n) => n > 15 && n <= 30], ['30+', (n) => n > 30]].map(([label, f]) => [label, overdue.filter((i) => f(late(i))).reduce((a, i) => a + total(i), 0)])

  return (
    <>
      <Head title={c.title} sub={c.sub} action={<AgentBtn onClick={() => ask(t.prompts.collections[0])}>{c.agentBtn}</AgentBtn>} />
      <div className="kpis k3">
        <Kpi label={c.outstanding} value={<Money v={open.reduce((a, i) => a + total(i), 0)} lang={lang} />} />
        <Kpi label={t.kpi.overdue} value={<Money v={overdue.reduce((a, i) => a + total(i), 0)} lang={lang} />} hint={<><N>{overdue.length}</N> {c.status.overdue}</>} />
        <Kpi label={c.rate} value={<N b>{rate}%</N>} />
      </div>
      <section className="card pad aging">
        <span className="ui-xs">{c.aging}</span>
        {aging.map(([label, v]) => <span key={label} className="ui-row"><span className="ui-xs"><N>{label}</N> {c.days}</span><Money v={v} lang={lang} /></span>)}
      </section>
      <p className="note ui">{c.vatNote}</p>
      <PendingFor state={state} module="collections" t={t} lang={lang} decide={decide} />

      <section className="card list">
        <div className="lrow lhead ui-xs inv"><span>{c.invoice}</span><span>{t.contracts.tenant}</span><span>{c.amount}</span><span>{c.due}</span><span /></div>
        {[...state.invoices].sort((a, b) => order[a.status] - order[b.status] || a.due.localeCompare(b.due)).map((i) => {
          const ct = contractOfInvoice(state, i)
          return (
            <div key={i.id} className="lrow ui inv">
              <span className="n ui-strong">{i.id}</span>
              <span>{find.tenant(state, ct.tenantId).name[lang]}<span className="ui-xs block">{unitLabel(state, ct.unitId, lang)}</span></span>
              <span><Money v={total(i)} lang={lang} /><span className="ui-xs block">{i.vat ? <>{c.vat}: <N>{i.vat.toLocaleString('en-US')}</N></> : c.exempt}</span></span>
              <span><N>{i.due}</N> <Tag kind={KIND[i.status]}>{c.status[i.status]}{i.status === 'overdue' ? ` · ${-daysUntil(i.due)}` : ''}</Tag>{i.reminders > 0 && <span className="ui-xs block">{c.reminders}: <N>{i.reminders}</N></span>}</span>
              <span className="end">{i.status !== 'paid' && <button className="btn btn-light btn-sm" onClick={() => record(i.id)}>{c.record}</button>}</span>
            </div>
          )
        })}
      </section>

      <div className="grid2">
        <section className="card list">
          <div className="lrow lhead ui-xs jr"><span>{c.ledger}</span><span>{c.dr} / {c.cr}</span><span>{c.amount}</span></div>
          {state.ledger.slice(0, 8).map((j) => (
            <div key={j.id} className="lrow ui jr">
              <span>{j.desc[lang]}<span className="ui-xs block n">{j.date} · {j.id}</span></span>
              <span className="ui-xs">{c.acct[j.debit]} / {c.acct[j.credit]}</span>
              <span><Money v={j.amount} lang={lang} /></span>
            </div>
          ))}
        </section>
        <section className="card pad">
          <h2 className="sh">{c.balances}</h2>
          <div className="stack">
            {Object.entries(bal).map(([k, v]) => (
              <div key={k} className="ui-row"><span className="ui">{c.acct[k]}</span><span className="push"><span className="ui-xs">{v >= 0 ? c.dr : c.cr}</span> <Money v={Math.abs(v)} lang={lang} /></span></div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
