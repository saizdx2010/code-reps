import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { bundleReactFrame } from './scripts/react-frame-bundle.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), { name: 'local-react-frame', resolveId(id) { if (id === 'virtual:react-frame') return '\0react-frame' }, async load(id) { if (id === '\0react-frame') return `export default ${JSON.stringify(await bundleReactFrame())}` } }],
  build: { manifest: true },
})
