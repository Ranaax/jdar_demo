// Local (no-LLM) PDF text reader. Loaded only when a PDF is used without an API key.
// PDFs store Arabic in visual order, so each line is rebuilt into reading order here.
const RTL = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/, LTR = /[A-Za-z0-9]/
const JOIN = /^[-,./:\s]+$/, MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '«': '»', '»': '«' }

export function lineToLogical(strs) {
  const items = strs.map((x) => x.normalize('NFKC').replace(/[\u064B-\u0652]/g, '')).filter(Boolean)
  if (!items.some((x) => RTL.test(x))) return items.join('')
  const kind = items.map((x) => (RTL.test(x) ? 'R' : LTR.test(x) ? 'L' : 'N'))
  const out = []
  for (let i = 0; i < items.length; i++) {
    if (kind[i] !== 'L') { out.push(kind[i] === 'N' ? [...items[i]].map((ch) => MIRROR[ch] || ch).join('') : items[i]); continue }
    let end = i
    for (let j = i + 1; j < items.length; j++) {
      if (kind[j] === 'L') end = j
      else if (kind[j] === 'R' || !JOIN.test(items[j])) break
    }
    const [, lead, core, trail] = items.slice(i, end + 1).join('').match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/)
    out.push(trail + (/^\d{1,2}-\d{1,2}-\d{4}$/.test(core) ? core.split('-').reverse().join('-') : core) + lead) // dates always come out year-first
    i = end
  }
  return out.reverse().join('')
}

export function itemsToText(items) {
  const lines = new Map()
  for (const it of items) {
    if (!it.str) continue
    const y = Math.round(it.transform[5] / 3)
    if (!lines.has(y)) lines.set(y, [])
    lines.get(y).push(it)
  }
  return [...lines.entries()].sort((a, b) => b[0] - a[0])
    .map(([, l]) => lineToLogical(l.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str)).replace(/\s+/g, ' ').trim())
    .filter(Boolean).join('\n')
}

export async function pdfToText(file) {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.mjs')])
  globalThis.pdfjsWorker = worker
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  let out = ''
  for (let n = 1; n <= Math.min(doc.numPages, 20); n++) out += itemsToText((await (await doc.getPage(n)).getTextContent()).items) + '\n'
  return out
}
