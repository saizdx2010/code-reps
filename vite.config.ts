import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { bundleReactFrame } from './scripts/react-frame-bundle.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-react-frame',
      resolveId(id) {
        if (id === 'virtual:react-frame') return '\0react-frame'
      },
      async load(id) {
        if (id === '\0react-frame') return `export default ${JSON.stringify(await bundleReactFrame())}`
      },
    },
  ],
  worker: { format: 'es' },
  // The SQLite rep imports sql.js lazily inside the check worker, and the editor imports monaco-vim when Vim keys turn on.
  // Pre-bundle both at startup so a fresh dev server does not discover them mid-run and force a page reload.
  optimizeDeps: { include: ['sql.js', 'monaco-vim'] },
  resolve: {
    alias: [
      // monaco-vim's browser export is a UMD build carrying an old Monaco copy; use its ES module, which imports ours.
      { find: /^monaco-vim$/, replacement: fileURLToPath(new URL('./node_modules/monaco-vim/dist/index.mjs', import.meta.url)) },
      // It imports Monaco by file path, which Monaco's exports map no longer resolves; point those at the same files.
      {
        find: /^monaco-editor\/esm\/vs\/(.*?)(\.js)?$/,
        replacement: fileURLToPath(new URL('./node_modules/monaco-editor/esm/vs/', import.meta.url)) + '$1.js',
      },
    ],
  },
  build: { manifest: true },
})
