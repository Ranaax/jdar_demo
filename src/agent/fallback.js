// Deterministic agent used when no LLM key is configured, so the demo always runs.
import { find, L } from './tools.js'
import { d } from '../data.js'

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms))
let LANG = 'ar'
const sar = (n) => `${Math.round(n).toLocaleString('en-US')} ${LANG === 'ar' ? 'ر.س' : 'SAR'}`
const has = (p, re) => re.test(p)

const INTENTS = {
  daily: /يومي|كامل|كل المهام|daily|everything|full/i,
  collections: /متأخر|تحصيل|تذكير|فاتور|overdue|collect|remind|invoice/i,
  newTicket: /(أضف|اضف|سجّل|سجل|أنشئ|انشئ|افتح)\s+بلاغ|بلاغ جديد|(add|log|create|open)\s+(a\s+)?(new\s+)?(maintenance\s+)?(ticket|request)/i,
  closeTicket: /(أغلق|اغلق|أنجز|close|complete).*M-\d+/i,
  terminate: /((أنهِ|أنه|انه|إنهاء|انهاء).*C-\d+)|((terminate|end)\b.*C-\d+.*early)|(early.*C-\d+)/i,
  payment: /سجّل دفعة|سجل دفعة|record.*payment|payment for/i,
  renewals: /تجديد|ينتهي|تنتهي|عقود|renew|expir|end soon|contract/i,
  maintenance: /صيان|بلاغ|عاجل|maint|ticket|triage|urgent|repair|vendor/i,
  leasing: /عميل|عملاء|تأجير|معاين|وحد|lead|leasing|viewing|unit|prospect/i,
}

const ASKS = /^\s*(ما|كم|هل|اعرض|what|which|how|show|list)(\s|$)/i

async function collections(lang, exec, prompt = '') {
  const overdue = exec('list_invoices', { status: 'overdue' })
  await sleep(300)
  if (ASKS.test(prompt) && !/جهّز|جهز|ذكّر|draft|remind|chase/i.test(prompt)) {
    const sum = overdue.reduce((a, i) => a + i.total_sar, 0)
    return (lang === 'ar' ? `إجمالي المتأخرات ${sar(sum)} (عدد الفواتير: ${overdue.length}):` : `Total overdue ${sar(sum)} (invoices: ${overdue.length}):`) + '\n' + overdue.map((i) => `${i.id} · ${i.tenant} · ${sar(i.total_sar)} · ${i.days_overdue}${lang === 'ar' ? ' يوماً' : 'd'}`).join('\n')
  }
  const out = []
  for (const i of overdue) {
    const firm = i.reminders_sent >= 1
    const message = lang === 'ar'
      ? `السيد/السيدة ${i.tenant}، نود إشعاركم بأن الدفعة ${i.id} بمبلغ ${sar(i.total_sar)} للوحدة ${i.unit} متأخرة ${i.days_overdue} يوماً. ${firm ? 'نأمل السداد خلال 3 أيام عمل تجنباً لإحالة الملف وفق شروط العقد.' : 'نأمل التكرم بالسداد عبر سداد أو التحويل البنكي.'} مع التحية، إدارة الأملاك – جدار.`
      : `Dear ${i.tenant}, payment ${i.id} of ${sar(i.total_sar)} for unit ${i.unit} is ${i.days_overdue} days overdue. ${firm ? 'Please settle within 3 working days to avoid escalation under the lease terms.' : 'Kindly settle via SADAD or bank transfer.'} Regards, Jdar Property Management.`
    const r = exec('draft_payment_reminder', { invoice_id: i.id, channel: firm ? 'whatsapp' : 'sms', message })
    if (!r.error) out.push(`${i.id} · ${i.tenant} · ${sar(i.total_sar)} · ${i.days_overdue}${lang === 'ar' ? ' يوماً' : 'd'}${firm ? (lang === 'ar' ? ' (صيغة أشد)' : ' (firmer tone)') : ''}`)
    await sleep(250)
  }
  const total = overdue.reduce((a, i) => a + i.total_sar, 0)
  if (!out.length) return lang === 'ar' ? 'لا توجد فواتير متأخرة تحتاج تذكيراً جديداً.' : 'No overdue invoices need a new reminder.'
  return lang === 'ar'
    ? `وجدت ${overdue.length} فواتير متأخرة بإجمالي ${sar(total)}. صغت ${out.length} تذكيرات وهي بانتظار اعتمادك:\n${out.join('\n')}`
    : `Found ${overdue.length} overdue invoices totalling ${sar(total)}. Drafted ${out.length} reminders, awaiting your approval:\n${out.join('\n')}`
}

