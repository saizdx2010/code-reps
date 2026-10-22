// The Code Reps icon pack: drawn for this app from the logo, not taken from a library.
//
// The rules: a 24 × 24 grid with 2 px of air round the edge, 1.8 px strokes with round ends and joins,
// and soft 2.5–3 px corners. Shapes come from the logo's two strokes: the code bracket and the code line.
// Where an icon has a part that matters (the line in the lesson, the day in the calendar, the stem of
// the info and alert marks) it is the rep line: the lime line of the logo. Like the logo, it has the same
// weight as the rest of the icon and is set apart only by colour: var(--icon-mark, currentColor).
//
// Each icon is a list of layers: a stroked path (`d`) or a dot (`dot: [cx, cy, r]`). Layers with `move`
// react: when the link or button the icon sits in is hovered, focused, or pressed, the moving layers play
// a short reaction (REACTIONS below; transform only). `whole: true` moves the whole icon instead.
//
// The app (Icon.tsx and the generated src/icon-pack.css, from `yarn icons`) and the design file
// (`yarn design:icons` → design/code-reps-design-system.figcraft, Icons page) both read this file.

export type Point = [number, number]

export type ReactionName =
  | 'nudge'
  | 'drop'
  | 'bump'
  | 'squeeze'
  | 'turn'
  | 'advance'
  | 'shake'
  | 'tilt'
  | 'open-left'
  | 'open-right'
  | 'type'
  | 'spin'
  | 'flutter'
  | 'look'
  | 'glow'

export type IconLayer = {
  /** Stroked path. */
  d?: string
  /** Solid dot: centre and radius. */
  dot?: [number, number, number]
  /** The rep line: coloured var(--icon-mark, currentColor). Dots always take the mark colour. */
  mark?: boolean
  /** Moves with the icon's reaction, or with a reaction of its own. */
  move?: true | ReactionName
  /** Where this layer turns or scales from. */
  origin?: Point
}

export type IconDef = {
  react: ReactionName
  /** The whole icon moves instead of single layers. */
  whole?: boolean
  /** Where the icon (or its moving layers) turns or scales from; default the centre. */
  origin?: Point
  /** Delay between moving layers, in ms. */
  stagger?: number
  layers: IconLayer[]
}

/** A pose of a reaction keyframe: x / y in grid px, r in degrees, s / sx / sy scale. */
export type Pose = { x?: number; y?: number; r?: number; s?: number; sx?: number; sy?: number }

export type Reaction = {
  ms: number
  ease: 'spring' | 'standard'
  /** [percent, pose]; 0 % and 100 % are the resting icon unless given. */
  frames: [number, Pose][]
  /** The pose the design draws as the peak (default the first frame). */
  show?: Pose
  note: string
}

export const STROKE = 1.8

const n = (value: number) => +value.toFixed(2)

/** Rounded rectangle as a path. */
export function rrect(x: number, y: number, w: number, h: number, r: number) {
  return `M${n(x + r)} ${n(y)}H${n(x + w - r)}a${r} ${r} 0 0 1 ${r} ${r}V${n(y + h - r)}a${r} ${r} 0 0 1-${r} ${r}H${n(x + r)}a${r} ${r} 0 0 1-${r}-${r}V${n(y + r)}a${r} ${r} 0 0 1 ${r}-${r}z`
}

/** Circle as a path (two arcs). */
export function circle(cx: number, cy: number, r: number) {
  return `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0-${n(2 * r)} 0z`
}

