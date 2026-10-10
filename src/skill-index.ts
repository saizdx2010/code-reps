// Light lookups over the generated catalog. Full lesson bodies live in src/knowledge.ts and load with the lesson views.
import { skillIndex, type SkillSummary } from './catalog-index.ts'

export type { SkillSummary } from './catalog-index.ts'
export const skillSummaryById = (id: string): SkillSummary | undefined => skillIndex.find(skill => skill.id === id)
export const skillSummariesForRep = (id: string): SkillSummary[] => skillIndex.filter(skill => skill.repIds.includes(id))
