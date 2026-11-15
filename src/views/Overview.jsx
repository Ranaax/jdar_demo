import { Head, N, Money, Icon, bidi } from '../components/ui.jsx'
import { daysUntil, total } from '../data.js'

export default function Overview({ state, t, lang, ask, decide, busy, go }) {
  const o = t.overview
  const occ = state.units.filter((u) => u.status === 'occupied').length
  const pct = Math.round((occ / state.units.length) * 100)
  const overdue = state.invoices.filter((i) => i.status === 'overdue')
  const collected = state.ledger.filter((j) => j.debit === 'bank' && j.credit === 'receivables' && daysUntil(j.date) >= -30).reduce((a, j) => a + j.amount, 0)
  const expiring = state.contracts.filter((c) => c.status === 'active' && daysUntil(c.end) <= 90)
  const fresh = state.tickets.filter((x) => x.status === 'new' && !x.pendingQuote)
  const leads = state.leads.filter((x) => x.status === 'new')
  const vacant = state.units.filter((u) => u.status === 'vacant').length
  const rows = [
    ['collections', overdue.length, o.overdue, overdue.length ? <>{o.oldest} <N>{Math.max(...overdue.map((i) => -daysUntil(i.due)))}</N> {t.collections.days}</> : null, t.collections.agentBtn],
    ['contracts', expiring.length, o.expiring, expiring.length ? <>{o.nearest} <N>{Math.min(...expiring.map((c) => daysUntil(c.end)))}</N> {t.collections.days}</> : null, t.contracts.agentBtn],
    ['maintenance', fresh.length, o.tickets, fresh.length ? o.ticketsHint : null, t.maintenance.agentBtn],
    ['leasing', leads.length, o.leads, <><N>{vacant}</N> {o.vacant}</>, t.leasing.agentBtn],
  ]

  return (
    <>
      <Head title={t.nav.overview} sub={<span className="n">{bidi(new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</span>} action={
        <button className="btn btn-deep" disabled={busy} onClick={() => ask(t.daily)}><Icon name="spark" size={16} />{t.runDaily}</button>} />

      <div className="ov">
        <section className="card ov-hero">
          <div className="ov-label">{t.kpi.overdue}</div>
          <div className="ov-big"><Money v={overdue.reduce((a, i) => a + total(i), 0)} lang={lang} /></div>
          <div className="ov-lines">
            <div className="ov-line"><span>{t.kpi.occupancy}</span><span className="push"><N b>{pct}%</N> <span className="muted">· <N>{occ}</N> {t.of} <N>{state.units.length}</N> {t.units}</span></span></div>
            <div className="meter" role="img" aria-label={`${pct}%`}><span style={{ inlineSize: `${pct}%` }} /></div>
            <div className="ov-line"><span>{t.kpi.collected}</span><span className="push"><Money v={collected} lang={lang} /></span></div>
          </div>
        </section>

        <section className="card ov-att">
          <h2 className="sh">{o.attention}</h2>
          {rows.map(([mod, n, label, hint, action]) => (
            <div key={mod} className={`att${n ? '' : ' zero'}`}>
              <span className="att-n n">{n}</span>
              <button className="att-body" onClick={() => go(mod)}>
                <span className="att-label">{label}</span>
                {hint && <span className="att-hint">{hint}</span>}
              </button>
              {n > 0 && <button className="btn btn-light btn-sm" disabled={busy} onClick={() => ask(t.prompts[mod][0])}><Icon name="spark" size={16} />{action}</button>}
            </div>
          ))}
        </section>
      </div>

      <div className="grid2">
        <section className="card pad">
          <h2 className="sh">{t.approvals} {state.approvals.length > 0 && <span className="bdg n">{state.approvals.length}</span>}</h2>
          {!state.approvals.length && <p className="muted">{o.noApprovals}</p>}
          <div className="stack">
            {state.approvals.map((a) => <Approval key={a.id} a={a} t={t} lang={lang} decide={decide} go={go} />)}
          </div>
        </section>

        <section className="card pad">
          <h2 className="sh">{t.activity}</h2>
          <div className="feed">
            {state.activity.slice(0, 14).map((a) => (
              <div key={a.id} className="feed-row ui">
                <span className={`ui-dot ${a.status}`} />
                <div><div>{bidi(a.text[lang])}</div><div className="ui-xs"><span className="n">{a.ts.replace('T', ' ')}</span> · {t.nav[a.module]}</div></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

export function Approval({ a, t, lang, decide, go }) {
  return (
    <div className="ui-row appr">
      <span className="ui-dot wait" />
      <div className="appr-body">
        <div className="ui-strong">{bidi(a.title[lang])}</div>
        <div className="ui-xs appr-detail">{bidi(a.detail[lang])}</div>
        <div className="ui-xs"><button className="link" onClick={() => go?.(a.module)}>{t.nav[a.module]}</button></div>
      </div>
      <div className="appr-act">
        <button className="btn btn-sage btn-sm" onClick={() => decide(a.id, true)}><Icon name="check" size={16} />{t.approve}</button>
        <button className="btn btn-light btn-sm" onClick={() => decide(a.id, false)}>{t.decline}</button>
      </div>
    </div>
  )
}

export const PendingFor = ({ state, module, t, lang, decide }) => {
  const list = state.approvals.filter((a) => a.module === module)
  if (!list.length) return null
  return (
    <section className="tray">
      <div className="eyebrow">{t.approvals} <span className="num n">{list.length}</span></div>
      <div className="stack">{list.map((a) => <Approval key={a.id} a={a} t={t} lang={lang} decide={decide} />)}</div>
    </section>
  )
}

