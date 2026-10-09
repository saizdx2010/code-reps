/**
 * A few reps to start from: unfinished reps in path order first, then the easiest unfinished reps.
 * Unplaced reps sort after Advanced. Pure: the caller supplies completion and level lookups.
 */
export function startHereReps<T extends { id: string }>(candidates: readonly T[], { pathRepIds, isDone, level, limit = 4 }: { pathRepIds: readonly string[]; isDone: (item: T) => boolean; level: (id: string) => number | undefined; limit?: number }): T[] {
  const open = candidates.filter(item => !isDone(item))
  const onPath = [...new Set(pathRepIds)].flatMap(id => open.filter(item => item.id === id))
  // Array.prototype.sort is stable, so equal levels keep catalog order.
  const easiest = open.filter(item => !onPath.includes(item)).sort((a, b) => (level(a.id) ?? 4) - (level(b.id) ?? 4))
  return [...onPath, ...easiest].slice(0, limit)
}
