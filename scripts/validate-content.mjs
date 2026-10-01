import { reps } from '../src/rep.ts'
import { skills, contentVersion } from '../src/knowledge.ts'
import { validateKnowledge } from '../src/fluency.ts'
import { reflectionGuides } from '../src/learning.ts'
const ids = new Set(reps.map(rep => rep.id))
const errors = validateKnowledge(ids)
if (ids.size !== reps.length) errors.push('Exercise IDs must be unique.')
for (const rep of reps) {
  for (const field of ['title','category','prompt','note','planPrompt','starter','functionName']) if (!rep[field]?.trim()) errors.push(`${rep.id}: missing ${field}`)
  if (!rep.checks.length || new Set(rep.checks.map(c=>c.name)).size !== rep.checks.length) errors.push(`${rep.id}: missing or duplicate checks`)
  if (!reflectionGuides[rep.id]) errors.push(`${rep.id}: missing self-review`)
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1 }
else console.log(`Content v${contentVersion}: ${skills.length} knowledge lessons, ${skills.reduce((n,s)=>n+s.questions.length,0)} interactive checks, ${reps.length} exercises; references, prerequisites, recall variants, project milestones, and rubrics are valid.`)
