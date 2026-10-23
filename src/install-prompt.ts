// The browser's offer to install Code Reps as an app (Chromium browsers only). It fires once, early, so a small script
// in index.html keeps it on `window.codeRepsInstall` and announces changes; the practice plan page offers it from there.

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const held = () => (window as unknown as { codeRepsInstall?: InstallEvent | null }).codeRepsInstall ?? null

export const canInstall = () => held() !== null
export const installed = () => window.matchMedia?.('(display-mode: standalone)').matches ?? false

export function onInstallChange(listener: () => void) {
  window.addEventListener('code-reps-install', listener)
  return () => window.removeEventListener('code-reps-install', listener)
}

/** Shows the browser's install dialog; resolves true if the learner installed. */
export async function install() {
  const offer = held()
  if (!offer) return false
  ;(window as unknown as { codeRepsInstall: null }).codeRepsInstall = null
  await offer.prompt()
  const { outcome } = await offer.userChoice
  window.dispatchEvent(new Event('code-reps-install'))
  return outcome === 'accepted'
}
