import { capstones, recallVariants } from './fluency.ts'
import { journeys } from './learning.ts'
import { knowledgeGroups, skills } from './knowledge.ts'

const skillIds = new Set(skills.map(s => s.id))
// Checks the full lesson bodies. Needs the whole catalog, so only tests and scripts call it.
export function validateKnowledge(repIds: Set<string>) {
  const problems: string[] = []
  if (new Set(skills.map(s=>s.id)).size !== skills.length) problems.push('Duplicate skill IDs')
  for (const skill of skills) {
    if (!skill.sections.length || !skill.objectives.length || !skill.example || !skill.walkthrough.length || !skill.questions.length) problems.push(`${skill.id}: incomplete lesson`)
    for (const id of [...skill.prerequisites, ...skill.related]) if (!skillIds.has(id)) problems.push(`${skill.id}: missing skill ${id}`)
    for (const id of skill.repIds) if (!repIds.has(id)) problems.push(`${skill.id}: missing rep ${id}`)
    if (new Set(skill.questions.map(q=>q.id)).size !== skill.questions.length) problems.push(`${skill.id}: duplicate question`)
    for (const q of skill.questions) if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length || !q.explanation) problems.push(`${skill.id}: invalid question ${q.id}`)
  }
  const groupedIds = knowledgeGroups.flatMap(group => group.skillIds)
  if (new Set(groupedIds).size !== groupedIds.length || groupedIds.length !== skills.length || groupedIds.some(id => !skillIds.has(id))) problems.push('Knowledge groups must contain every skill exactly once')
  const visit = (id: string, stack: Set<string>) => {
    if (stack.has(id)) { problems.push(`${id}: prerequisite cycle`); return }
    for (const dep of skills.find(s=>s.id===id)?.prerequisites ?? []) visit(dep, new Set([...stack, id]))
  }
  skills.forEach(s=>visit(s.id, new Set()))
  for (const journey of journeys) if (!recallVariants[journey.id]?.every(id => repIds.has(id))) problems.push(`${journey.id}: missing recall variants`)
  for (const project of capstones) for (const m of project.milestones) if (!repIds.has(m.repId)) problems.push(`${project.id}: missing milestone`)
  return problems
}
