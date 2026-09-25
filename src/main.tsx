import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/maple-mono/400.css'
import '@fontsource/maple-mono/500.css'
import '@fontsource/maple-mono/600.css'
import '@fontsource/maple-mono/700.css'
import './index.css'
import App from './App.tsx'
import { initializeStorage } from './local-store.ts'

async function start() {
  await initializeStorage()
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
}

void start()
