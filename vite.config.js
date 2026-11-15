import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Serves api/agent.js during `npm run dev`, same handler Vercel runs in production.
const apiDev = () => ({
  name: 'api-dev',
  configureServer(server) {
    server.middlewares.use('/api/agent', async (req, res) => {
      const mod = await server.ssrLoadModule('/api/agent.js')
      mod.default(req, res)
    })
  },
})

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  // SINGLE=1 builds one self-contained bundle (used for the offline standalone page).
  const single = process.env.SINGLE ? { build: { assetsInlineLimit: 1e7, rollupOptions: { output: { inlineDynamicImports: true } } } } : {}
  return { plugins: [react(), apiDev()], ...single }
})
