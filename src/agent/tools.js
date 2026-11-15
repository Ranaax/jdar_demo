import { today, nowLocal, daysUntil, total, SLA_HOURS, QUOTE_LIMIT } from '../data.js'

let seq = Date.now() % 100000
const id = (p) => `${p}${++seq}`
const now = nowLocal
const sar = (n) => `${Math.round(n).toLocaleString('en-US')} SAR`
const sarAr = (n) => `${Math.round(n).toLocaleString('en-US')} ر.س`
const addYear = (date) => { const x = new Date(date); x.setFullYear(x.getFullYear() + 1); return x.toISOString().slice(0, 10) }

export const find = {
  unit: (s, uid) => s.units.find((x) => x.id === uid),
  prop: (s, pid) => s.properties.find((x) => x.id === pid),
  tenant: (s, tid) => s.tenants.find((x) => x.id === tid),
  contract: (s, cid) => s.contracts.find((x) => x.id === cid),
  vendor: (s, vid) => s.vendors.find((x) => x.id === vid),
}
export const contractOfInvoice = (s, i) => find.contract(s, i.contractId)
export const unitLabel = (s, uid, lang) => { const u = find.unit(s, uid); return u ? `${u.code} · ${find.prop(s, u.propertyId).name[lang]}` : uid }
export const slaState = (t) => {
  if (!t.sla) return null
  const due = new Date(t.createdAt).getTime() + t.sla * 3600000
  const at = t.respondedAt ? new Date(t.respondedAt).getTime() : Date.now()
  return { met: at <= due, responded: !!t.respondedAt, hoursLeft: Math.round((due - Date.now()) / 3600000) }
}

const log = (s, module, text, status = 'done') => s.activity.unshift({ id: id('A'), ts: now(), module, status, text })
const queue = (s, module, kind, payload, title, detail) => {
  const a = { id: id('AP'), ts: now(), module, kind, payload, title, detail }
  s.approvals.unshift(a)
  log(s, module, { ar: `بانتظار الموافقة: ${title.ar}`, en: `Awaiting approval: ${title.en}` }, 'wait')
  return a
}

const invoiceView = (s, i, lang) => {
  const c = contractOfInvoice(s, i)
  return { id: i.id, tenant: find.tenant(s, c.tenantId).name[lang], unit: unitLabel(s, c.unitId, lang), rent_sar: i.amount, vat_sar: i.vat || 0, total_sar: total(i), due: i.due, status: i.status, days_overdue: i.status === 'overdue' ? -daysUntil(i.due) : 0, reminders_sent: i.reminders }
}

const BASE = { hvac: 650, plumbing: 280, electrical: 350, elevator: 1200, general: 150 }
const makeQuotes = (s, t) => s.vendors.filter((v) => v.trade === t.category).map((v) => ({
  vendorId: v.id, amount: Math.round((BASE[t.category] * (0.85 + (v.rating - 4.3) * 0.5)) / 10) * 10, etaHours: 2 + v.open * 2,
}))
const doAssign = (s, t, v, cost) => {
  Object.assign(t, { vendorId: v.id, status: 'assigned', cost, respondedAt: now(), pendingQuote: false }); v.open += 1
  log(s, 'maintenance', { ar: `أُسند ${t.id} إلى ${v.name.ar} بتكلفة ${sarAr(cost)} وأُبلغ المستأجر`, en: `Assigned ${t.id} to ${v.name.en} at ${sar(cost)} and notified the tenant` })
}

