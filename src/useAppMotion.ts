import { useEffect } from 'react'
import { cancelReveals, reducedMotion, revealElement } from './ui-motion'

const actionSelector = '.primary-button, .finish-button, .reset-button, .hint-button, .stop-checks-button, .danger-button, .file-button, .profile-trigger'

/** One interaction treatment includes existing buttons as well as the shared Button. */
export function useAppMotion() {
  useEffect(() => {
    const ripples = new Map<HTMLElement, Animation>()
    function press(event: PointerEvent) {
      if (event.button !== 0 || reducedMotion() || !(event.target instanceof Element)) return
      const button = event.target.closest<HTMLElement>(actionSelector)
      if (!button || button.matches(':disabled, [aria-disabled="true"]') || typeof button.animate !== 'function') return
      const rect = button.getBoundingClientRect()
      const ripple = document.createElement('span')
      ripple.className = 'button-ripple'
      ripple.setAttribute('aria-hidden', 'true')
      ripple.style.left = `${event.clientX - rect.left}px`
      ripple.style.top = `${event.clientY - rect.top}px`
      button.append(ripple)
      const animation = ripple.animate([
        { opacity: .16, transform: 'translate(-50%, -50%) scale(.5)' },
        { opacity: 0, transform: `translate(-50%, -50%) scale(${Math.max(rect.width, rect.height) / 9})` },
      ], { duration: 430, easing: 'ease-out' })
      ripples.set(ripple, animation)
      const clean = () => { ripple.remove(); ripples.delete(ripple) }
      void animation.finished.then(clean, clean)
    }
    function expand(event: Event) {
      const detail = event.target
      if (!(detail instanceof HTMLElement) || detail.tagName !== 'DETAILS' || !(detail as HTMLDetailsElement).open) return
      Array.from(detail.children).forEach(child => {
        if (child instanceof HTMLElement && child.tagName !== 'SUMMARY') revealElement(child)
      })
    }
    const preference = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    const cancelRipples = () => { ripples.forEach(animation => animation.cancel()) }
    const onPreference = () => { if (preference?.matches) { cancelRipples(); cancelReveals() } }
    document.addEventListener('pointerdown', press)
    document.addEventListener('toggle', expand, true)
    preference?.addEventListener('change', onPreference)
    return () => {
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('toggle', expand, true)
      preference?.removeEventListener('change', onPreference)
      cancelRipples()
      cancelReveals()
    }
  }, [])
}
