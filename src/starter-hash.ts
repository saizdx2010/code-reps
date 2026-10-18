// A short, stable fingerprint of a rep's starter code. The startup catalog keeps this instead of the starter text,
// so "is the saved code still the starter?" stays synchronous. The generator and practice.ts must share this function.
// It is never saved: 32 bits keep the startup catalog small, and an edited draft has about a one-in-four-billion
// chance of matching its starter's fingerprint, which would only show that draft as not started.
export function starterHash(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index)
    h1 = Math.imul(h1 ^ code, 2654435761)
    h2 = Math.imul(h2 ^ code, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h1 >>> 0).toString(16).padStart(8, '0')
}
