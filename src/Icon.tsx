import type { CSSProperties, ReactNode } from 'react'
import { ICON_TURNS, iconParts, type IconShape, type ReactionName } from './icon-pack.ts'
import './icon-pack.css'
import './icons.css'

type IconName = IconShape | keyof typeof ICON_TURNS

const partStyle = (reaction: { name: ReactionName; origin: [number, number]; delay: number }) =>
  ({
    '--react': `var(--icon-react-${reaction.name})`,
    transformOrigin: `${reaction.origin[0]}px ${reaction.origin[1]}px`,
    animationDelay: reaction.delay ? `${reaction.delay}ms` : undefined,
  }) as CSSProperties

/**
 * Decorative app-owned icon from the Code Reps pack (icon-pack.ts). Its moving parts play a short reaction when the
 * link or button round it is hovered, focused, or pressed (icons.css). `play` plays the reaction when the icon appears
 * and again whenever the value changes; `still` never reacts.
 */
export function Icon({ name, play, still }: { name: IconName; play?: boolean | number | string; still?: boolean }) {
  const shape: IconShape = name in ICON_TURNS ? ICON_TURNS[name as keyof typeof ICON_TURNS].shape : (name as IconShape)
  const { layers, whole } = iconParts(shape)
  const drawn = layers.map((layer, index) => {
    const element: ReactNode = layer.dot ? (
      <circle className="ui-icon-dot" cx={layer.dot[0]} cy={layer.dot[1]} r={layer.dot[2]} />
    ) : (
      <path className={layer.mark ? 'ui-icon-mark' : undefined} d={layer.d} />
    )
    return layer.reaction ? (
      <g key={index} className="ui-icon-part" style={partStyle(layer.reaction)}>
        {element}
      </g>
    ) : (
      <g key={index}>{element}</g>
    )
  })
  const playing = play !== undefined && play !== false
  return (
    <span
      key={playing ? String(play) : undefined}
      className={`ui-icon icon-${shape}${shape !== name ? ` icon-${name}` : ''}${still ? ' icon-still' : ''}`}
      data-play={playing ? '' : undefined}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        {whole ? (
          <g className="ui-icon-part" style={partStyle(whole)}>
            {drawn}
          </g>
        ) : (
          drawn
        )}
      </svg>
    </span>
  )
}
