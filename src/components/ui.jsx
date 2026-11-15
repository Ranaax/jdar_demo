const P = {
  overview: 'M4 5h7v6H4zM13 5h7v3h-7zM13 10h7v9h-7zM4 13h7v6H4z',
  contracts: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  collections: 'M4 7h16v11H4zM4 10h16M8 15h3',
  maintenance: 'M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5L16 12l-4-4z',
  leasing: 'M15 9a4 4 0 1 1-3.5 6L5 21H3v-3l6.5-6.5A4 4 0 0 1 15 9zM16 8h.01',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  send: 'M4 12 20 4l-6 16-3-7z',
  check: 'M5 12l5 5L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  reset: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4',
  doc: 'M7 3h7l4 4v14H7zM14 3v4h4',
  arrow: 'M15 6l-6 6 6 6',
}
export const Icon = ({ name, size = 18, className = '' }) => (
  <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[name]} /></svg>
)

export const N = ({ children, b }) => <span className={`n${b ? ' nb' : ''}`}>{children}</span>
export const sar = (n) => Math.round(n).toLocaleString('en-US')
export const Money = ({ v, lang }) => <span className="money"><N b>{sar(v)}</N> <span className="cur">{lang === 'ar' ? 'ر.س' : 'SAR'}</span></span>

export const Tag = ({ kind = 'queue', children }) => <span className={`ui-tag ${kind}`}>{children}</span>

export const Head = ({ title, sub, action }) => (
  <div className="vhead">
    <div><h1 className="h3">{title}</h1>{sub && <p className="muted small">{sub}</p>}</div>
    {action}
  </div>
)

export const Kpi = ({ label, value, hint }) => (
  <div className="card kpi"><div className="ui-xs">{label}</div><div className="kpi-v">{value}</div>{hint && <div className="ui-xs">{hint}</div>}</div>
)

export const AgentBtn = ({ onClick, children }) => (
  <button className="btn btn-sage btn-sm" onClick={onClick}><Icon name="spark" size={16} />{children}</button>
)

// Keeps ISO dates and times left-to-right inside Arabic sentences.
export const bidi = (text) => String(text ?? '').replace(/\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2})?/g, (m) => `\u2066${m}\u2069`)