async function newTicket(prompt, lang, exec, getState) {
  const unit = getState().units.find((u) => new RegExp(`(^|[^A-Za-z0-9])${u.code}([^0-9]|$)`, 'i').test(prompt))
  const desc = prompt.replace(INTENTS.newTicket, '').replace(unit ? new RegExp(unit.code, 'i') : /$^/, '').replace(/(للوحدة|في الوحدة|الوحدة|لوحدة|for unit|unit|for)\s*/gi, '').replace(/^[\s:،,.\-–]+|[\s:،,.\-–]+$/g, '')
  if (!unit || desc.length < 3) return lang === 'ar'
    ? 'اذكر رمز الوحدة ووصف البلاغ، مثل: أضف بلاغ للوحدة A-101: باب الكراج لا يفتح'
    : 'Give the unit code and the request, e.g. Add ticket for unit A-101: garage door will not open'
  const r = exec('create_ticket', { unit_code: unit.code, description: desc })
  if (r.error) return `⚠ ${r.error}`
  await sleep(300)
  const rest = await maintenance('triage', lang, exec, getState)
  return (lang === 'ar' ? `سُجّل البلاغ ${r.ticket_id} للوحدة ${r.unit}.` : `Logged ${r.ticket_id} for unit ${r.unit}.`) + '\n\n' + rest
}

async function closeTicket(prompt, lang, exec) {
  const r = exec('complete_ticket', { ticket_id: prompt.match(/M-\d+/i)[0].toUpperCase() })
  if (r.error) return `⚠ ${r.error}`
  return lang === 'ar' ? `أُغلق البلاغ ${r.ticket_id}، وقُيّدت تكلفته ${sar(r.cost_sar)} في الدفتر: مدين مصروف الصيانة / دائن البنك.` : `Closed ${r.ticket_id} and posted its cost of ${sar(r.cost_sar)}: Dr Maintenance expense / Cr Bank.`
}

async function terminate(prompt, lang, exec) {
  const days = Number((prompt.match(/(\d+)\s*(يوم|day)/i) || [])[1]) || 30
  const r = exec('propose_early_termination', { contract_id: prompt.match(/C-\d+/i)[0].toUpperCase(), termination_date: d(days), reason: lang === 'ar' ? 'بطلب من الإدارة' : 'Requested by management' })
  if (r.error) return `⚠ ${r.error}`
  return lang === 'ar'
    ? `جهّزت طلب الإنهاء المبكر وهو بانتظار اعتمادك.\nالمستحق قبل الإخلاء: ${sar(r.due_before_moveout_sar)}. فواتير لاحقة تُلغى: ${r.invoices_to_cancel}.`
    : `Early termination prepared and awaiting your approval.\nDue before move-out: ${sar(r.due_before_moveout_sar)}. Later invoices cancelled: ${r.invoices_to_cancel}.`
}

async function payment(prompt, lang, exec) {
  const idm = prompt.match(/INV-\d+/i)
  if (!idm) return lang === 'ar' ? 'حدّد رقم الفاتورة، مثل INV-2205.' : 'Please give the invoice number, e.g. INV-2205.'
  const r = exec('record_payment', { invoice_id: idm[0].toUpperCase() })
  if (r.error) return `⚠ ${r.error}`
  return lang === 'ar'
    ? `سُجّلت دفعة ${sar(r.amount_sar)} للفاتورة ${r.invoice}، وقُيّد القيد: مدين البنك / دائن ذمم المستأجرين.`
    : `Recorded ${sar(r.amount_sar)} against ${r.invoice} and posted Dr Bank / Cr Tenant receivables.`
}

