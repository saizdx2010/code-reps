/** Motion only changes presentation; it never owns learner state or delays an action. */
export function reducedMotion() {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const reveals = new WeakMap<HTMLElement, Animation>()
const activeReveals = new Set<Animation>()

export function cancelReveals() {
  activeReveals.forEach(animation => animation.cancel())
}

export function revealElement(element: HTMLElement | null, direction: 'up' | 'left' | 'right' | 'none' = 'up') {
  if (!element || reducedMotion() || typeof element.animate !== 'function') return
  reveals.get(element)?.cancel()
  const translate = direction === 'none' ? '0 0' : direction === 'up' ? '0 10px' : direction === 'left' ? '-14px 0' : '14px 0'
  const animation = element.animate([{ opacity: direction === 'none' ? .8 : .3, translate }, { opacity: 1, translate: '0 0' }], {
    duration: direction === 'none' ? 120 : 320,
    easing: 'cubic-bezier(.2, .8, .2, 1)',
  })
  reveals.set(element, animation)
  activeReveals.add(animation)
  const clean = () => activeReveals.delete(animation)
  void animation.finished.then(clean, clean)
}
