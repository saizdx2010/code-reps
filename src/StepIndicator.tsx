import { useLayoutEffect, useRef } from 'react'

/**
 * Follows the real active button without replacing it or changing its focus behavior. It measures both axes,
 * so the same indicator serves the practice step bar (an underline, or a wash in the vertical focus strip), lesson
 * sections, and segmented switches.
 * It glides only when the selection changes; first placement and layout resizes snap into place.
 */
export function StepIndicator({ active, selector = 'button[aria-current]' }: { active: string; selector?: string }) {
  const indicator = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)
  useLayoutEffect(() => {
    const node = indicator.current
    const container = node?.parentElement
    if (!node || !container) return
    const measure = (glide: boolean) => {
      const target = container.querySelector<HTMLElement>(selector)
      if (!target) return
      const parent = container.getBoundingClientRect()
      const button = target.getBoundingClientRect()
      if (!glide) node.style.transition = 'none'
      node.style.width = `${button.width}px`
      node.style.height = `${button.height}px`
      const x = button.left - parent.left - container.clientLeft + container.scrollLeft
      const y = button.top - parent.top - container.clientTop + container.scrollTop
      node.style.transform = `translate(${x}px, ${y}px)`
      if (!glide) {
        void node.offsetWidth
        node.style.transition = ''
      }
    }
    measure(placed.current)
    placed.current = true
    const observer = new ResizeObserver(() => measure(false))
    observer.observe(container)
    container.querySelectorAll('button').forEach(button => observer.observe(button))
    return () => observer.disconnect()
  }, [active, selector])
  return <span ref={indicator} className="step-indicator" aria-hidden="true" />
}
