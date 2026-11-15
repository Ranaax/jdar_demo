import { TOOLS, systemPrompt, EXTRACT_PROMPT } from '../src/agent/schema.js'

export const config = { maxDuration: 60 }

const env = process.env
const LIMITS = { perMinute: 60, messages: 40, bodyBytes: 4_400_000, pdfBytes: 3_000_000 }

// Provider is chosen by whichever key is configured. The variable is found by name (anything containing
// "gemini", or "anthropic"/"claude") or, failing that, by the key's shape, so the exact name does not matter.
const vars = Object.entries(env).map(([k, v]) => [k, String(v || '').trim()]).filter(([, v]) => v.length > 20)
const pick = (nameRe, valueRe) => (vars.find(([k]) => nameRe.test(k)) || vars.find(([k, v]) => /KEY|TOKEN|API/i.test(k) && valueRe.test(v)))?.[1]
const GEMINI_KEY = pick(/gemini|google_(generative_ai_)?api|genai/i, /^AIza/)
const ANTHROPIC_KEY = pick(/anthropic|claude/i, /^sk-ant/)
const PROVIDER = env.AGENT_PROVIDER || (ANTHROPIC_KEY && !/^AIza/.test(ANTHROPIC_KEY) ? 'anthropic' : GEMINI_KEY ? 'gemini' : null)

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
const parseJson = (out) => JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1))
// History is trimmed to the last N messages; a turn must start on a plain user message, never on a tool result.
const trim = (messages) => { const m = messages.slice(-LIMITS.messages); while (m.length && !(m[0].role === 'user' && typeof m[0].content === 'string')) m.shift(); return m }

// ---------- Anthropic ----------
async function anthropic(payload) {
  const r = await fetch(`${env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.AGENT_MODEL || 'claude-sonnet-5-5', max_tokens: 1500, ...payload }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error?.message || `LLM error ${r.status}`)
  return data
}

// ---------- Gemini ----------
// The browser speaks one message format (text / tool_use / tool_result blocks); it is translated here.
// Each block keeps its original Gemini part in `_p` so thought signatures go back exactly as received.
const GEMINI_MODELS = [env.GEMINI_MODEL || env.AGENT_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'].filter(Boolean)
let geminiModel

async function gemini(body) {
  const base = env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'
  const started = Date.now(), tried = []
  for (const model of geminiModel ? [geminiModel] : [...new Set(GEMINI_MODELS)]) {
    for (let attempt = 0; attempt < 2 && Date.now() - started < 40000; attempt++) {
      let r, data = {}
      try {
        r = await fetch(`${base}/v1beta/models/${model}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(14000), headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, body: JSON.stringify(body) })
        data = await r.json().catch(() => ({}))
      } catch (e) { tried.push(`${model}: ${e.name === 'TimeoutError' ? 'timed out' : e.message}`); break }
      if (r.ok) { geminiModel = model; return data }
      const msg = String(data?.error?.message || `HTTP ${r.status}`).slice(0, 220)
      tried.push(`${model}: ${r.status} ${msg}`)
      console.error('gemini', model, r.status, msg)
      if (r.status === 503 && attempt === 0) { await new Promise((ok) => setTimeout(ok, 1500)); continue } // overloaded: one quick retry
      if (r.status === 404 || r.status === 429 || r.status === 503) break                                  // not available or over quota for this key: next model
      throw new Error(msg)
    }
  }
  throw new Error(tried.join(' | '))
}

const geminiTools = [{ functionDeclarations: TOOLS.map((t) => ({ name: t.name, description: t.description, ...(Object.keys(t.input_schema.properties || {}).length ? { parameters: t.input_schema } : {}) })) }]

function toGemini(messages) {
  const calls = {}
  return messages.map((m) => {
    if (typeof m.content === 'string') return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }
    if (m.role === 'assistant') return { role: 'model', parts: m.content.map((b) => { if (b.type === 'tool_use') calls[b.id] = b; return b._p || (b.type === 'tool_use' ? { functionCall: { name: b.name, args: b.input || {} } } : { text: b.text || '' }) }) }
    return { role: 'user', parts: m.content.map((b) => {
      if (b.type !== 'tool_result') return { text: b.text || '' }
      const call = calls[b.tool_use_id] || {}
      let result; try { result = JSON.parse(b.content) } catch { result = b.content }
      const gid = call._p?.functionCall?.id
      return { functionResponse: { name: call.name || 'unknown', ...(gid ? { id: gid } : {}), response: { result } } }
    }) }
  })
}

function fromGemini(data) {
  const parts = data?.candidates?.[0]?.content?.parts || []
  const content = parts.filter((p) => !p.thought || p.functionCall).map((p, i) => p.functionCall
    ? { type: 'tool_use', id: p.functionCall.id || `call_${Date.now()}_${i}`, name: p.functionCall.name, input: p.functionCall.args || {}, _p: p }
    : { type: 'text', text: p.text || '', _p: p })
  if (!content.length) content.push({ type: 'text', text: data?.promptFeedback?.blockReason ? `Blocked: ${data.promptFeedback.blockReason}` : '…' })
  return { content, stop_reason: content.some((b) => b.type === 'tool_use') ? 'tool_use' : 'end_turn' }
}

// ---------- handler ----------
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  if (!PROVIDER) return send(res, 503, { error: 'no_key' })
  if (rateLimited(req)) return send(res, 429, { error: 'rate_limited' })
  try {
    const { task, messages = [], lang = 'ar', text, pdf, today } = await readBody(req)

    if (task === 'extract') {
      if (pdf && pdf.length * 0.75 > LIMITS.pdfBytes) return send(res, 413, { error: 'pdf_too_large' })
      const doc = String(text || '').slice(0, 20000)
      if (PROVIDER === 'gemini') {
        const parts = pdf ? [{ inlineData: { mimeType: 'application/pdf', data: pdf } }, { text: 'Extract the lease terms from this document.' }] : [{ text: doc }]
        const data = await gemini({ system_instruction: { parts: [{ text: EXTRACT_PROMPT }] }, contents: [{ role: 'user', parts }], generationConfig: { responseMimeType: 'application/json' } })
        return send(res, 200, { terms: parseJson((data.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('')) })
      }
      const content = pdf ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf } }, { type: 'text', text: 'Extract the lease terms from this document.' }] : doc
      const data = await anthropic({ system: EXTRACT_PROMPT, messages: [{ role: 'user', content }] })
      return send(res, 200, { terms: parseJson(data.content.map((b) => b.text || '').join('')) })
    }

    // The server fixes the system prompt and the tool list; the browser cannot add tools or change the rules.
    const system = systemPrompt(lang === 'en' ? 'en' : 'ar', String(today || '').slice(0, 10))
    const history = trim(messages)
    if (!history.length) return send(res, 400, { error: 'empty conversation' })
    if (PROVIDER === 'gemini') {
      const data = await gemini({ system_instruction: { parts: [{ text: system }] }, tools: geminiTools, contents: toGemini(history), generationConfig: { maxOutputTokens: 4096 } })
      return send(res, 200, { ...fromGemini(data), model: geminiModel })
    }
    const clean = history.map((m) => (typeof m.content === 'string' ? m : { ...m, content: m.content.map(({ _p, ...b }) => b) }))
    const data = await anthropic({ system, tools: TOOLS, messages: clean })
    return send(res, 200, { content: data.content, stop_reason: data.stop_reason, model: data.model })
  } catch (e) {
    return send(res, e.message === 'too_large' ? 413 : 502, { error: String(e.message || e) })
  }
}
