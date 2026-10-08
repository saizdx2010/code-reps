import { useLayoutEffect, useRef } from 'react'

/** Follows the real active button without replacing it or changing its focus behavior. It measures both axes, so the same indicator serves the horizontal bar and the vertical desktop rail. */
export function StepIndicator({ active }: { active: string }) {
  const indicator = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const node = indicator.current
    const container = node?.parentElement
    if (!node || !container) return
    const measure = () => {
      const target = container.querySelector<HTMLElement>('button[aria-current]')
      if (!target) return
      const parent = container.getBoundingClientRect()
      const button = target.getBoundingClientRect()
      node.style.width = `${button.width}px`
      node.style.height = `${button.height}px`
      node.style.transform = `translate(${button.left - parent.left - container.clientLeft + container.scrollLeft}px, ${button.top - parent.top - container.clientTop + container.scrollTop}px)`
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    container.querySelectorAll('button').forEach(button => observer.observe(button))
    return () => observer.disconnect()
  }, [active])
  return <span ref={indicator} className="step-indicator" aria-hidden="true" />
}
