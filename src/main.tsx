import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/maple-mono/400.css'
import '@fontsource/maple-mono/500.css'
import '@fontsource/maple-mono/600.css'
import '@fontsource/maple-mono/700.css'
import './index.css'
import ProfileApp from './ProfileApp.tsx'
import { initializeStorage } from './local-store.ts'

async function start() {
  await initializeStorage()
  const root = createRoot(document.getElementById('root')!)
  // The content preview exists only in development; the production build drops this branch and its chunk.
  if (import.meta.env.DEV) {
    const authoring = location.hash.startsWith('#/author')
    window.addEventListener('hashchange', () => {
      if (location.hash.startsWith('#/author') !== authoring) location.reload()
    })
    if (authoring) {
      const { AuthorPreview } = await import('./AuthorPreview.tsx')
      root.render(
        <StrictMode>
          <AuthorPreview />
        </StrictMode>,
      )
      return
    }
  }
  root.render(
    <StrictMode>
      <ProfileApp />
    </StrictMode>,
  )
}

void start()