const handlers = {
  get_portfolio_summary(s) {
    const occ = s.units.filter((u) => u.status === 'occupied').length
    const overdue = s.invoices.filter((i) => i.status === 'overdue')
    return {
      units: s.units.length, occupied: occ, occupancy_pct: Math.round((occ / s.units.length) * 100),
      overdue_invoices: overdue.length, overdue_sar: overdue.reduce((a, i) => a + total(i), 0),
      contracts_expiring_90d: s.contracts.filter((c) => c.status === 'active' && daysUntil(c.end) <= 90).length,
      new_tickets: s.tickets.filter((t) => t.status === 'new').length,
      new_leads: s.leads.filter((l) => l.status === 'new').length,
      pending_approvals: s.approvals.length,
    }
  },

  list_invoices(s, { status }, lang) {
    return s.invoices.filter((i) => !status || i.status === status).map((i) => invoiceView(s, i, lang))
  },

  draft_payment_reminder(s, { invoice_id, channel = 'sms', message }) {
    const i = s.invoices.find((x) => x.id === invoice_id)
    if (!i) return { error: `invoice ${invoice_id} not found` }
    if (i.status === 'paid') return { error: `${invoice_id} is already paid` }
    if (s.approvals.some((a) => a.kind === 'reminder' && a.payload.invoice_id === invoice_id)) return { error: `a reminder for ${invoice_id} is already awaiting approval` }
    const c = contractOfInvoice(s, i), t = find.tenant(s, c.tenantId)
    const a = queue(s, 'collections', 'reminder', { invoice_id, channel, message },
      { ar: `تذكير ${t.name.ar} – ${invoice_id}`, en: `Reminder to ${t.name.en} – ${invoice_id}` },
      { ar: message, en: message })
    return { queued_for_approval: a.id, tenant: t.name.en, channel }
  },

  record_payment(s, { invoice_id, amount }) {
    const i = s.invoices.find((x) => x.id === invoice_id)
    if (!i) return { error: `invoice ${invoice_id} not found` }
    if (i.status === 'paid') return { error: `${invoice_id} is already paid` }
    const amt = amount || total(i)
    if (amt <= 0 || amt > total(i)) return { error: `amount must be between 1 and ${total(i)} SAR` }
    i.status = amt >= total(i) ? 'paid' : i.status
    i.paidOn = today()
    s.ledger.unshift({ id: `J-${501 + s.ledger.length}`, date: today(), desc: { ar: `تحصيل ${invoice_id}`, en: `Collection ${invoice_id}` }, debit: 'bank', credit: 'receivables', amount: amt })
    log(s, 'collections', { ar: `سُجّل تحصيل ${sarAr(amt)} لفاتورة ${invoice_id} وقُيّد في الدفتر`, en: `Recorded ${sar(amt)} for ${invoice_id} and posted to the ledger` })
    return { ok: true, invoice: invoice_id, amount_sar: amt, status: i.status, journal: 'Dr Bank / Cr Receivables' }
  },

  list_contracts(s, { expiring_within_days }, lang) {
    return s.contracts
      .filter((c) => !expiring_within_days || (c.status === 'active' && daysUntil(c.end) <= expiring_within_days))
      .map((c) => ({ id: c.id, tenant: find.tenant(s, c.tenantId).name[lang], unit: unitLabel(s, c.unitId, lang), annual_rent_sar: c.annualRent, start: c.start, end: c.end, days_to_end: daysUntil(c.end), schedule: c.schedule, ejar: c.ejar, status: c.status }))
  },

  propose_renewal(s, { contract_id, annual_rent, note }) {
    const c = find.contract(s, contract_id)
    if (!c) return { error: `contract ${contract_id} not found` }
    if (annual_rent > c.annualRent) return { error: `blocked: Riyadh rent freeze. Current rent is ${c.annualRent} SAR; renewal rent cannot be higher.` }
    if (c.status !== 'active') return { error: `${contract_id} is ${c.status}` }
    const t = find.tenant(s, c.tenantId)
    c.status = 'renewal_pending'
    const a = queue(s, 'contracts', 'renewal', { contract_id, annual_rent, new_end: addYear(c.end) },
      { ar: `تجديد ${contract_id} – ${t.name.ar}`, en: `Renew ${contract_id} – ${t.name.en}` },
      { ar: `12 شهراً حتى ${addYear(c.end)} بإيجار ${sarAr(annual_rent)}. ${note}`, en: `12 months to ${addYear(c.end)} at ${sar(annual_rent)}. ${note}` })
    return { queued_for_approval: a.id, new_end: addYear(c.end), annual_rent_sar: annual_rent }
  },

  propose_early_termination(s, { contract_id, termination_date, reason }) {
    const c = find.contract(s, contract_id)
    if (!c) return { error: `contract ${contract_id} not found` }
    if (c.status !== 'active') return { error: `${contract_id} is ${c.status}` }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(termination_date || '') || termination_date < today() || termination_date >= c.end) return { error: `termination_date must be between ${today()} and ${c.end}` }
    const t = find.tenant(s, c.tenantId)
    const open = s.invoices.filter((i) => i.contractId === c.id && i.status !== 'paid')
    const owed = open.filter((i) => i.due <= termination_date), cancelled = open.filter((i) => i.due > termination_date)
    const owedSum = owed.reduce((a, i) => a + total(i), 0)
    c.status = 'termination_pending'
    const a = queue(s, 'contracts', 'termination', { contract_id, termination_date },
      { ar: `إنهاء مبكر ${contract_id} – ${t.name.ar}`, en: `Early termination ${contract_id} – ${t.name.en}` },
      { ar: `ينتهي العقد في ${termination_date} بدلاً من ${c.end}. السبب: ${reason}. المستحق قبل الإخلاء: ${sarAr(owedSum)} (عدد الفواتير: ${owed.length}). عدد الفواتير اللاحقة التي تُلغى: ${cancelled.length}. تصبح الوحدة شاغرة. تُراجع شروط الإنهاء في العقد قبل الاعتماد.`,
        en: `Contract ends ${termination_date} instead of ${c.end}. Reason: ${reason}. Due before move-out: ${sar(owedSum)} (invoices: ${owed.length}). Later invoices cancelled: ${cancelled.length}. The unit becomes vacant. Check the lease termination terms before approving.` })
    return { queued_for_approval: a.id, due_before_moveout_sar: owedSum, invoices_to_cancel: cancelled.length }
  },

  list_tickets(s, { status }, lang) {
    return s.tickets.filter((t) => !status || t.status === status).map((t) => ({ id: t.id, unit: unitLabel(s, t.unitId, lang), request: t.text[lang], category: t.category, priority: t.priority, sla_hours: t.sla, status: t.status, awaiting_quote_approval: !!t.pendingQuote, vendor: t.vendorId && find.vendor(s, t.vendorId).name[lang], cost_sar: t.cost, created: t.createdAt }))
  },

  create_ticket(s, { unit_code, description }) {
    const u = s.units.find((x) => x.code === unit_code || x.id === unit_code)
    if (!u) return { error: `unit ${unit_code} not found` }
    if (!description?.trim()) return { error: 'description is required' }
    const n = Math.max(...s.tickets.map((t) => Number(t.id.slice(2)))) + 1
    const t = { id: `M-${n}`, unitId: u.id, text: { ar: description.trim(), en: description.trim() }, createdAt: now(), category: null, priority: null, sla: null, status: 'new', vendorId: null, quotes: [], cost: null, respondedAt: null }
    s.tickets.unshift(t)
    log(s, 'maintenance', { ar: `بلاغ جديد ${t.id} للوحدة ${u.code}`, en: `New ticket ${t.id} for unit ${u.code}` }, 'queue')
    return { ok: true, ticket_id: t.id, unit: u.code }
  },

  triage_ticket(s, { ticket_id, category, priority, reason }) {
    const t = s.tickets.find((x) => x.id === ticket_id)
    if (!t) return { error: `ticket ${ticket_id} not found` }
    if (!BASE[category] || !SLA_HOURS[priority]) return { error: 'invalid category or priority' }
    Object.assign(t, { category, priority, reason, sla: SLA_HOURS[priority] })
    log(s, 'maintenance', { ar: `صُنّف ${ticket_id}: ${L.cat.ar[category]} · ${L.pri.ar[priority]} · الاستجابة خلال ${t.sla} ساعة`, en: `Triaged ${ticket_id}: ${L.cat.en[category]} · ${L.pri.en[priority]} · respond within ${t.sla}h` })
    return { ok: true, ticket_id, category, priority, sla_hours: t.sla }
  },

  list_vendors(s, { trade }, lang) {
    return s.vendors.filter((v) => !trade || v.trade === trade).map((v) => ({ id: v.id, name: v.name[lang], trade: v.trade, rating: v.rating, open_jobs: v.open }))
  },

  request_quotes(s, { ticket_id }, lang) {
    const t = s.tickets.find((x) => x.id === ticket_id)
    if (!t) return { error: `ticket ${ticket_id} not found` }
    if (!t.category) return { error: 'triage the ticket first' }
    t.quotes = makeQuotes(s, t)
    log(s, 'maintenance', { ar: `طُلبت عروض الأسعار للبلاغ ${ticket_id} (${t.quotes.length})`, en: `Requested quotes for ${ticket_id} (${t.quotes.length})` })
    return { ticket_id, approval_needed_above_sar: QUOTE_LIMIT, quotes: t.quotes.map((q) => ({ vendor_id: q.vendorId, vendor: find.vendor(s, q.vendorId).name[lang], rating: find.vendor(s, q.vendorId).rating, amount_sar: q.amount, eta_hours: q.etaHours })) }
  },

  assign_vendor(s, { ticket_id, vendor_id }) {
    const t = s.tickets.find((x) => x.id === ticket_id), v = find.vendor(s, vendor_id)
    if (!t || !v) return { error: 'ticket or vendor not found' }
    if (t.status !== 'new') return { error: `${ticket_id} is already ${t.status}` }
    if (t.pendingQuote) return { error: `a quote for ${ticket_id} is already awaiting approval` }
    if (!t.category) return { error: 'triage the ticket first' }
    if (v.trade !== t.category) return { error: `${v.name.en} does not handle ${t.category}` }
    if (!t.quotes?.length) t.quotes = makeQuotes(s, t)
    const q = t.quotes.find((x) => x.vendorId === vendor_id)
    if (q.amount > QUOTE_LIMIT) {
      t.pendingQuote = true
      const a = queue(s, 'maintenance', 'quote', { ticket_id, vendor_id, cost: q.amount },
        { ar: `عرض سعر ${ticket_id} – ${v.name.ar}`, en: `Quote for ${ticket_id} – ${v.name.en}` },
        { ar: `${sarAr(q.amount)}، الوصول خلال ${q.etaHours} ساعات. يتجاوز حد الصرف التلقائي (${sarAr(QUOTE_LIMIT)}).`, en: `${sar(q.amount)}, arrival within ${q.etaHours}h. Above the auto-approve limit (${sar(QUOTE_LIMIT)}).` })
      return { queued_for_approval: a.id, cost_sar: q.amount, reason: `above ${QUOTE_LIMIT} SAR limit` }
    }
    doAssign(s, t, v, q.amount)
    return { ok: true, ticket_id, vendor: v.name.en, cost_sar: q.amount }
  },

  complete_ticket(s, { ticket_id }) {
    const t = s.tickets.find((x) => x.id === ticket_id)
    if (!t) return { error: `ticket ${ticket_id} not found` }
    if (t.status !== 'assigned') return { error: `${ticket_id} is ${t.status}` }
    const v = find.vendor(s, t.vendorId)
    t.status = 'done'; v.open = Math.max(0, v.open - 1)
    s.ledger.unshift({ id: `J-${501 + s.ledger.length}`, date: today(), desc: { ar: `تكلفة البلاغ ${ticket_id} – ${v.name.ar}`, en: `Ticket ${ticket_id} cost – ${v.name.en}` }, debit: 'maintenance', credit: 'bank', amount: t.cost })
    log(s, 'maintenance', { ar: `أُغلق ${ticket_id} وقُيّدت التكلفة ${sarAr(t.cost)} في الدفتر`, en: `Closed ${ticket_id} and posted ${sar(t.cost)} to the ledger` })
    return { ok: true, ticket_id, cost_sar: t.cost, journal: 'Dr Maintenance expense / Cr Bank' }
  },

  list_leads(s, { status }, lang) {
    return s.leads.filter((l) => !status || l.status === status).map((l) => ({ id: l.id, name: l.name[lang], type: l.need.type, bedrooms: l.need.beds, budget_sar: l.need.budget, note: l.need.note[lang], source: l.source, score: l.score, status: l.status, viewing: l.viewing }))
  },

  create_lead(s, { name, phone = '', type, bedrooms = 0, budget, note = '' }) {
    if (!name?.trim()) return { error: 'name is required' }
    if (!['apartment', 'office', 'shop'].includes(type)) return { error: 'type must be apartment, office or shop' }
    if (!(budget > 0)) return { error: 'budget must be a positive annual amount in SAR' }
    const n = Math.max(...s.leads.map((l) => Number(l.id.slice(2)))) + 1
    const l = { id: `L-${n}`, name: { ar: name.trim(), en: name.trim() }, phone, need: { type, beds: type === 'apartment' ? Math.max(0, Math.round(bedrooms)) : 0, budget: Math.round(budget), note: { ar: note, en: note } }, source: 'manual', created: today(), score: null, status: 'new', viewing: null, unitId: null }
    s.leads.unshift(l)
    log(s, 'leasing', { ar: `عميل جديد ${l.id}: ${l.name.ar}`, en: `New lead ${l.id}: ${l.name.en}` }, 'queue')
    return { ok: true, lead_id: l.id }
  },

  match_units(s, { lead_id }, lang) {
    const l = s.leads.find((x) => x.id === lead_id)
    if (!l) return { error: `lead ${lead_id} not found` }
    return s.units
      .filter((u) => u.status === 'vacant' && u.type === l.need.type && u.rent <= l.need.budget * 1.1 && (l.need.type !== 'apartment' || u.beds >= l.need.beds))
      .sort((a, b) => Math.abs(a.rent - l.need.budget) - Math.abs(b.rent - l.need.budget))
      .map((u) => ({ unit_id: u.id, unit: unitLabel(s, u.id, lang), bedrooms: u.beds, area_m2: u.area, annual_rent_sar: u.rent, within_budget: u.rent <= l.need.budget }))
  },

  qualify_lead(s, { lead_id, score, reason }) {
    const l = s.leads.find((x) => x.id === lead_id)
    if (!l) return { error: `lead ${lead_id} not found` }
    const sc = Math.max(0, Math.min(100, Math.round(score)))
    Object.assign(l, { score: sc, reason, status: l.status === 'new' ? 'qualified' : l.status })
    log(s, 'leasing', { ar: `قُيّم العميل ${l.name.ar}: ${sc}/100`, en: `Qualified ${l.name.en}: ${sc}/100` })
    return { ok: true, lead_id, score: sc }
  },

  schedule_viewing(s, { lead_id, unit_id, datetime }) {
    const l = s.leads.find((x) => x.id === lead_id), u = find.unit(s, unit_id)
    if (!l || !u) return { error: 'lead or unit not found' }
    if (u.status !== 'vacant') return { error: `${u.code} is not vacant` }
    Object.assign(l, { viewing: datetime, unitId: unit_id, status: 'viewing' })
    log(s, 'leasing', { ar: `حُجزت معاينة ${u.code} للعميل ${l.name.ar} في ${datetime}`, en: `Viewing of ${u.code} booked for ${l.name.en} at ${datetime}` })
    return { ok: true, lead_id, unit: u.code, datetime }
  },
}

