import { executeTool } from './tools.js'
import { localAgent, localExtract } from './fallback.js'
import { today } from '../data.js'
import { TOOLS, systemPrompt, EXTRACT_PROMPT } from './schema.js'

const post = (body) => fetch('/api/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

// When the app is hosted as a Claude artifact, the page can ask Claude directly (no API key).
// Resolves to null anywhere else, and then the /api/agent route or the local agent is used.
let hosted
const getHosted = () => (hosted ??= (async () => { try { return (await window.claude?.use?.('sample')) || null } catch { return null } })())

// One agent run. Tools execute in the browser against app state; the LLM only decides.
export async function runAgent({ prompt, lang, history, getState, setState, onStep, onText, forceLocal }) {
  const exec = (name, input) => {
    const step = onStep({ name, input, status: 'run' })
    const { state, result } = executeTool(getState(), name, input, lang)
    setState(state)
    step.done(result?.error ? 'error' : 'done')
    return result
  }

  const sample = forceLocal ? null : await getHosted()
  if (sample) {
    const turns = [...history.filter((m) => typeof m.content === 'string'), { role: 'user', content: prompt }]
    const input = turns.map((m, i) => (i === 0 ? { ...m, content: `${systemPrompt(lang, today())}\n\n---\n\n${m.content}` } : m))
    let calls = 0
    const tools = TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.input_schema, execute: async (args) => { if (++calls > 40) throw new Error('step limit reached'); return exec(t.name, args) } }))
    try {
      const out = await sample(input, { tools, cache: false, onText: ({ text }) => onText?.(text) })
      const text = (out.text || '').trim() || '…'
      return { mode: 'llm', messages: [...turns, { role: 'assistant', content: text }], text }
    } catch (e) {
      if (calls > 0 || e?.code === 'rate_limited') return { mode: 'llm', messages: history, text: `⚠ ${e?.message || e?.code || e}` }
      if (e?.code === 'not_granted') hosted = Promise.resolve(null)
    }
  } else if (!forceLocal) {
    const messages = [...history, { role: 'user', content: prompt }]
    try {
      for (let i = 0; i < 24; i++) {
        const r = await post({ messages, lang, today: today() })
        if (r.status === 503 || r.status === 404) break
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        messages.push({ role: 'assistant', content: data.content })
        const calls = data.content.filter((b) => b.type === 'tool_use')
        if (data.stop_reason !== 'tool_use' || !calls.length) {
          return { mode: 'llm', model: data.model, messages, text: data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim() }
        }
        messages.push({ role: 'user', content: calls.map((c) => ({ type: 'tool_result', tool_use_id: c.id, content: JSON.stringify(exec(c.name, c.input)) })) })
      }
      if (messages.length > history.length + 1) return { mode: 'llm', messages, text: '…' }
    } catch (e) {
      if (!(e instanceof TypeError)) return { mode: 'llm', messages: history, text: `⚠ ${e.message}` }
    }
  }

  const text = await localAgent(prompt, lang, exec, getState)
  return { mode: 'local', messages: [...history, { role: 'user', content: prompt }, { role: 'assistant', content: text }], text }
}

const toBase64 = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(file) })

// source: { text } or { file } (PDF). Hosted Claude reads the text; with a key the API reads the PDF itself; otherwise a local reader is used.
export async function extractTerms({ text, file }) {
  const pdfText = async () => { try { return await (await import('./pdfText.js')).pdfToText(file) } catch { return null } }
  const sample = await getHosted()
  if (sample) {
    if (file) { text = await pdfText(); if (text == null) return { error: 'pdf_unreadable' }; if (text.replace(/\s/g, '').length < 40) return { error: 'pdf_scanned' } }
    try { return { mode: 'llm', terms: await sample.json(`${EXTRACT_PROMPT}\n\nDocument:\n${String(text).slice(0, 20000)}`) } } catch (e) { if (e?.code === 'rate_limited') return { error: 'other' } }
  } else {
    try {
      const r = await post(file ? { task: 'extract', pdf: await toBase64(file) } : { task: 'extract', text })
      if (r.ok) return { mode: 'llm', terms: (await r.json()).terms }
      if (r.status !== 503 && r.status !== 404) return { error: (await r.json()).error }
    } catch {}
    if (file) { text = await pdfText(); if (text == null) return { error: 'pdf_unreadable' }; if (text.replace(/\s/g, '').length < 40) return { error: 'pdf_scanned' } }
  }
  await new Promise((ok) => setTimeout(ok, 500))
  return { mode: 'local', terms: localExtract(text) }
}
