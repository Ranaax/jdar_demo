export const T = {
  ar: {
    brand: 'جدار', product: 'إدارة الأملاك',
    nav: { overview: 'نظرة عامة', contracts: 'العقود', collections: 'التحصيل والمحاسبة', maintenance: 'الصيانة', leasing: 'التأجير' },
    agent: 'وكيل جدار', agentSub: 'يقرأ البيانات وينفّذ المهام ويطلب موافقتك قبل أي إجراء حساس',
    llm: 'نموذج لغوي مباشر', local: 'وضع العرض المحلي',
    ask: 'اطلب من الوكيل…', send: 'إرسال', thinking: 'يعمل الوكيل', you: 'أنت',
    reset: 'إعادة ضبط العرض', resetConfirm: 'تأكيد إعادة الضبط', resetDone: 'أُعيدت البيانات التجريبية', close: 'إغلاق', none: 'لا يوجد شيء هنا', lang: 'English',
    approvals: 'بانتظار موافقتك', noApprovals: 'لا توجد طلبات معلّقة', approve: 'اعتماد', decline: 'رفض',
    activity: 'نشاط الوكيل', runDaily: 'تشغيل العمليات اليومية', dailyTitle: 'العمليات اليومية بضغطة واحدة', dailyDesc: 'يمرّ الوكيل على المحاور الأربعة ويجهّز العمل، ولا يُرسل شيئاً قبل اعتمادك.', dailySteps: ['يصوغ تذكيرات الفواتير المتأخرة', 'يقترح تجديد العقود القريبة من الانتهاء', 'يصنّف البلاغات ويسندها للمقاولين', 'يؤهّل العملاء الجدد ويحجز المعاينات'], suggestions: 'اقتراحات',
    occHint: 'الوحدات المؤجَّرة من إجمالي الوحدات',
    kpi: { occupancy: 'نسبة الإشغال', collected: 'المحصّل خلال 30 يوماً', overdue: 'متأخرات', tickets: 'بلاغات مفتوحة', leads: 'عملاء جدد', expiring: 'عقود تنتهي خلال 90 يوماً' },
    units: 'وحدة', of: 'من',
    overview: { attention: 'يحتاج انتباهك اليوم', overdue: 'فواتير متأخرة', oldest: 'أقدمها منذ', expiring: 'عقود تنتهي خلال 90 يوماً', nearest: 'أقربها بعد', tickets: 'بلاغات صيانة جديدة', ticketsHint: 'لم تُصنّف ولم تُسند بعد', leads: 'عملاء جدد', vacant: 'وحدات شاغرة', noApprovals: 'لا توجد طلبات معلّقة. عند تشغيل الوكيل يظهر هنا كل ما يحتاج قرارك.' },
    caps: 'ما يستطيع الوكيل تنفيذه',
    runAgent: 'تشغيل الوكيل',
    contracts: { title: 'العقود', sub: 'عقود الإيجار المسجّلة في إيجار، والتجديدات المقترحة', tenant: 'المستأجر', unit: 'الوحدة', rent: 'الإيجار السنوي', end: 'تاريخ الانتهاء', ejar: 'رقم إيجار', daysLeft: 'يوماً متبقياً', ended: 'منتهٍ',
      status: { active: 'ساري', renewal_pending: 'تجديد بانتظار الموافقة', termination_pending: 'إنهاء بانتظار الموافقة', terminated: 'أُنهي مبكراً', expiring: 'ينتهي قريباً' }, renewed: 'مُجدّد',
      create: 'إنشاء عقد', tabPdf: 'رفع ملف PDF', tabText: 'لصق النص', choosePdf: 'اختر ملف PDF', pdfHint: 'يقرأ الوكيل الملف ويستخرج البنود. الحد الأقصى 3 م.ب.', doc: 'المستند',
      terminate: 'إنهاء مبكر', termDate: 'تاريخ الإنهاء', termReason: 'السبب', termSend: 'إرسال للاعتماد', cancel: 'إلغاء',
      err: { pdf_scanned: 'الملف ممسوح ضوئياً ولا يحتوي نصاً. قراءته تتطلب تفعيل النموذج اللغوي.', pdf_unreadable: 'تعذّرت قراءة الملف.', pdf_too_large: 'حجم الملف يتجاوز 3 م.ب.', other: 'تعذّر الاستخراج. حاول مرة أخرى.' },
      localNote: 'وضع العرض المحلي يتعرّف على الصياغات الشائعة فقط. راجع البنود قبل الإرسال.',
      agentBtn: 'اقتراح التجديدات', freeze: 'يلتزم الوكيل بقرار إيقاف الزيادة السنوية للإيجارات في الرياض لمدة خمس سنوات: تبقى قيمة الإيجار عند التجديد كما هي.',
      extractTitle: 'إنشاء عقد من مستند', extractSub: 'ارفع العقد بصيغة PDF أو الصق نصه، ليستخرج الوكيل البنود ويُنبّه إلى ما يستحق المراجعة.', extract: 'استخراج البنود', useSample: 'استخدام عقد تجريبي',
      createDraft: 'إرسال العقد للاعتماد', risks: 'بنود تستحق المراجعة', special: 'شروط خاصة', fields: { tenant_name: 'المستأجر', unit_code: 'الوحدة', start: 'البداية', end: 'النهاية', annual_rent: 'الإيجار السنوي', payment_schedule: 'جدول الدفع', deposit: 'التأمين', ejar_number: 'رقم إيجار' } },
    collections: { title: 'التحصيل والمحاسبة', sub: 'الفواتير والتذكيرات وقيود الدفتر العام', invoice: 'الفاتورة', due: 'الاستحقاق', amount: 'المبلغ', reminders: 'تذكيرات', record: 'تسجيل دفعة', outstanding: 'إجمالي المستحق', rate: 'نسبة التحصيل', ledger: 'دفتر اليومية', balances: 'الأرصدة', agentBtn: 'متابعة المتأخرات', daysLate: 'يوم تأخير',
      status: { paid: 'مدفوعة', due: 'مستحقة', overdue: 'متأخرة' }, acct: { bank: 'البنك', receivables: 'ذمم المستأجرين', maintenance: 'مصروف الصيانة', income: 'إيرادات الإيجار', vat: 'ضريبة القيمة المضافة المستحقة' }, vat: 'ضريبة 15%', inclVat: 'شامل الضريبة', exempt: 'سكني · معفى', aging: 'أعمار المتأخرات', days: 'يوماً', vatNote: 'تُضاف ضريبة القيمة المضافة 15% إلى الإيجارات التجارية. الإيجار السكني معفى.', dr: 'مدين', cr: 'دائن' },
    maintenance: { title: 'الصيانة', sub: 'بلاغات المستأجرين وتوزيعها على المقاولين', cols: { new: 'جديدة', assigned: 'قيد التنفيذ', done: 'مكتملة' }, untriaged: 'لم تُصنّف بعد', vendors: 'المقاولون', open: 'أعمال مفتوحة', agentBtn: 'تصنيف البلاغات وإسنادها', add: 'إضافة بلاغ', unit: 'الوحدة', desc: 'وصف البلاغ كما ورد من المستأجر', save: 'حفظ البلاغ', cancel: 'إلغاء', sla: 'الاستجابة خلال', h: 'س', left: 'متبقٍ', breached: 'تجاوز المدة', met: 'ضمن المدة', quotes: 'عروض الأسعار', cost: 'التكلفة', eta: 'الوصول خلال', quotePending: 'عرض بانتظار الاعتماد', complete: 'تم الإنجاز', limitNote: 'العروض حتى 500 ر.س تُعتمد تلقائياً، وما زاد يحتاج موافقتك. عند الإنجاز تُقيّد التكلفة في الدفتر.' },
    leasing: { title: 'التأجير', sub: 'العملاء المحتملون والمعاينات والوحدات الشاغرة', cols: { new: 'جدد', qualified: 'مؤهَّلون', viewing: 'معاينة محجوزة' }, budget: 'الميزانية', vacant: 'الوحدات الشاغرة', lastEjar: 'آخر إيجار مسجّل', agentBtn: 'تأهيل العملاء وحجز المعاينات', beds: 'غرف', m2: 'م²', viewing: 'المعاينة',
      type: { apartment: 'شقة', office: 'مكتب', shop: 'محل' }, source: { website: 'الموقع', whatsapp: 'واتساب', referral: 'إحالة', manual: 'إدخال يدوي' },
      add: 'إضافة عميل', addTitle: 'عميل جديد وشروطه', name: 'اسم العميل', phone: 'رقم الجوال (اختياري)', wants: 'نوع الوحدة', bedsWanted: 'عدد الغرف', budgetYear: 'الميزانية السنوية (ر.س)', notes: 'شروط أخرى (الحي، موعد الانتقال، …)', saveRun: 'حفظ وتأهيل', saveOnly: 'حفظ فقط', cancel: 'إلغاء', addHint: 'يطابق الوكيل شروط العميل مع الوحدات الشاغرة، ويقيّمه، ويحجز له معاينة.' },
    sched: { monthly: 'شهري', quarterly: 'ربع سنوي', semiannual: 'نصف سنوي', annual: 'سنوي' },
    prompts: {
      overview: ['ما أهم ما يحتاج انتباهي اليوم؟', 'شغّل العمليات اليومية كاملة', 'ما إجمالي المتأخرات؟', 'ما الوحدات الشاغرة؟'],
      contracts: ['اقترح تجديد العقود التي تنتهي خلال 90 يوماً', 'ما العقود التي تنتهي قريباً؟', 'أنهِ العقد C-1044 مبكراً بعد 30 يوماً'],
      collections: ['جهّز تذكيرات للفواتير المتأخرة', 'ما إجمالي المتأخرات؟', 'سجّل دفعة الفاتورة INV-2205'],
      maintenance: ['صنّف البلاغات الجديدة وأسندها للمقاولين', 'أضف بلاغ للوحدة A-102: الباب الرئيسي لا يُقفل', 'ما البلاغات العاجلة؟', 'أغلق البلاغ M-308'],
      leasing: ['أهّل العملاء الجدد واحجز معاينات', 'ما الوحدات المناسبة للعميل L-71؟', 'ما الوحدات الشاغرة؟'],
    },

    daily: 'شغّل العمليات اليومية كاملة: المتأخرات، والتجديدات، والصيانة، والعملاء الجدد.',
    tools: { get_portfolio_summary: 'قراءة ملخص المحفظة', list_invoices: 'قراءة الفواتير', draft_payment_reminder: 'صياغة تذكير', record_payment: 'تسجيل دفعة', list_contracts: 'قراءة العقود', propose_renewal: 'اقتراح تجديد', list_tickets: 'قراءة البلاغات', triage_ticket: 'تصنيف بلاغ', list_vendors: 'قراءة المقاولين', assign_vendor: 'إسناد مقاول', list_leads: 'قراءة العملاء', match_units: 'مطابقة الوحدات', create_lead: 'إضافة عميل', qualify_lead: 'تأهيل عميل', schedule_viewing: 'حجز معاينة', create_ticket: 'تسجيل بلاغ', request_quotes: 'طلب عروض أسعار', complete_ticket: 'إغلاق بلاغ', propose_early_termination: 'اقتراح إنهاء مبكر' },
    empty: 'اطلب من الوكيل تنفيذ مهمة، أو اختر أحد الاقتراحات.',
    footer: 'بيانات تجريبية.',
  },
  en: {
    brand: 'jdar', product: 'Property management',
    nav: { overview: 'Overview', contracts: 'Contracts', collections: 'Collection & accounting', maintenance: 'Maintenance', leasing: 'Leasing' },
    agent: 'Jdar agent', agentSub: 'Reads your data, does the work, and asks before anything sensitive',
    llm: 'Live LLM', local: 'Local demo mode',
    ask: 'Ask the agent…', send: 'Send', thinking: 'Agent working', you: 'You',
    reset: 'Reset demo', resetConfirm: 'Confirm reset', resetDone: 'Sample data restored', close: 'Close', none: 'Nothing here', lang: 'العربية',
    approvals: 'Awaiting your approval', noApprovals: 'Nothing pending', approve: 'Approve', decline: 'Decline',
    activity: 'Agent activity', runDaily: 'Run daily operations', dailyTitle: 'Daily operations in one click', dailyDesc: 'The agent goes through all four areas and prepares the work. Nothing is sent before you approve it.', dailySteps: ['Drafts reminders for overdue invoices', 'Proposes renewals for contracts ending soon', 'Triages tickets and assigns vendors', 'Qualifies new leads and books viewings'], suggestions: 'Suggestions',
    occHint: 'Rented units out of all units',
    kpi: { occupancy: 'Occupancy', collected: 'Collected, last 30 days', overdue: 'Overdue', tickets: 'Open tickets', leads: 'New leads', expiring: 'Contracts ending in 90 days' },
    units: 'units', of: 'of',
    overview: { attention: 'Needs your attention today', overdue: 'Overdue invoices', oldest: 'oldest by', expiring: 'Contracts ending in 90 days', nearest: 'nearest in', tickets: 'New maintenance tickets', ticketsHint: 'Not triaged or assigned yet', leads: 'New leads', vacant: 'vacant units', noApprovals: 'Nothing pending. When the agent runs, everything that needs your decision appears here.' },
    caps: 'What the agent can do',
    runAgent: 'Run agent',
    contracts: { title: 'Contracts', sub: 'Leases registered on Ejar, and proposed renewals', tenant: 'Tenant', unit: 'Unit', rent: 'Annual rent', end: 'End date', ejar: 'Ejar no.', daysLeft: 'days left', ended: 'Ended',
      status: { active: 'Active', renewal_pending: 'Renewal awaiting approval', termination_pending: 'Termination awaiting approval', terminated: 'Ended early', expiring: 'Ending soon' }, renewed: 'Renewed',
      create: 'New contract', tabPdf: 'Upload PDF', tabText: 'Paste text', choosePdf: 'Choose a PDF', pdfHint: 'The agent reads the file and extracts the terms. Max 3 MB.', doc: 'Document',
      terminate: 'End early', termDate: 'End date', termReason: 'Reason', termSend: 'Send for approval', cancel: 'Cancel',
      err: { pdf_scanned: 'This PDF is a scan with no text. Reading it needs the live LLM.', pdf_unreadable: 'Could not read the file.', pdf_too_large: 'The file is over 3 MB.', other: 'Extraction failed. Try again.' },
      localNote: 'Local demo mode recognises common wording only. Review the terms before sending.',
      agentBtn: 'Propose renewals', freeze: 'The agent follows the five-year freeze on annual rent increases in Riyadh: renewals keep the current rent.',
      extractTitle: 'New contract from a document', extractSub: 'Upload the lease as a PDF or paste its text. The agent extracts the terms and flags what needs review.', extract: 'Extract terms', useSample: 'Use sample lease',
      createDraft: 'Send for approval', risks: 'Clauses to review', special: 'Special terms', fields: { tenant_name: 'Tenant', unit_code: 'Unit', start: 'Start', end: 'End', annual_rent: 'Annual rent', payment_schedule: 'Payment schedule', deposit: 'Deposit', ejar_number: 'Ejar no.' } },
    collections: { title: 'Collection & accounting', sub: 'Invoices, reminders and general ledger entries', invoice: 'Invoice', due: 'Due', amount: 'Amount', reminders: 'Reminders', record: 'Record payment', outstanding: 'Total outstanding', rate: 'Collection rate', ledger: 'Journal', balances: 'Balances', agentBtn: 'Chase overdue rent', daysLate: 'days late',
      status: { paid: 'Paid', due: 'Due', overdue: 'Overdue' }, acct: { bank: 'Bank', receivables: 'Tenant receivables', maintenance: 'Maintenance expense', income: 'Rental income', vat: 'VAT payable' }, vat: 'VAT 15%', inclVat: 'incl. VAT', exempt: 'Residential · exempt', aging: 'Overdue by age', days: 'days', vatNote: '15% VAT is added to commercial rent. Residential rent is exempt.', dr: 'Dr', cr: 'Cr' },
    maintenance: { title: 'Maintenance', sub: 'Tenant requests and vendor dispatch', cols: { new: 'New', assigned: 'In progress', done: 'Done' }, untriaged: 'Not triaged', vendors: 'Vendors', open: 'open jobs', agentBtn: 'Triage and dispatch', add: 'Add ticket', unit: 'Unit', desc: 'The request as the tenant reported it', save: 'Save ticket', cancel: 'Cancel', sla: 'Respond within', h: 'h', left: 'left', breached: 'Target missed', met: 'On target', quotes: 'Quotes', cost: 'Cost', eta: 'arrival in', quotePending: 'Quote awaiting approval', complete: 'Mark done', limitNote: 'Quotes up to 500 SAR are approved automatically; higher ones need your approval. Completing a ticket posts its cost to the ledger.' },
    leasing: { title: 'Leasing', sub: 'Leads, viewings and vacant units', cols: { new: 'New', qualified: 'Qualified', viewing: 'Viewing booked' }, budget: 'Budget', vacant: 'Vacant units', lastEjar: 'Last registered rent', agentBtn: 'Qualify leads and book viewings', beds: 'bed', m2: 'm²', viewing: 'Viewing',
      type: { apartment: 'Apartment', office: 'Office', shop: 'Shop' }, source: { website: 'Website', whatsapp: 'WhatsApp', referral: 'Referral', manual: 'Manual entry' },
      add: 'Add lead', addTitle: 'New lead and requirements', name: 'Lead name', phone: 'Phone (optional)', wants: 'Unit type', bedsWanted: 'Bedrooms', budgetYear: 'Annual budget (SAR)', notes: 'Other requirements (district, move-in date, …)', saveRun: 'Save and qualify', saveOnly: 'Save only', cancel: 'Cancel', addHint: 'The agent matches the requirements to vacant units, scores the lead and books a viewing.' },
    sched: { monthly: 'Monthly', quarterly: 'Quarterly', semiannual: 'Semi-annual', annual: 'Annual' },
    prompts: {
      overview: ['What needs my attention today?', 'Run the full daily operations', 'What is the total overdue?', 'Which units are vacant?'],
      contracts: ['Propose renewals for contracts ending in 90 days', 'Which contracts end soon?', 'End contract C-1044 early in 30 days'],
      collections: ['Draft reminders for overdue invoices', 'What is the total overdue?', 'Record the payment for INV-2205'],
      maintenance: ['Triage new tickets and assign vendors', 'Add ticket for unit A-102: front door will not lock', 'Which tickets are urgent?', 'Close ticket M-308'],
      leasing: ['Qualify new leads and book viewings', 'Which units fit lead L-71?', 'Which units are vacant?'],
    },

    daily: 'Run the full daily operations: overdue rent, renewals, maintenance and new leads.',
    tools: { get_portfolio_summary: 'Reading portfolio summary', list_invoices: 'Reading invoices', draft_payment_reminder: 'Drafting reminder', record_payment: 'Recording payment', list_contracts: 'Reading contracts', propose_renewal: 'Proposing renewal', list_tickets: 'Reading tickets', triage_ticket: 'Triaging ticket', list_vendors: 'Reading vendors', assign_vendor: 'Assigning vendor', list_leads: 'Reading leads', match_units: 'Matching units', create_lead: 'Adding lead', qualify_lead: 'Qualifying lead', schedule_viewing: 'Booking viewing', create_ticket: 'Logging ticket', request_quotes: 'Requesting quotes', complete_ticket: 'Closing ticket', propose_early_termination: 'Proposing early termination' },
    empty: 'Ask the agent to do something, or pick a suggestion.',
    footer: 'Sample data.',
  },
}

export const SAMPLE_LEASE = `عقد إيجار وحدة سكنية

الطرف الأول (المؤجر): شركة جدار لإدارة الأملاك.
الطرف الثاني (المستأجر): ريم الحربي.
الوحدة: شقة رقم A-204، مجمع النخيل السكني، حي النخيل، الرياض.
مدة العقد: سنة واحدة تبدأ في \u20662026-12-01\u2069 وتنتهي في \u20662027-11-30\u2069.
قيمة الإيجار السنوية: 52,000 ريال سعودي، تُدفع على أربع دفعات ربع سنوية مقدماً.
مبلغ التأمين: 3,000 ريال يُعاد عند انتهاء العقد بعد خصم أي أضرار.
يحق للمؤجر زيادة الإيجار بنسبة 7% عند التجديد.
يلتزم المستأجر بعدم إجراء أي تعديلات إنشائية دون موافقة خطية.
يُسجَّل العقد في منصة إيجار خلال 7 أيام من توقيعه.`
