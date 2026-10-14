import { browserProjects, projectReflection } from '../src/browser-projects.ts'
import { validateContentDepth } from '../src/content-depth.ts'
import { reps } from '../src/rep.ts'
import { skills, contentVersion } from '../src/knowledge.ts'
import { validateKnowledge } from '../src/knowledge-validation.ts'
import { reflectionGuides } from '../src/reflection-guides.ts'
import { validateReps } from '../src/rep-validation.ts'
const ids = new Set(reps.map(rep => rep.id))
const errors = [
  ...validateKnowledge(ids),
  ...validateContentDepth(ids, new Set(skills.map(skill => skill.id))),
  ...validateReps(reps, reflectionGuides),
]
for (const project of browserProjects) {
  if (!project.requirements.length || !project.verification.length || !project.examples.length || !project.transfer || !project.readiness)
    errors.push(`${project.id}: incomplete external project`)
  for (const id of project.preparation) if (!ids.has(id)) errors.push(`${project.id}: missing preparation rep ${id}`)
  if (projectReflection(project).length > 20_000) errors.push(`${project.id}: self-review exceeds notebook limit`)
}
if (
  new Set(browserProjects.map(project => project.id)).size !== browserProjects.length ||
  ![1, 2, 3].every(level => browserProjects.some(project => project.level === level))
)
  errors.push('External project levels need unique IDs and one complete project per level.')
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else
  console.log(
    `Content v${contentVersion}: ${skills.length} knowledge lessons, ${skills.reduce((n, s) => n + s.questions.length, 0)} interactive checks, ${reps.length} exercises; references, prerequisites, recall variants, project milestones, and rubrics are valid.`,
  )
