// Shared by the local server and the browser store (src/local-store.ts) so both accept the same saved keys.
// Plain JavaScript keeps it loadable by the portable bundle's Node runtime, which copies server/ as is.
export const storageKeyAllowed = (key) => typeof key === 'string' && /^code-reps:[a-z0-9:-]+$/.test(key) && key.length < 160