async function renewals(prompt, lang, exec, getState) {
  const list = exec('list_contracts', { expiring_within_days: 90 })
  await sleep(300)
  if (!/اقترح|جهّز|propose|draft|renew/i.test(prompt) && !INTENTS.daily.test(prompt)) {
    const soon = exec('list_contracts', {}).filter((c) => c.days_to_end <= 90 && c.status !== 'terminated').sort((a, b) => a.days_to_end - b.days_to_end)
    if (!soon.length) return lang === 'ar' ? 'لا توجد عقود تنتهي خلال 90 يوماً.' : 'No contracts end within 90 days.'
    return (lang === 'ar' ? `عقود تنتهي خلال 90 يوماً (${soon.length}):` : `Contracts ending within 90 days (${soon.length}):`) + '\n' + soon.map((c) => `${c.id} · ${c.tenant} · ${c.unit} · ${c.days_to_end}${lang === 'ar' ? ' يوماً' : 'd'}${c.status === 'renewal_pending' ? (lang === 'ar' ? ' · تجديد بانتظار الاعتماد' : ' · renewal awaiting approval') : ''}`).join('\n')
  }
  const out = []
  for (const c of list.filter((x) => x.status === 'active')) {
    const late = getState().invoices.filter((i) => i.contractId === c.id && i.status === 'overdue').length
    const note = lang === 'ar'
      ? `الإيجار دون تغيير وفق قرار إيقاف الزيادة في الرياض.${late ? ` تنبيه: لدى المستأجر ${late} دفعة متأخرة.` : ' سجل السداد منتظم.'}`
      : `Rent unchanged under the Riyadh rent freeze.${late ? ` Note: tenant has ${late} overdue payment.` : ' Payment history is clean.'}`
    const r = exec('propose_renewal', { contract_id: c.id, annual_rent: c.annual_rent_sar, note })
    if (!r.error) out.push(`${c.id} · ${c.tenant} · ${sar(c.annual_rent_sar)}${late ? ' ⚑' : ''}`)
    await sleep(250)
  }
  if (!out.length) return lang === 'ar' ? 'لا توجد عقود تحتاج تجديداً خلال 90 يوماً.' : 'No contracts need renewal in the next 90 days.'
  return lang === 'ar'
    ? `${out.length} عقود تنتهي خلال 90 يوماً. أعددت مقترحات التجديد لمدة 12 شهراً بالإيجار الحالي، وهي بانتظار اعتمادك:\n${out.join('\n')}\n⚑ مستأجر لديه متأخرات، يُنصح بمراجعته قبل الاعتماد.`
    : `${out.length} contracts end within 90 days. I prepared 12-month renewals at the current rent, awaiting your approval:\n${out.join('\n')}\n⚑ Tenant has arrears; review before approving.`
}

const RULES = [
  [/مكيف|تكييف|يبرد|\bac\b|cool/i, 'hvac'],
  [/تسرب|ماء|مغسلة|leak|water|sink/i, 'plumbing'],
  [/إنارة|كهرب|light|electric|power/i, 'electrical'],
  [/مصعد|elevator|lift/i, 'elevator'],
]

async function maintenance(prompt, lang, exec, getState) {
  const fresh = exec('list_tickets', { status: 'new' })
  await sleep(300)
  if (/ما |which|what/i.test(prompt) && !/صنّف|صنف|triage|assign|أسند/i.test(prompt)) {
    const urgent = getState().tickets.filter((t) => t.priority === 'urgent' || t.status === 'new')
    return urgent.map((t) => `${t.id} · ${t.text[lang]}`).join('\n')
  }
  const out = []
  let queued = 0
  for (const t of fresh.filter((x) => !x.awaiting_quote_approval)) {
    const raw = getState().tickets.find((x) => x.id === t.id)
    const text = raw.text.ar + ' ' + raw.text.en
    const category = (RULES.find(([re]) => re.test(text)) || [, 'general'])[1]
    const residential = find.prop(getState(), find.unit(getState(), raw.unitId).propertyId).kind === 'residential'
    const priority = category === 'plumbing' && /مبلل|wet|flood/i.test(text) ? 'urgent' : category === 'hvac' && residential ? 'urgent' : category === 'plumbing' ? 'high' : category === 'electrical' ? 'medium' : 'low'
    const tri = exec('triage_ticket', { ticket_id: t.id, category, priority, reason: category })
    await sleep(200)
    const { quotes = [] } = exec('request_quotes', { ticket_id: t.id })
    const best = [...quotes].sort((a, b) => priority === 'urgent' ? a.eta_hours - b.eta_hours || a.amount_sar - b.amount_sar : a.amount_sar - b.amount_sar || b.rating - a.rating)[0]
    await sleep(200)
    if (best) {
      const r = exec('assign_vendor', { ticket_id: t.id, vendor_id: best.vendor_id })
      if (r.queued_for_approval) queued++
      out.push(`${t.id} · ${L.pri[lang][priority]} (${tri.sla_hours}${lang === 'ar' ? ' س' : 'h'}) → ${best.vendor} · ${sar(best.amount_sar)}${r.queued_for_approval ? ' ⚑' : ''}`)
    }
    await sleep(200)
  }
  if (!out.length) return lang === 'ar' ? 'لا توجد بلاغات جديدة.' : 'No new tickets.'
  return lang === 'ar'
    ? `صنّفت البلاغات الجديدة (${out.length})، وطلبت عروض الأسعار، واخترت المقاول الأنسب حسب السعر وسرعة الوصول:\n${out.join('\n')}${queued ? `\n⚑ عروض تتجاوز حد الصرف التلقائي وتنتظر اعتمادك: ${queued}.` : ''}`
    : `Triaged new tickets (${out.length}), requested quotes and picked the best vendor by price and arrival time:\n${out.join('\n')}${queued ? `\n⚑ Quotes above the auto-approve limit, awaiting your approval: ${queued}.` : ''}`
}

