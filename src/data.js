// Fictional demo data. Dates are relative to today so the demo always looks current.
const DAY = 86400000
// All timestamps are local wall-clock strings (no zone suffix), so they read correctly in the user's timezone.
const iso = (ms) => new Date(ms - new Date().getTimezoneOffset() * 60000).toISOString()
export const today = () => iso(Date.now()).slice(0, 10)
export const nowLocal = () => iso(Date.now()).slice(0, 16)
export const d = (offset) => iso(Date.now() + offset * DAY).slice(0, 10)
export const daysUntil = (date) => Math.round((new Date(date) - new Date(today())) / DAY)
export const hoursAgo = (h) => iso(Date.now() - h * 3600000).slice(0, 16)
export const VAT_RATE = 0.15            // commercial rent only; residential rent is exempt
export const QUOTE_LIMIT = 500          // SAR; vendor quotes above this need manager approval
export const SLA_HOURS = { urgent: 4, high: 24, medium: 48, low: 72 }
export const total = (i) => i.amount + (i.vat || 0)

const properties = [
  { id: 'P1', name: { ar: 'مجمع النخيل السكني', en: 'Al Nakheel Residences' }, district: { ar: 'حي النخيل', en: 'Al Nakheel' }, kind: 'residential' },
  { id: 'P2', name: { ar: 'أبراج الياسمين', en: 'Al Yasmin Towers' }, district: { ar: 'حي الياسمين', en: 'Al Yasmin' }, kind: 'residential' },
  { id: 'P3', name: { ar: 'مكاتب حطين', en: 'Hittin Offices' }, district: { ar: 'حي حطين', en: 'Hittin' }, kind: 'commercial' },
  { id: 'P4', name: { ar: 'مركز الملقا التجاري', en: 'Al Malqa Retail Centre' }, district: { ar: 'حي الملقا', en: 'Al Malqa' }, kind: 'commercial' },
]

const u = (id, propertyId, code, type, beds, area, rent, status) => ({ id, propertyId, code, type, beds, area, rent, status })
const units = [
  u('U101', 'P1', 'A-101', 'apartment', 3, 165, 72000, 'occupied'),
  u('U102', 'P1', 'A-102', 'apartment', 2, 120, 54000, 'occupied'),
  u('U103', 'P1', 'A-203', 'apartment', 3, 170, 75000, 'vacant'),
  u('U104', 'P1', 'A-204', 'apartment', 2, 118, 52000, 'vacant'),
  u('U201', 'P2', 'B-501', 'apartment', 4, 240, 110000, 'occupied'),
  u('U202', 'P2', 'B-702', 'apartment', 3, 190, 88000, 'occupied'),
  u('U203', 'P2', 'B-905', 'apartment', 2, 130, 65000, 'vacant'),
  u('U301', 'P3', 'O-12', 'office', 0, 220, 160000, 'occupied'),
  u('U302', 'P3', 'O-14', 'office', 0, 140, 105000, 'occupied'),
  u('U303', 'P3', 'O-21', 'office', 0, 95, 72000, 'vacant'),
  u('U401', 'P4', 'S-03', 'shop', 0, 80, 96000, 'occupied'),
  u('U402', 'P4', 'S-07', 'shop', 0, 60, 78000, 'occupied'),
]

const tenants = [
  { id: 'T1', name: { ar: 'عبدالله القحطاني', en: 'Abdullah Al-Qahtani' }, phone: '+966 50 123 4471' },
  { id: 'T2', name: { ar: 'نورة العتيبي', en: 'Noura Al-Otaibi' }, phone: '+966 55 902 1183' },
  { id: 'T3', name: { ar: 'فهد الدوسري', en: 'Fahad Al-Dosari' }, phone: '+966 54 330 7720' },
  { id: 'T4', name: { ar: 'سارة الشهري', en: 'Sarah Al-Shehri' }, phone: '+966 56 418 2290' },
  { id: 'T5', name: { ar: 'شركة مدار للاستشارات', en: 'Madar Consulting Co.' }, phone: '+966 11 455 0912' },
  { id: 'T6', name: { ar: 'شركة رواسي التقنية', en: 'Rawasi Tech Co.' }, phone: '+966 11 488 3301' },
  { id: 'T7', name: { ar: 'مقهى سنبلة', en: 'Sunbula Café' }, phone: '+966 53 771 0045' },
  { id: 'T8', name: { ar: 'صيدلية الريحان', en: 'Al Raihan Pharmacy' }, phone: '+966 58 220 6631' },
]