export const L = {
  cat: { ar: { hvac: 'تكييف', plumbing: 'سباكة', electrical: 'كهرباء', elevator: 'مصاعد', general: 'عام' }, en: { hvac: 'HVAC', plumbing: 'Plumbing', electrical: 'Electrical', elevator: 'Elevator', general: 'General' } },
  pri: { ar: { urgent: 'عاجل', high: 'مرتفع', medium: 'متوسط', low: 'منخفض' }, en: { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' } },
}

// The only way the agent (LLM or local) can change anything. Unknown tools and failed checks change nothing.
export function executeTool(state, name, input = {}, lang = 'ar') {
  const s = structuredClone(state)
  const h = Object.hasOwn(handlers, name) && handlers[name]
  if (!h) return { state, result: { error: `unknown tool ${name}` } }
  try {
    const result = h(s, input || {}, lang)
    return { state: result?.error ? state : s, result }
  } catch (e) {
    return { state, result: { error: String(e.message || e) } }
  }
}

export function resolveApproval(state, approvalId, approve) {
  const s = structuredClone(state)
  const a = s.approvals.find((x) => x.id === approvalId)
  if (!a) return state
  s.approvals = s.approvals.filter((x) => x.id !== approvalId)
  const p = a.payload
  if (a.kind === 'reminder' && approve) {
    const i = s.invoices.find((x) => x.id === p.invoice_id)
    i.reminders += 1; i.lastReminder = today()
  }
  if (a.kind === 'renewal') {
    const c = find.contract(s, p.contract_id)
    if (approve) Object.assign(c, { status: 'active', end: p.new_end, annualRent: p.annual_rent, renewed: true })
    else c.status = 'active'
  }
  if (a.kind === 'termination') {
    const c = find.contract(s, p.contract_id)
    if (approve) {
      Object.assign(c, { status: 'terminated', end: p.termination_date })
      s.invoices = s.invoices.filter((i) => !(i.contractId === c.id && i.status !== 'paid' && i.due > p.termination_date))
      const u = find.unit(s, c.unitId); if (u) u.status = 'vacant'
    } else c.status = 'active'
  }
  if (a.kind === 'quote') {
    const t = s.tickets.find((x) => x.id === p.ticket_id)
    if (approve) doAssign(s, t, find.vendor(s, p.vendor_id), p.cost)
    else t.pendingQuote = false
  }
  if (a.kind === 'new_contract' && approve) {
    s.contracts.unshift({ ...p, status: 'active', ejar: 'pending' })
    const u = find.unit(s, p.unitId); if (u) u.status = 'occupied'
  }
  log(s, a.module, approve
    ? { ar: `اعتُمد: ${a.title.ar}`, en: `Approved: ${a.title.en}` }
    : { ar: `رُفض: ${a.title.ar}`, en: `Declined: ${a.title.en}` }, approve ? 'done' : 'queue')
  return s
}

export const queueNewContract = (state, payload, title, detail) => {
  const s = structuredClone(state)
  queue(s, 'contracts', 'new_contract', payload, title, detail)
  return s
}