export const ICONS = {
  arrow: {
    react: 'nudge',
    stagger: 40,
    layers: [
      { d: 'M13.5 6.5 19 12l-5.5 5.5', move: true },
      { d: 'M5 12h13', mark: true, move: true },
    ],
  },
  chevron: {
    react: 'drop',
    whole: true,
    layers: [{ d: 'M6.5 9.5 12 15l5.5-5.5' }],
  },
  play: {
    react: 'nudge',
    whole: true,
    layers: [{ d: 'M8.5 5.75v12.5L19 12z' }],
  },
  check: {
    react: 'bump',
    whole: true,
    layers: [{ d: 'M5 12.5l4.5 4.5L19 7.5' }],
  },
  close: {
    react: 'turn',
    whole: true,
    layers: [{ d: 'M6.75 6.75l10.5 10.5M17.25 6.75 6.75 17.25' }],
  },
  plus: {
    react: 'bump',
    whole: true,
    layers: [{ d: 'M12 6v12M6 12h12' }],
  },
  minus: {
    react: 'squeeze',
    whole: true,
    layers: [{ d: 'M6 12h12' }],
  },
  circle: {
    react: 'bump',
    whole: true,
    layers: [{ d: circle(12, 12, 8) }],
  },
  code: {
    react: 'open-left',
    layers: [
      { d: 'M8.5 7 4 12l4.5 5', move: 'open-left' },
      { d: 'M15.5 7l4.5 5-4.5 5', move: 'open-right' },
      { d: 'M10.5 8.75h3M10.5 15.25h3' },
      { d: 'M10 12h4', mark: true, move: 'type', origin: [10, 12] },
    ],
  },
  book: {
    react: 'type',
    layers: [
      { d: `${rrect(5, 3.5, 14, 17, 2.5)}M8.5 3.5v17M11.5 12.5h2.5` },
      { d: 'M11.5 8.5h4', mark: true, move: true, origin: [11.5, 8.5] },
    ],
  },
  repeat: {
    react: 'spin',
    whole: true,
    layers: [{ d: 'M5 12a7 7 0 0 1 12.36-4.5M17.64 4.31l-.28 3.19-3.19-.28M19 12a7 7 0 0 1-12.36 4.5M6.36 19.69l.28-3.19 3.19.28' }],
  },
  flag: {
    react: 'flutter',
    layers: [{ d: 'M6 20.5V3.5' }, { d: 'M6 4.5h11.5l-2.5 4 2.5 4H6', move: true, origin: [6, 8.5] }],
  },
  calendar: {
    react: 'advance',
    layers: [{ d: `${rrect(4, 5.5, 16, 15, 3)}M4 10h16M8.5 3.5v4M15.5 3.5v4` }, { dot: [8.75, 14.75, 1.1], move: true }],
  },
  alert: {
    react: 'shake',
    whole: true,
    layers: [
      { d: 'M10.27 4.5a2 2 0 0 1 3.46 0l7.07 12.25a2 2 0 0 1-1.73 3H4.93a2 2 0 0 1-1.73-3z' },
      { d: 'M12 9.25v3.75', mark: true },
      { dot: [12, 16.25, 1.05] },
    ],
  },
  info: {
    react: 'tilt',
    whole: true,
    layers: [{ d: circle(12, 12, 8.5) }, { d: 'M12 11v5', mark: true }, { dot: [12, 7.85, 1.05] }],
  },
  search: {
    react: 'look',
    whole: true,
    layers: [{ d: circle(10.75, 10.75, 6.25) }, { d: 'M15.5 15.5 19.75 19.75', mark: true }],
  },
  hint: {
    react: 'glow',
    layers: [
      { d: 'M9.5 17v-1.8c0-.9-.6-1.6-1.3-2.3a5.75 5.75 0 1 1 7.6 0c-.7.7-1.3 1.4-1.3 2.3V17zM10 20.5h4' },
      { d: 'M12 17v-3.25', mark: true, move: true, origin: [12, 17] },
    ],
  },
} satisfies Record<string, IconDef>

export type IconShape = keyof typeof ICONS
export const ICON_SHAPES = Object.keys(ICONS) as IconShape[]

/** What each icon shows and how it reacts, and where the app uses it (the design file and tests; not bundled). */
export const ICON_NOTES: Record<IconShape, { note: string; use: string }> = {
  arrow: {
    note: 'Forward. The head nudges on and the shaft, the rep line, follows it.',
    use: 'Forward actions and row navigation (ListRow, Start rep, Plan your approach); down is the same arrow turned 90°',
  },
  chevron: {
    note: 'Disclosure. Dips the way it opens.',
    use: 'Every expand and collapse: trailing, points down, turns 180° when open; left and right are the same chevron turned',
  },
  play: {
    note: 'Run. A soft triangle that nudges forward.',
    use: 'Run checks',
  },
  check: {
    note: 'Passed. Grows a little and settles.',
    use: 'Success, selection, completed trail node, done stage index',
  },
  close: {
    note: 'Dismiss. Turns a quarter.',
    use: 'Dismiss dialogs, clear search; failed checks',
  },
  plus: {
    note: 'Add a value. Grows a little.',
    use: 'Number stepper only: adding a value',
  },
  minus: {
    note: 'Subtract a value. Squeezes in.',
    use: 'Number stepper only: subtracting a value',
  },
  circle: {
    note: 'Not started. An empty ring that grows when pointed at.',
    use: 'Not-started rep node; skill map "Not started"',
  },
  code: {
    note: 'The logo in small: three code lines between brackets. The brackets open and the middle line types itself in.',
    use: 'Empty results; skill map "Practiced" marker',
  },
  book: {
    note: 'Lesson. A notebook whose first line, the rep line, writes itself across the page.',
    use: 'Lesson node (square marker); Library breadcrumb',
  },
  repeat: {
    note: 'Recall. The two arrows go half way round.',
    use: 'Recall node; skill map "Review due"',
  },
  flag: {
    note: 'Project milestone. The flag flutters on its pole.',
    use: 'Project milestone node; skill map "Retained"',
  },
  calendar: {
    note: 'Schedule. The marked day moves on to the next one.',
    use: 'Date field trigger',
  },
  alert: {
    note: 'Needs attention. A small shake; the stem is the rep line.',
    use: 'Failed check summary; unsaved or failed states',
  },
  info: {
    note: 'How this works. Tilts its head; the stem is the rep line.',
    use: 'InfoNote summary (16px)',
  },
  search: {
    note: 'Search. The lens looks around; its handle is the rep line.',
    use: 'Search and command palette trigger',
  },
  hint: {
    note: 'Hint. The filament, the rep line, lights up.',
    use: 'Reveal hint button',
  },
}

