export type LocalProfile = { id: string; name: string; createdAt: string }
export type ProfileRegistry = { version: 1; profiles: LocalProfile[] }
export const profileRegistryKey = 'code-reps:profiles:v1'
export const profilePrefix = (id: string) => `code-reps:profile:${id}:`
export function scopedKey(id: string, key: string) {
  if (!/^[a-z0-9-]{1,50}$/.test(id) || !key.startsWith('code-reps:')) throw new Error('Invalid profile key.')
  return profilePrefix(id) + key.slice('code-reps:'.length)
}
export function parseProfiles(raw: string | null): ProfileRegistry {
  if (!raw) return { version: 1, profiles: [{ id: 'default', name: 'My learning', createdAt: new Date().toISOString() }] }
  const value = JSON.parse(raw) as ProfileRegistry
  if (value.version !== 1 || !Array.isArray(value.profiles) || !value.profiles.length || value.profiles.length > 50 || value.profiles.some(p => !p || !/^[a-z0-9-]{1,50}$/.test(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60 || !Number.isFinite(Date.parse(p.createdAt))) || new Set(value.profiles.map(p => p.id)).size !== value.profiles.length) throw new Error('Local profiles could not be read. Existing data has been kept.')
  return value
}
export function legacyMigration(entries: Record<string, string>) {
  const updates: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(entries)) {
    if (!key.startsWith('code-reps:') || key === profileRegistryKey || key.startsWith('code-reps:profile:') || key === 'code-reps:pending-writes:v1' || key === 'code-reps:server-mode:v1') continue
    const target = scopedKey('default', key)
    if (!(target in entries)) updates[target] = value
    updates[key] = null
  }
  return updates
}
