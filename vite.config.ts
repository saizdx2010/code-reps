import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { bundleReactFrame } from './scripts/react-frame-bundle.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), { name: 'local-react-frame', resolveId(id) { if (id === 'virtual:react-frame') return '\0react-frame' }, async load(id) { if (id === '\0react-frame') return `export default ${JSON.stringify(await bundleReactFrame())}` } }],
  worker: { format: 'es' },
  // The SQLite rep imports sql.js lazily inside the check worker. Pre-bundle it at startup so a fresh dev server
  // does not discover it mid-run and force a page reload that discards the running checks.
  optimizeDeps: { include: ['sql.js'] },
  build: { manifest: true },
})
