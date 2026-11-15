# Jdar · Agentic property management demo

Bilingual (Arabic/English) demo covering contracts, collection & accounting, maintenance and leasing, with an agent that reads the portfolio, acts through tools and routes sensitive actions (tenant messages, renewals, new contracts) to an approval queue.

## Run
```
npm install
cp .env.example .env   # add GEMINI_API_KEY (or ANTHROPIC_API_KEY) for the live LLM agent
npm run dev
```
Without a key the agent runs a deterministic local mode, so the demo never depends on the network.

## How the agent works
- `src/agent/schema.js` – 19 tool definitions and the system prompt (shared by browser and server).
- `api/agent.js` – serverless function; calls Gemini or Claude (whichever key is set) with the tools. The key never reaches the browser.
- `src/agent/runAgent.js` – agent loop: the model picks tools, the browser executes them against app state, results go back to the model until it finishes.
- `src/agent/tools.js` – tool implementations, approval queue and guardrails (e.g. renewals above current rent are blocked under the Riyadh rent freeze).
- `src/agent/fallback.js` – local agent and lease extractor used when no key is set.

## Guardrails (enforced in code, not only in the prompt)
- **Allowlist:** the agent can only call the 19 tools; the server fixes the tool list and system prompt, and unknown tool names change nothing.
- **Human approval:** tenant messages, renewals, early terminations, new contracts and vendor quotes above 500 SAR go to the approval queue.
- **Hard rules:** no rent increase on renewal (Riyadh rent freeze), vendor trade must match, payments cannot exceed the invoice total, IDs must exist.
- **Limits:** 14 steps per run, 40 messages of history, 30 requests/minute per client, PDFs up to 3 MB.
- **Untrusted text:** tenant requests, lead notes and document contents are treated as data, never as instructions.
- **Audit:** every agent action is written to the activity feed.

## Documents
Contracts can be created from a PDF or pasted text. With a key, the LLM reads the PDF directly (including scans). Without one, a local reader handles text PDFs with common lease wording.

## Deploy
Push to Vercel (Vite preset is detected; `api/` becomes a function). Set `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` in the project's environment variables, then redeploy.

## Brand
`public/brand/` holds Jdar's tokens.css, components.css and marks. Arabic text uses Noto Naskh Arabic (OFL, self-hosted) as the stand-in for ITF Fatimah; add the licensed Fatimah files to `public/brand/fonts/` and they take over automatically.

All tenants, units and amounts are fictional.