async function leasing(prompt, lang, exec, getState) {
  const one = prompt.match(/L-\d+/i)
  if (one) {
    const m = exec('match_units', { lead_id: one[0].toUpperCase() })
    if (m.error) return `⚠ ${m.error}`
    return m.map((u) => `${u.unit} · ${u.bedrooms || '-'} · ${u.area_m2} m² · ${sar(u.annual_rent_sar)}`).join('\n') || '—'
  }
  if (ASKS.test(prompt) && /شاغر|vacant/i.test(prompt)) {
    const v = getState().units.filter((u) => u.status === 'vacant')
    return (lang === 'ar' ? `الوحدات الشاغرة (${v.length})، بآخر إيجار مسجّل:` : `Vacant units (${v.length}), at the last registered rent:`) + '\n' + v.map((u) => `${u.code} · ${find.prop(getState(), u.propertyId).name[lang]} · ${u.area} m² · ${sar(u.rent)}`).join('\n')
  }
  const leads = exec('list_leads', { status: 'new' })
  await sleep(300)
  const out = []
  let slot = getState().leads.filter((x) => x.viewing).length
  for (const l of leads) {
    const matches = exec('match_units', { lead_id: l.id })
    await sleep(200)
    const fit = matches.find((u) => u.within_budget) || matches[0]
    const score = Math.min(95, 50 + (fit ? 25 : 0) + (fit?.within_budget ? 10 : 0) + (l.source === 'referral' ? 10 : l.source === 'website' ? 5 : 3))
    exec('qualify_lead', { lead_id: l.id, score, reason: fit ? 'match' : 'no match' })
    await sleep(200)
    if (fit) {
      const when = `${d(1 + Math.floor(slot / 2))} ${slot % 2 ? '18:30' : '17:00'}`
      slot++
      exec('schedule_viewing', { lead_id: l.id, unit_id: fit.unit_id, datetime: when })
      out.push(`${l.name} · ${score}/100 → ${fit.unit} · ${when}`)
    } else out.push(`${l.name} · ${score}/100 · ${lang === 'ar' ? 'لا توجد وحدة شاغرة مناسبة حالياً' : 'no suitable vacant unit yet'}`)
    await sleep(200)
  }
  if (!out.length) return lang === 'ar' ? 'جميع العملاء الحاليين مؤهَّلون، ولا يوجد عميل جديد.\nأضف عميلاً بشروطه من زر «إضافة عميل» في صفحة التأجير، وسأؤهّله وأحجز له معاينة.' : 'All current leads are already qualified; there is no new lead.\nAdd a lead with their requirements from “Add lead” on the Leasing page and I will qualify them and book a viewing.'
  return lang === 'ar'
    ? `أهّلت العملاء الجدد (${leads.length}) وطابقتهم مع الوحدات الشاغرة (بآخر إيجار مسجّل في إيجار):\n${out.join('\n')}`
    : `Qualified new leads (${leads.length}) and matched them to vacant units (at the last registered Ejar rent):\n${out.join('\n')}`
}

