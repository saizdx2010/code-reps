import './icons.css'

type IconName = 'arrow' | 'play' | 'hint' | 'chevron' | 'left' | 'right' | 'check' | 'close' | 'plus' | 'minus' | 'calendar' | 'alert' | 'code' | 'circle' | 'down'

/** Decorative app-owned icons. Geometry lives in icons.css, including native disclosure markers. */
export function Icon({ name }: { name: IconName }) {
  const shape = name === 'down' ? 'arrow' : name === 'left' || name === 'right' ? 'chevron' : name
  return <span className={`ui-icon icon-${shape}${shape !== name ? ` icon-${name}` : ''}`} aria-hidden="true" />
}
