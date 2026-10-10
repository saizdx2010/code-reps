// Whether the screen on show was reached by in-app navigation. A page load leaves focus where the browser put it, so the skip link stays the first stop.
let navigated = false

export function setScreenNavigated(value: boolean) { navigated = value }
export function screenNavigated() { return navigated }