/** Names the app passes to <Icon>: the shapes, plus turned shapes. */
export const ICON_TURNS = {
  down: { shape: 'arrow', rotate: 90 },
  left: { shape: 'chevron', rotate: 90 },
  right: { shape: 'chevron', rotate: -90 },
} as const

export const REACTIONS: Record<ReactionName, Reaction> = {
  nudge: { ms: 320, ease: 'spring', frames: [[45, { x: 3 }]], note: 'Moves 3 px the way it points' },
  drop: { ms: 320, ease: 'spring', frames: [[45, { y: 2.5 }]], note: 'Dips 2.5 px the way it opens' },
  bump: { ms: 280, ease: 'spring', frames: [[45, { s: 1.18 }]], note: 'Grows 18 % and settles' },
  squeeze: { ms: 240, ease: 'standard', frames: [[40, { sx: 0.7 }]], note: 'Narrows to 70 % and back' },
  turn: { ms: 280, ease: 'standard', frames: [[100, { r: 90 }]], show: { r: 30 }, note: 'A quarter turn' },
  advance: { ms: 440, ease: 'spring', frames: [[45, { x: 5 }]], note: 'Moves on 5 px and comes back' },
  shake: {
    ms: 360,
    ease: 'standard',
    frames: [
      [20, { x: -1.5 }],
      [45, { x: 1.5 }],
      [70, { x: -1 }],
      [90, { x: 0.5 }],
    ],
    note: 'A small shake, never a big one',
  },
  tilt: { ms: 380, ease: 'spring', frames: [[45, { r: -14 }]], note: 'Tilts 14° and settles' },
  'open-left': { ms: 340, ease: 'spring', frames: [[45, { x: -1.5 }]], note: 'The left bracket opens 1.5 px' },
  'open-right': { ms: 340, ease: 'spring', frames: [[45, { x: 1.5 }]], note: 'The right bracket opens 1.5 px' },
  type: { ms: 380, ease: 'standard', frames: [[0, { sx: 0.1 }]], show: { sx: 0.4 }, note: 'The line types itself in from the left' },
  spin: { ms: 560, ease: 'standard', frames: [[100, { r: 180 }]], show: { r: 90 }, note: 'Half a turn' },
  flutter: {
    ms: 480,
    ease: 'standard',
    frames: [
      [30, { sx: 0.82 }],
      [65, { sx: 1.06 }],
    ],
    note: 'Folds in and out from the pole',
  },
  look: {
    ms: 520,
    ease: 'standard',
    frames: [
      [30, { x: -1.5, y: -1 }],
      [65, { x: 1.5, y: 0.5 }],
    ],
    note: 'Looks left, then right',
  },
  glow: { ms: 360, ease: 'spring', frames: [[45, { sy: 1.35 }]], note: 'The filament grows up and settles' },
}

export type IconPart = IconLayer & { reaction?: { name: ReactionName; origin: Point; delay: number } }

/** An icon's layers with, for moving ones, the reaction, origin, and stagger delay; `whole` for whole-icon reactions. */
export function iconParts(shape: IconShape): { layers: IconPart[]; whole?: { name: ReactionName; origin: Point; delay: number } } {
  const icon: IconDef = ICONS[shape]
  const origin = icon.origin ?? [12, 12]
  if (icon.whole) return { layers: icon.layers, whole: { name: icon.react, origin, delay: 0 } }
  let moving = 0
  return {
    layers: icon.layers.map(layer => {
      if (!layer.move) return layer
      const name = layer.move === true ? icon.react : layer.move
      const delay = (icon.stagger ?? 0) * moving++
      return { ...layer, reaction: { name, origin: layer.origin ?? (layer.dot ? [layer.dot[0], layer.dot[1]] : origin), delay } }
    }),
  }
}

/** A standalone SVG of the icon in one colour, for CSS masks and exports. */
export function iconSvg(shape: IconShape, color = 'black') {
  const body = ICONS[shape].layers
    .map((layer: IconLayer) =>
      layer.dot ? `<circle cx="${layer.dot[0]}" cy="${layer.dot[1]}" r="${layer.dot[2]}" fill="${color}"/>` : `<path d="${layer.d}"/>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}
