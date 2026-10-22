// Vim keys are a device setting for the code editor. The key sits outside the 'code-reps:' namespace on purpose: profile
// migration, server sync, and backups own that namespace, and this setting belongs to the browser, not to a learner.
const vimKey = 'code-reps-device:vim'

export function readVimMode() {
  try {
    return localStorage.getItem(vimKey) === 'on'
  } catch {
    return false
  }
}

export function writeVimMode(on: boolean) {
  try {
    if (on) localStorage.setItem(vimKey, 'on')
    else localStorage.removeItem(vimKey)
  } catch {
    /* The toggle still works for this page without storage. */
  }
}
