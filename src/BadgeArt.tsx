import { useId } from 'react'
import type { Badge } from './badges'

type Rung = 'lit' | 'open' | 'rest'
type Design = {
  round?: boolean
  kept?: boolean
  glow?: boolean
  /** Top, middle, and bottom rungs: Retained, Independent, Guided. */
  rungs?: [Rung, Rung, Rung]
  glyph?: 'weeks' | 'trail' | 'check' | 'flag'
  stack?: 1 | 2
  tag?: string
  moon?: boolean
  sunrise?: boolean
}

const lit: [Rung, Rung, Rung] = ['lit', 'lit', 'lit']
const designs: Record<string, Design> = {
  'first-rep': { round: true, rungs: ['open', 'open', 'lit'] },
  'first-independent': { glow: true, rungs: ['open', 'lit', 'lit'] },
  'first-retained': { kept: true, glow: true, rungs: lit },
  'five-kept': { kept: true, glow: true, rungs: lit, stack: 1, tag: '5' },
  'ten-kept': { kept: true, glow: true, rungs: lit, stack: 2, tag: '10' },
  'held-month': { kept: true, glow: true, rungs: lit, moon: true, tag: '30d' },
  'steady-weeks': { glow: true, glyph: 'weeks' },
  'welcome-back': { glow: true, rungs: ['lit', 'rest', 'lit'], sunrise: true },
  'stage-independent': { glow: true, glyph: 'trail' },
}
const designFor = (badge: Pick<Badge, 'id' | 'kind'>): Design =>
  designs[badge.id] ?? (badge.kind === 'path' ? { round: true, glow: true, glyph: 'flag' } : { round: true, glow: true, glyph: 'check' })

// The logo's tile, drawn at (8,9) in an 80-unit badge so stacked cards fit above and a tag below.
const X = 8
const Y = 9
const S = 64
const bars = { top: [28, 36, 23], mid: [26, 38, 32], bot: [28, 36, 41] } as const

/**
 * One badge, drawn from the logo: a piece of the coding desk, the code brackets, and the three rep bars as the
 * evidence ladder (bottom Guided, middle Independent, top Retained). Square tiles are evidence; round tiles are
 * completion. Decorative: the badge name and rule beside it carry the meaning. Colours come from the badge desk
 * tokens, so a badge follows Sage, Ocean, and Plum and stays dark in light and dark mode. `earning` plays the
 * earning motion once.
 */
export function BadgeArt({ badge, earning = false }: { badge: Pick<Badge, 'id' | 'kind'>; earning?: boolean }) {
  const design = designFor(badge)
  const uid = useId().replace(/:/g, '')
  const radius = design.round ? S / 2 : 16
  const rungs = design.rungs
  return (
    <svg
      className="badge-art"
      data-shape={design.round ? 'round' : 'square'}
      data-earning={earning || undefined}
      viewBox="0 0 80 80"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-enamel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--badge-desk-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--badge-desk)' }} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0" style={{ stopColor: 'var(--badge-lit)', stopOpacity: 0.32 }} />
          <stop offset="1" style={{ stopColor: 'var(--badge-lit)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {design.stack &&
        [design.stack, 1]
          .slice(design.stack === 2 ? 0 : 1)
          .map(level => (
            <rect
              key={level}
              className="badge-stack"
              x={X + 5 * level}
              y={Y - 4 * level}
              width={S - 10 * level}
              height={S}
              rx="14"
              strokeOpacity={level === 1 ? 0.6 : 0.35}
            />
          ))}
      <g className="badge-tile">
        <rect x={X} y={Y} width={S} height={S} rx={radius} fill={`url(#${uid}-enamel)`} className="badge-tile-face" />
        <rect className="badge-highlight" x={X + 1.5} y={Y + 1.5} width={S - 3} height={S - 3} rx={radius - 1.5} />
      </g>
      {design.glow && <circle className="badge-glow" cx={X + 32} cy={Y + 32} r="24" fill={`url(#${uid}-glow)`} />}
      {design.kept && (
        <rect className="badge-rim" x={X + 2.25} y={Y + 2.25} width={S - 4.5} height={S - 4.5} rx={radius - 2} pathLength={1} />
      )}
      <path className="badge-brackets" d={`M${X + 22} ${Y + 19} ${X + 10} ${Y + 32}l12 13M${X + 42} ${Y + 19}l12 13-12 13`} />
      {rungs &&
        (['top', 'mid', 'bot'] as const).map((name, index) => {
          const [a, b, y] = bars[name]
          if (rungs[index] === 'lit')
            return (
              <g key={name} className="badge-rung" data-rung={name}>
                <path className="badge-rung-lit" d={`M${X + a} ${Y + y}h${b - a}`} />
                <path className="badge-rung-shine" d={`M${X + a} ${Y + y - 1.2}h${b - a}`} />
              </g>
            )
          return (
            <rect
              key={name}
              className={rungs[index] === 'rest' ? 'badge-rung-rest' : 'badge-rung-open'}
              x={X + a - 2.5}
              y={Y + y - 2.5}
              width={b - a + 5}
              height="5"
              rx="2.5"
            />
          )
        })}
      {design.glyph === 'weeks' && (
        <g className="badge-weeks">
          {[25.5, 29.8, 34.2, 38.5].map((x, week) => (
            <g key={x} data-week={week}>
              {[25, 32, 39].map(y => (
                <circle key={y} cx={X + x} cy={Y + y} r="1.8" />
              ))}
            </g>
          ))}
        </g>
      )}
      {design.glyph === 'trail' && (
        <g className="badge-trail">
          <path className="badge-trail-line" d={`M${X + 27.5} ${Y + 22.5}c9 2 9 7 4.5 9.5s-4.5 7.5 4.5 9.5`} />
          {[
            [27.5, 22.5],
            [32, 32],
            [36.5, 41.5],
          ].map(([x, y]) => (
            <circle key={y} className="badge-trail-node" cx={X + x} cy={Y + y} r="3.4" />
          ))}
        </g>
      )}
      {design.glyph === 'check' && <path className="badge-mark" pathLength={1} d={`M${X + 26.5} ${Y + 32.5}l4 4 7.5-8.5`} />}
      {design.glyph === 'flag' && <path className="badge-mark" pathLength={1} d={`M${X + 28} ${Y + 42}V${Y + 22}m0 1h9l-2.5 4 2.5 4h-9`} />}
      {design.moon && <path className="badge-moon" d={`M${X + 53} ${Y + 7.5}a5.5 5.5 0 1 0 4.2 9.2 4.4 4.4 0 1 1-4.2-9.2z`} />}
      {design.sunrise && (
        <g className="badge-sunrise">
          <path className="badge-sun" d={`M${X + 25.5} ${Y + 55}a6.5 6.5 0 0 1 13 0`} />
          <path className="badge-horizon" d={`M${X + 21} ${Y + 55}h22`} />
        </g>
      )}
      {design.tag && (
        <g className="badge-tag">
          <rect x={40 - (14 + 5.4 * design.tag.length) / 2} y={Y + S - 7} width={14 + 5.4 * design.tag.length} height="13" rx="6.5" />
          <text x="40" y={Y + S + 2.6} textAnchor="middle">
            {design.tag}
          </text>
        </g>
      )}
    </svg>
  )
}
