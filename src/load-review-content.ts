// A rep's self-review guide and depth load when its review opens, from the one module that holds each of them
// (src/review-chunks.ts, generated). Add new entries in src/review-*.ts; keep startup modules to ids, titles, and checked content.
import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'
import type { Review } from './review-registry.ts'

export type ReviewContent = { depth?: RepDepth; guide?: ReflectionGuide }

const modules = new Map<number, Promise<Review>>()
let chunks: Promise<typeof import('./review-chunks.ts')> | undefined

// A failed import is forgotten so Retry can request the chunk again.
function forgetOnFailure<T>(promise: Promise<T>, forget: () => void): Promise<T> {
  return promise.catch(error => {
    forget()
    throw error
  })
}

export async function loadReviewContent(repId: string): Promise<ReviewContent> {
  const { reviewLoaders, reviewOwners } = await (chunks ??= forgetOnFailure(import('./review-chunks.ts'), () => (chunks = undefined)))
  const [depthOwner, guideOwner] = Object.hasOwn(reviewOwners, repId) ? reviewOwners[repId] : [-1, -1]
  const load = (index: number) => {
    if (index < 0) return undefined
    let promise = modules.get(index)
    if (!promise) {
      promise = forgetOnFailure(reviewLoaders[index](), () => modules.delete(index))
      modules.set(index, promise)
    }
    return promise
  }
  const [depthModule, guideModule] = await Promise.all([load(depthOwner), load(guideOwner)])
  return { depth: depthModule?.depth[repId], guide: guideModule?.guides[repId] }
}