async function summary(lang, exec) {
  const s = exec('get_portfolio_summary', {})
  return lang === 'ar'
    ? `الإشغال ${s.occupancy_pct}% (${s.occupied} من ${s.units} وحدة).\nمتأخرات: ${s.overdue_invoices} فواتير بإجمالي ${sar(s.overdue_sar)}.\nعقود تنتهي خلال 90 يوماً: ${s.contracts_expiring_90d}.\nبلاغات صيانة جديدة: ${s.new_tickets}. عملاء جدد: ${s.new_leads}.\nطلبات بانتظار اعتمادك: ${s.pending_approvals}.\nأقترح البدء بالمتأخرات ثم البلاغات العاجلة.`
    : `Occupancy ${s.occupancy_pct}% (${s.occupied} of ${s.units} units).\nOverdue: ${s.overdue_invoices} invoices, ${sar(s.overdue_sar)}.\nContracts ending in 90 days: ${s.contracts_expiring_90d}.\nNew maintenance tickets: ${s.new_tickets}. New leads: ${s.new_leads}.\nAwaiting your approval: ${s.pending_approvals}.\nI suggest starting with overdue rent, then urgent tickets.`
}

export async function localAgent(prompt, lang, exec, getState) {
  LANG = lang
  await sleep(400)
  if (has(prompt, INTENTS.daily)) {
    const parts = [await collections(lang, exec, ''), await renewals(prompt, lang, exec, getState), await maintenance('triage', lang, exec, getState), await leasing('', lang, exec, getState)]
    return parts.join('\n\n')
  }
  if (has(prompt, INTENTS.newTicket)) return newTicket(prompt, lang, exec, getState)
  if (has(prompt, INTENTS.closeTicket)) return closeTicket(prompt, lang, exec)
  if (has(prompt, INTENTS.terminate)) return terminate(prompt, lang, exec)
  if (has(prompt, INTENTS.payment)) return payment(prompt, lang, exec)
  if (has(prompt, INTENTS.collections)) return collections(lang, exec, prompt)
  if (has(prompt, INTENTS.maintenance)) return maintenance(prompt, lang, exec, getState)
  if (has(prompt, INTENTS.leasing)) return leasing(prompt, lang, exec, getState)
  if (has(prompt, INTENTS.renewals)) return renewals(prompt, lang, exec, getState)
  return summary(lang, exec)
}

// Pattern-based reader for the no-key mode. Handles common lease wording; the LLM handles everything else.
export function localExtract(text) {
  const g = (re) => (text.match(re) || [])[1]?.trim()
  const dates = text.match(/\d{4}-\d{2}-\d{2}/g) || []
  const money = (s) => (s ? Number(s.replace(/,/g, '')) : null)
  const inc = g(/(?:زيادة الإيجار|increase[^.\n]*?)\s*(?:بنسبة)?\s*(\d+\s*%)/i)
  const sched = /ربع سنوي|quarter/i.test(text) ? 'quarterly' : /شهري|month/i.test(text) ? 'monthly' : /نصف/i.test(text) ? 'semiannual' : 'annual'
  const ejar = g(/(?:رقم (?:عقد )?إيجار|ejar (?:no\.?|number))\s*:?\s*(\d{6,})/i) || null
  const clauses = text.split(/[\n.]/).map((x) => x.trim()).filter((x) => /يلتزم|لا يحق|يُعاد|shall|must not/i.test(x) && x.length < 120).slice(0, 4)
  return {
    tenant_name: g(/المستأجر\)?\s*:\s*([^.\n]+)/) || g(/tenant\)?\s*:\s*([^.\n]+)/i) || null,
    unit_code: g(/\b([A-Z]-\d{2,4})\b/) || null,
    start: dates[0] || null, end: dates[1] || null,
    annual_rent: money(g(/الإيجار السنوية?\s*:\s*([\d,]+)/) || g(/annual rent\s*:?\s*([\d,]+)/i)),
    payment_schedule: sched,
    deposit: money(g(/التأمين\s*:\s*([\d,]+)/) || g(/deposit\s*:?\s*([\d,]+)/i)),
    ejar_number: ejar,
    special_terms: clauses,
    risks: [inc ? `بند زيادة ${inc} يتعارض مع إيقاف الزيادة في الرياض` : null, ejar ? null : 'رقم عقد إيجار غير مذكور في المستند'].filter(Boolean),
  }
}
