import { TOOLS, systemPrompt, EXTRACT_PROMPT } from '../src/agent/schema.js'

const MODEL = process.env.AGENT_MODEL || 'claude-sonnet-5-5'
const BASE = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
const LIMITS = { perMinute: 30, messages: 40, bodyBytes: 4_400_000, pdfBytes: 3_000_000 }

// Best-effort per-instance rate limit; use a shared store (e.g. Upstash) in production.
const hits = new Map()
function rateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0]
  const t = Date.now(), list = (hits.get(ip) || []).filter((x) => t - x < 60000)
  list.push(t); hits.set(ip, list)
  return list.length > LIMITS.perMinute
}

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let raw = ''
  for await (const chunk of req) { raw += chunk; if (raw.length > LIMITS.bodyBytes) throw new Error('too_large') }
  return raw ? JSON.parse(raw) : {}
}

const send = (res, status, data) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

async function claude(payload) {
  const r = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, ...payload }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error?.message || `LLM error ${r.status}`)
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: 'no_key' })
  if (rateLimited(req)) return send(res, 429, { error: 'rate_limited' })
  try {
    const { task, messages = [], lang = 'ar', text, pdf, today } = await readBody(req)

    if (task === 'extract') {
      if (pdf && pdf.length * 0.75 > LIMITS.pdfBytes) return send(res, 413, { error: 'pdf_too_large' })
      const content = pdf
        ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf } }, { type: 'text', text: 'Extract the lease terms from this document.' }]
        : String(text || '').slice(0, 20000)
      const data = await claude({ system: EXTRACT_PROMPT, messages: [{ role: 'user', content }] })
      const out = data.content.map((b) => b.text || '').join('')
      return send(res, 200, { terms: JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) })
    }

    // The server fixes the system prompt and the tool list; the browser cannot add tools or change the rules.
    const data = await claude({ system: systemPrompt(lang === 'en' ? 'en' : 'ar', String(today || '').slice(0, 10)), tools: TOOLS, messages: messages.slice(-LIMITS.messages) })
    return send(res, 200, { content: data.content, stop_reason: data.stop_reason })
  } catch (e) {
    return send(res, e.message === 'too_large' ? 413 : 502, { error: String(e.message || e) })
  }
}
