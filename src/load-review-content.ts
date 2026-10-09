// Heavy review material (self-review guides, rep depth, lesson depth) is loaded when a rep or lesson opens.
// Add new entries in src/review/*.ts; keep the startup modules to ids, titles, and checked content.
export type ReviewContent = {
  repDepth: typeof import('./rep-depth.ts').repDepth
  lessonDepth: typeof import('./lesson-depth.ts').lessonDepth
  reflectionGuides: typeof import('./reflection-guides.ts').reflectionGuides
}
let pending: Promise<ReviewContent> | undefined
export function loadReviewContent(): Promise<ReviewContent> {
  // A failed import is forgotten so Retry can request the chunk again.
  return pending ??= Promise.all([import('./rep-depth.ts'), import('./lesson-depth.ts'), import('./reflection-guides.ts')])
    .then(([reps, lessons, guides]) => ({ repDepth: reps.repDepth, lessonDepth: lessons.lessonDepth, reflectionGuides: guides.reflectionGuides }))
    .catch(error => { pending = undefined; throw error })
}
