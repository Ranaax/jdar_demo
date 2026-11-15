import { Head, N, Money, Tag, AgentBtn } from '../components/ui.jsx'
import { find, unitLabel } from '../agent/tools.js'

export default function Leasing({ state, t, lang, ask }) {
  const l = t.leasing
  return (
    <>
      <Head title={l.title} sub={l.sub} action={<AgentBtn onClick={() => ask(t.prompts.leasing[0])}>{l.agentBtn}</AgentBtn>} />
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
                    <div className="ui-strong">{x.name[lang]}</div>
                    <p className="ui-xs">{x.need.note[lang]}</p>
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