const c = (id, unitId, tenantId, start, end, annualRent, schedule, ejar) => ({ id, unitId, tenantId, start, end, annualRent, schedule, ejar, status: 'active' })
const contracts = [
  c('C-1041', 'U101', 'T1', d(-330), d(35), 72000, 'quarterly', '10294817731'),
  c('C-1042', 'U102', 'T2', d(-200), d(165), 54000, 'quarterly', '10294822904'),
  c('C-1043', 'U201', 'T3', d(-305), d(60), 110000, 'semiannual', '10295004118'),
  c('C-1044', 'U202', 'T4', d(-90), d(275), 88000, 'quarterly', '10295100276'),
  c('C-1045', 'U301', 'T5', d(-520), d(210), 160000, 'quarterly', '10293877510'),
  c('C-1046', 'U302', 'T6', d(-280), d(85), 105000, 'quarterly', '10294410662'),
  c('C-1047', 'U401', 'T7', d(-150), d(215), 96000, 'monthly', '10295233891'),
  c('C-1048', 'U402', 'T8', d(-410), d(320), 78000, 'quarterly', '10294015327'),
]

const inv = (id, contractId, due, amount, status, reminders = 0) => ({ id, contractId, due, amount, status, reminders, paidOn: status === 'paid' ? due : null })
const invoices = [
  inv('INV-2201', 'C-1041', d(-60), 18000, 'paid'),
  inv('INV-2202', 'C-1041', d(-12), 18000, 'overdue', 1),
  inv('INV-2203', 'C-1042', d(-20), 13500, 'paid'),
  inv('INV-2204', 'C-1043', d(-31), 55000, 'overdue', 2),
  inv('INV-2205', 'C-1044', d(-5), 22000, 'overdue'),
  inv('INV-2206', 'C-1045', d(-40), 40000, 'paid'),
  inv('INV-2207', 'C-1045', d(50), 40000, 'due'),
  inv('INV-2208', 'C-1046', d(-3), 26250, 'paid'),
  inv('INV-2209', 'C-1047', d(-8), 8000, 'overdue'),
  inv('INV-2210', 'C-1047', d(22), 8000, 'due'),
  inv('INV-2211', 'C-1048', d(9), 19500, 'due'),
  inv('INV-2212', 'C-1042', d(70), 13500, 'due'),
]

const vendors = [
  { id: 'V1', name: { ar: 'مؤسسة برودة للتكييف', en: 'Buroda HVAC' }, trade: 'hvac', rating: 4.7, open: 1 },
  { id: 'V2', name: { ar: 'سباكة الرياض المتقدمة', en: 'Riyadh Advanced Plumbing' }, trade: 'plumbing', rating: 4.5, open: 0 },
  { id: 'V3', name: { ar: 'نور للخدمات الكهربائية', en: 'Noor Electrical Services' }, trade: 'electrical', rating: 4.8, open: 2 },
  { id: 'V4', name: { ar: 'مصاعد الأفق', en: 'Al Ufuq Elevators' }, trade: 'elevator', rating: 4.6, open: 0 },
  { id: 'V5', name: { ar: 'إتقان للصيانة العامة', en: 'Itqan General Maintenance' }, trade: 'general', rating: 4.3, open: 1 },
  { id: 'V6', name: { ar: 'تبريد الخليج', en: 'Gulf Cooling' }, trade: 'hvac', rating: 4.4, open: 3 },
]

const tk = (id, unitId, text, createdAt, extra = {}) => ({ id, unitId, text, createdAt, category: null, priority: null, sla: null, status: 'new', vendorId: null, quotes: [], cost: null, respondedAt: null, ...extra })
const tickets = () => [
  tk('M-311', 'U202', { ar: 'المكيف في غرفة النوم الرئيسية لا يبرد ويصدر صوتاً عالياً منذ أمس.', en: 'The master bedroom AC is not cooling and has been making a loud noise since yesterday.' }, hoursAgo(2)),
  tk('M-312', 'U101', { ar: 'يوجد تسرب ماء تحت مغسلة المطبخ والأرضية مبللة.', en: 'Water is leaking under the kitchen sink and the floor is wet.' }, hoursAgo(1)),
  tk('M-313', 'U401', { ar: 'إنارة واجهة المحل لا تعمل.', en: 'The shop front lighting is not working.' }, hoursAgo(20)),
  tk('M-308', 'U301', { ar: 'صيانة دورية للمصعد رقم 2.', en: 'Routine service for elevator 2.' }, hoursAgo(150), { category: 'elevator', priority: 'low', sla: 72, status: 'assigned', vendorId: 'V4', cost: 1200, respondedAt: hoursAgo(144) }),
  tk('M-305', 'U102', { ar: 'استبدال مقبض باب الحمام.', en: 'Replace bathroom door handle.' }, hoursAgo(220), { category: 'general', priority: 'low', sla: 72, status: 'done', vendorId: 'V5', cost: 150, respondedAt: hoursAgo(200) }),
]

