// Shared by the local server and the browser store (src/local-store.ts) so both accept the same saved keys and limits.
// Plain JavaScript keeps it loadable by the portable bundle's Node runtime, which copies server/ as is.
export const storageKeyAllowed = key => typeof key === 'string' && /^code-reps:[a-z0-9:-]+$/.test(key) && key.length < 160

// The largest saved value, in characters. Browser storage quotas (a few million characters per site) bind first, so a
// long practice history fails as "storage full" rather than at an app limit. Backups accept the same size per field.
export const maxValueLength = 10_000_000
// The most keys one save request may carry; the browser splits larger saves into several requests.
export const maxEntriesPerRequest = 500
// The browser starts a new request once a batch reaches this many bytes; one larger value still goes alone.
export const requestBatchBytes = 4 * 1024 * 1024
// The largest request body, in bytes. JSON escaping writes a character as at most six bytes (a control character becomes
// \u0000), so this holds the largest single value with room to spare.
export const maxRequestBytes = 64 * 1024 * 1024
