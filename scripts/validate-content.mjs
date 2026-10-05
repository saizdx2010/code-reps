import { browserProjects, projectReflection } from '../src/browser-projects.ts'
import { validateContentDepth } from '../src/content-depth.ts'
import { reps } from '../src/rep.ts'
import { skills, contentVersion } from '../src/knowledge.ts'
import { validateKnowledge } from '../src/fluency.ts'
import { reflectionGuides } from '../src/learning.ts'
const ids = new Set(reps.map(rep => rep.id))
const errors = [...validateKnowledge(ids), ...validateContentDepth(ids, new Set(skills.map(skill => skill.id)))]
if (ids.size !== reps.length) errors.push('Exercise IDs must be unique.')
for (const rep of reps) {
  for (const field of ['title','category','prompt','note','planPrompt','starter','functionName']) if (!rep[field]?.trim()) errors.push(`${rep.id}: missing ${field}`)
  if (!rep.checks.length || new Set(rep.checks.map(c=>c.name)).size !== rep.checks.length) errors.push(`${rep.id}: missing or duplicate checks`)
  if (!reflectionGuides[rep.id]) errors.push(`${rep.id}: missing self-review`)
}
for (const project of browserProjects) {
  if (!project.requirements.length || !project.verification.length || !project.examples.length || !project.transfer || !project.readiness) errors.push(`${project.id}: incomplete external project`)
  for (const id of project.preparation) if (!ids.has(id)) errors.push(`${project.id}: missing preparation rep ${id}`)
  if (projectReflection(project).length > 20_000) errors.push(`${project.id}: self-review exceeds notebook limit`)
}
if (new Set(browserProjects.map(project => project.id)).size !== browserProjects.length || ![1, 2, 3].every(level => browserProjects.some(project => project.level === level))) errors.push('External project levels need unique IDs and one complete project per level.')
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1 }
else console.log(`Content v${contentVersion}: ${skills.length} knowledge lessons, ${skills.reduce((n,s)=>n+s.questions.length,0)} interactive checks, ${reps.length} exercises; references, prerequisites, recall variants, project milestones, and rubrics are valid.`)