const ld = (id, name, phone, need, source, created, extra = {}) => ({ id, name, phone, need, source, created, score: null, status: 'new', viewing: null, unitId: null, ...extra })
const leads = [
  ld('L-71', { ar: 'خالد المطيري', en: 'Khalid Al-Mutairi' }, '+966 50 667 1290', { type: 'apartment', beds: 3, budget: 80000, note: { ar: 'عائلة من خمسة أفراد، يفضل شمال الرياض', en: 'Family of five, prefers north Riyadh' } }, 'website', d(0)),
  ld('L-72', { ar: 'شركة سحاب الرقمية', en: 'Sahab Digital Co.' }, '+966 11 470 2281', { type: 'office', beds: 0, budget: 80000, note: { ar: 'فريق من 12 موظفاً، يحتاج مكتباً جاهزاً', en: 'Team of 12, needs a ready office' } }, 'whatsapp', d(-1)),
  ld('L-73', { ar: 'ريم الحربي', en: 'Reem Al-Harbi' }, '+966 55 310 8847', { type: 'apartment', beds: 2, budget: 55000, note: { ar: 'موظفة، تحتاج الانتقال خلال شهر', en: 'Professional, needs to move within a month' } }, 'website', d(-1)),
  ld('L-69', { ar: 'ماجد الزهراني', en: 'Majed Al-Zahrani' }, '+966 54 902 7713', { type: 'apartment', beds: 2, budget: 70000, note: { ar: 'زوجان', en: 'Couple' } }, 'referral', d(-4), { score: 82, status: 'viewing', unitId: 'U203', viewing: d(1) + ' 17:00' }),
]

const activity = [
  { id: 'A3', ts: d(-1) + 'T09:12', module: 'collections', status: 'done', text: { ar: 'أُرسل تذكير ثانٍ لفاتورة INV-2204', en: 'Second reminder sent for INV-2204' } },
  { id: 'A2', ts: d(-3) + 'T14:40', module: 'collections', status: 'done', text: { ar: 'سُجّل تحصيل INV-2208 وقُيّد في الدفتر', en: 'INV-2208 payment recorded and posted to the ledger' } },
  { id: 'A1', ts: d(-6) + 'T10:05', module: 'maintenance', status: 'done', text: { ar: 'أُسند البلاغ M-308 إلى مصاعد الأفق', en: 'M-308 assigned to Al Ufuq Elevators' } },
]

export function seed() {
  const kind = (inv) => { const c = contracts.find((x) => x.id === inv.contractId); return properties.find((p) => p.id === units.find((u) => u.id === c.unitId).propertyId).kind }
  const invs = invoices.map((i) => ({ ...i, vat: kind(i) === 'commercial' ? Math.round(i.amount * VAT_RATE) : 0 }))
  const billed = invs.filter((i) => daysUntil(i.due) <= 0)
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0)
  const ledger = [
    ...invs.filter((i) => i.status === 'paid').map((i) => ({ date: i.due, desc: { ar: `تحصيل ${i.id}`, en: `Collection ${i.id}` }, debit: 'bank', credit: 'receivables', amount: total(i) })),
    { date: d(-14), desc: { ar: 'صيانة مصاعد – مكاتب حطين', en: 'Elevator service – Hittin Offices' }, debit: 'maintenance', credit: 'bank', amount: 4200 },
    { date: d(-8), desc: { ar: 'تكلفة البلاغ M-305', en: 'Ticket M-305 cost' }, debit: 'maintenance', credit: 'bank', amount: 150 },
    { date: d(-90), desc: { ar: 'إثبات ضريبة القيمة المضافة على الإيجارات التجارية', en: 'VAT on commercial rent billed' }, debit: 'receivables', credit: 'vat', amount: sum(billed, (i) => i.vat) },
    { date: d(-90), desc: { ar: 'إثبات إيجارات الفترة', en: 'Rent billed for the period' }, debit: 'receivables', credit: 'income', amount: sum(billed, (i) => i.amount) },
  ].sort((a, b) => b.date.localeCompare(a.date)).map((j, n, all) => ({ id: `J-${500 + all.length - n}`, ...j }))
  return structuredClone({ properties, units, tenants, contracts, invoices: invs, ledger, vendors, tickets: tickets(), leads, activity, approvals: [] })
}
