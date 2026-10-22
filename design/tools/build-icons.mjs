// Draws the Code Reps icon pack (src/icon-pack.ts) into design/code-reps-design-system.figcraft:
//   yarn design:icons
// - Redraws every variant of the "Icon" component set (Name × Size) in place, so the ~340 instances across the file
//   take the new shapes, then restores the colour each instance had (instances recolour their vectors).
// - Rewrites the Icons page text, and rebuilds the "Icons/Pack" (anatomy and rules) and "Icons/Reactions" boards.
//   The reactions board is a prototype: present it and hover an icon to play its reaction (smart animate).
// - Re-exports the previews in design/previews that show icons.
// Needs figcraft-cli (~/.local/bin/figcraft-cli). The rest of the file is hand-made: this script only owns the Icon
// component set and the boards named above.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect } from './figcraft-client.mjs'
import { poseMatrix, transformPath } from './icon-geometry.mjs'
import { ICONS, ICON_NOTES, ICON_SHAPES, ICON_TURNS, REACTIONS, STROKE, circle, iconParts } from '../../src/icon-pack.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const designDir = path.resolve(here, '..')
// DESIGN_FILE and PREVIEWS_DIR point a trial run at copies.
const file = process.env.DESIGN_FILE ?? path.join(designDir, 'code-reps-design-system.figcraft')
const previews = process.env.PREVIEWS_DIR ?? path.join(designDir, 'previews')

const ICONS_PAGE = 3
const VAR = {
  text: 'VariableID:6',
  muted: 'VariableID:7',
  accent: 'VariableID:8',
  surface: 'VariableID:2',
  surface2: 'VariableID:3',
  border: 'VariableID:4',
  bg: 'VariableID:1',
}
const HEX = {
  text: '#293E33',
  muted: '#5A6D5F',
  accent: '#2E6833',
  surface: '#FFFFFF',
  surface2: '#E3EEE2',
  border: '#C1D1C2',
  bg: '#EDF4ED',
}
const SANS = 'Source Sans 3'

const f = await connect()
const set = (ids, props) => f.tool('set_properties', { ids: [].concat(ids), props })
const bind = (ids, field, variable) => f.run('variable.bind', { ids: [].concat(ids), field, variable })
async function create(type, o) {
  const res = await f.tool('create_node', { type, ...o })
  return res.id
}
const children = async id => (await f.tool('get_node', { id, depth: 1 })).children ?? []
async function descendants(id) {
  const out = []
  const walk = n => {
    for (const c of n.children ?? []) {
      out.push(c)
      walk(c)
    }
  }
  walk(await f.tool('get_node', { id, depth: 20 }))
  return out
}
async function batched(commands, label) {
  for (let i = 0; i < commands.length; i += 200) await f.tool('batch', { commands: commands.slice(i, i + 200), label })
}

// ── Geometry: grid units → a size, turned for down / left / right, posed for a reaction.

const compose =
  (...ms) =>
  (x, y) =>
    ms.reduce(([px, py], m) => m(px, py), [x, y])
const scale = k => (x, y) => [x * k, y * k]
const shift = (dx, dy) => (x, y) => [x + dx, y + dy]
const layerPath = layer => (layer.dot ? circle(...layer.dot) : layer.d)

/** The icon's layers as paths in grid units, optionally turned and posed (`pose`: true for the peak of each part). */
function iconLayers(shape, { rotate = 0, pose = false } = {}) {
  const { layers, whole } = iconParts(shape)
  const turn = rotate ? poseMatrix({ r: rotate }, [12, 12]) : null
  return layers.map(layer => {
    const reaction = whole ?? layer.reaction
    let d = layerPath(layer)
    const moving = !!reaction
    if (pose && reaction) {
      const r = REACTIONS[reaction.name]
      d = transformPath(d, poseMatrix(r.show ?? r.frames[0][1], reaction.origin))
    }
    if (turn) d = transformPath(d, turn)
    return { ...layer, d, moving }
  })
}

/**
 * Draws an icon as vectors into `parent` at `size` px, offset by (x, y). Colours bind to variables: `color` for
 * strokes, `mark` for the rep line and dots, `moving` for parts that move (Reactions board).
 */
async function drawIcon(
  parent,
  shape,
  { size = 24, x = 0, y = 0, rotate = 0, pose = false, color = 'text', mark, moving, names = true } = {},
) {
  const k = size / 24
  const ids = []
  const layers = iconLayers(shape, { rotate, pose })
  for (const [index, layer] of layers.entries()) {
    const tone = layer.moving && moving ? moving : layer.dot || layer.mark ? (mark ?? color) : color
    const d = transformPath(layer.d, compose(scale(k), shift(x, y)))
    const name = names ? (layer.dot ? 'dot' : layer.mark ? 'rep line' : layer.moving ? 'moving part' : 'path') : `layer ${index + 1}`
    const props = layer.dot
      ? { fills: [HEX[tone]], strokes: [] }
      : {
          fills: [],
          strokes: [HEX[tone]],
          strokeWeight: +(STROKE * k).toFixed(3),
          strokeCap: 'round',
          strokeJoin: 'round',
        }
    const id = await create('vector', { parent, name, path: d, props })
    await bind(id, layer.dot ? 'fill' : 'stroke', VAR[tone])
    ids.push(id)
  }
  return ids
}

// ── Small layout helpers in the file's board style.

async function frame(parent, o = {}) {
  const layout = 'dir' in o ? o.dir : 'vertical'
  // Gap and padding switch auto layout on, so a plain frame (dir: null) gets neither.
  const props = {
    fills: o.fill ? [HEX[o.fill]] : [],
    cornerRadius: o.radius ?? 0,
    clip: o.clip ?? false,
    ...(layout
      ? {
          layout,
          gap: o.gap ?? 0,
          padding: o.pad ?? 0,
          ...(o.wrap ? { wrap: true, crossGap: o.crossGap ?? o.gap ?? 0 } : {}),
          ...(o.cross ? { crossAlign: o.cross } : {}),
          ...(o.main ? { mainAlign: o.main } : {}),
        }
      : {}),
  }
  const id = await create('frame', {
    parent,
    name: o.name ?? 'frame',
    x: o.x ?? 0,
    y: o.y ?? 0,
    width: o.w ?? 100,
    height: o.h ?? 100,
    props,
  })
  if (props.layout) await set(id, { sizingH: o.sh ?? (o.w ? 'fixed' : 'hug'), sizingV: o.sv ?? (o.h ? 'fixed' : 'hug') })
  if (o.fill) await bind(id, 'fill', VAR[o.fill])
  if (o.stroke) {
    await set(id, { strokes: [HEX[o.stroke]], strokeWeight: 1, strokeAlign: 'inside' })
    await bind(id, 'stroke', VAR[o.stroke])
  }
  return id
}

async function text(parent, characters, o = {}) {
  const props = {
    fontFamily: o.mono ? 'Maple Mono' : SANS,
    fontStyle: o.weight ?? 'Regular',
    fontSize: o.size ?? 14,
    lineHeight: o.lineHeight ?? (o.size >= 24 ? '125%' : '150%'),
    fills: [HEX[o.color ?? 'text']],
    ...(o.letterSpacing ? { letterSpacing: o.letterSpacing } : {}),
  }
  const id = await create('text', {
    parent,
    name: o.name ?? characters.slice(0, 40),
    text: characters,
    ...(o.w ? { width: o.w } : {}),
    props,
  })
  if (o.w) await set(id, { textAutoResize: 'height' })
  await bind(id, 'fill', VAR[o.color ?? 'text'])
  return id
}

async function boardHeader(board, title, description) {
  const header = await frame(board, { name: 'Board header', gap: 10 })
  await text(header, title, { name: 'Title', size: 36, weight: 'Bold', letterSpacing: '-3.5%' })
  await text(header, description, { name: 'Description', size: 16, color: 'muted', w: 880, lineHeight: '165%' })
  return header
}

async function board(name, x, y, title, description) {
  const id = await frame(undefined, { name, x, y, fill: 'surface', radius: 24, pad: 56, gap: 28, clip: true })
  await boardHeader(id, title, description)
  return id
}

// ── 1. Record how each Icon instance is coloured, before its vectors are replaced.

async function iconVariants() {
  const list = await f.run('component.list', {})
  const setNode = list.find(c => c.type === 'COMPONENT_SET' && c.name === 'Icon' && c.page === ICONS_PAGE)
  if (!setNode) throw new Error('No "Icon" component set on the Icons page')
  return {
    setId: setNode.id,
    variants: list
      .filter(c => c.type === 'COMPONENT' && c.folder.at(-1) === 'Icon' && c.page === ICONS_PAGE)
      .map(c => {
        const [, name, size] = c.name.match(/^Name=(\w+), Size=(\d+)$/) ?? []
        if (!name) throw new Error(`Unexpected Icon variant ${c.name}`)
        return { id: c.id, name, size: +size }
      }),
  }
}

async function recordInstanceColours(variantIds) {
  const doc = await f.tool('inspect_document', { allPages: true, depth: 80 })
  const records = []
  const walk = n => {
    if (n.type === 'INSTANCE' && variantIds.has(n.mainComponent)) {
      let variable = null
      const visit = c => {
        variable ??= c.boundVariables?.stroke ?? c.boundVariables?.fill ?? null
        for (const k of c.children ?? []) visit(k)
      }
      for (const c of n.children ?? []) visit(c)
      records.push({ id: n.id, variable })
    }
    for (const c of n.children ?? []) walk(c)
  }
  for (const p of doc.pages) for (const c of p.children ?? []) walk(c)
  return records
}

// ── 2. Redraw each variant of the Icon set.

async function redrawVariants(variants) {
  for (const v of variants) {
    const turn = ICON_TURNS[v.name]
    const shape = turn ? turn.shape : v.name
    if (!ICONS[shape]) throw new Error(`The icon pack has no ${v.name}`)
    const old = (await children(v.id)).map(c => c.id)
    if (old.length) await f.run('edit.delete', { ids: old })
    await drawIcon(v.id, shape, { size: v.size, rotate: turn?.rotate ?? 0 })
    await set(v.id, { description: `${ICON_NOTES[shape].note}${turn ? ` Turned ${turn.rotate}°.` : ''}` })
  }
}

async function restoreInstanceColours(records) {
  const commands = []
  for (const r of records) {
    if (!r.variable || r.variable === VAR.text) continue
    for (const c of await descendants(r.id)) {
      if (c.type !== 'VECTOR') continue
      commands.push({
        command: 'variable.bind',
        params: { ids: [c.id], field: c.name === 'dot' ? 'fill' : 'stroke', variable: r.variable },
      })
    }
  }
  await batched(commands, 'Restore icon colours')
  return commands.length
}

// ── 3. The Icons page text.

const SET_DESCRIPTION =
  'The Code Reps icon pack, drawn for this app from the logo. A 24px grid with 2px of air, 1.8px rounded strokes, and soft 2.5–3px corners; shapes come from the logo’s code bracket and code line. The part that matters in an icon (the line in the lesson, the day in the calendar, the stem of info and alert, the search handle) is the rep line: the logo’s lime line, drawn at the same weight as the rest of the icon and set apart only by colour. Shown at 18px by default (16px in InfoNote, 14px in trail markers). Icons inherit the control colour and are hidden from assistive technology; visible labels carry the meaning. The “Icon” component set has Name × Size variants; bind the vector strokes of an instance to recolour it.'
const SET_CODE =
  'Code: src/icon-pack.ts (shapes and reactions) → Icon.tsx, icons.css, icon-pack.css (yarn icons); this page: yarn design:icons'
const RULE_TEXT = {
  'Forward actions and row navigation. In primary buttons it nudges 2px on hover; in list rows it slides into reserved space.':
    'Forward actions and row navigation, drawn as the code arrow ->. When the button or row is hovered, focused, or pressed, the head nudges on and the rep line follows; in list rows the arrow also slides into reserved space.',
  'Check: success, selection, completed. Close: dismissal and clearing (quarter-turn on hover). Alert: failed checks summary.':
    'Check: success, selection, completed; it grows a little. Close: dismissal and clearing; it turns a quarter. Alert: failed checks summary; it shakes once. Result summaries play their reaction when the result arrives.',
}

async function rewriteIconsPageText(setBoard, rulesBoard) {
  for (const c of await descendants(setBoard)) {
    if (c.type !== 'TEXT') continue
    if (c.name === 'Description') await set(c.id, { characters: SET_DESCRIPTION })
    else if (c.characters?.startsWith('Code: ')) await set(c.id, { characters: SET_CODE })
  }
  // Usage table: rows of [name, where and why].
  const usage = (await children(setBoard)).find(c => c.name === 'Usage')
  if (usage)
    for (const row of await children(usage.id)) {
      const cells = (await children(row.id)).filter(c => c.type === 'TEXT')
      const name = cells[0]?.characters
      if (ICONS[name]) await set(cells[1].id, { characters: ICON_NOTES[name].use })
    }
  for (const c of await descendants(rulesBoard))
    if (c.type === 'TEXT' && RULE_TEXT[c.characters]) await set(c.id, { characters: RULE_TEXT[c.characters] })
}

// ── 4. Icons/Pack: anatomy and rules.

const GRID = 9 // px per grid unit on the anatomy stage

async function anatomyCard(parent, shape, caption) {
  const card = await frame(parent, { name: `Anatomy/${shape}`, fill: 'bg', radius: 16, pad: 20, gap: 14, w: 256 })
  const stage = await frame(card, { name: 'Stage', w: 216, h: 216, fill: 'surface', radius: 8, clip: true, dir: null })
  let grid = ''
  for (let i = 0; i <= 24; i++) grid += `M${i * GRID} 0V${24 * GRID}M0 ${i * GRID}H${24 * GRID}`
  const gridId = await create('vector', {
    parent: stage,
    name: 'Grid',
    path: grid,
    props: { fills: [], strokes: [HEX.border], strokeWeight: 0.5 },
  })
  await bind(gridId, 'stroke', VAR.border)
  const air = await create('rectangle', {
    parent: stage,
    name: 'Live area (2px air)',
    x: 2 * GRID,
    y: 2 * GRID,
    width: 20 * GRID,
    height: 20 * GRID,
    props: { fills: [], strokes: [HEX.accent], strokeWeight: 1, dashes: [4, 4], cornerRadius: 2 },
  })
  await bind(air, 'stroke', VAR.accent)
  await drawIcon(stage, shape, { size: 24 * GRID, mark: 'accent' })
  const row = await frame(card, { name: 'Sizes', dir: 'horizontal', gap: 14, cross: 'center' })
  for (const size of [24, 18, 16, 14]) {
    const box = await frame(row, { name: `${size}px`, w: size, h: size, dir: null })
    await drawIcon(box, shape, { size })
  }
  await text(card, `${shape} · 24, 18, 16, 14px`, { size: 15, weight: 'Semibold' })
  await text(card, caption, { size: 13, color: 'muted', w: 216 })
}

async function ruleCard(parent, title, body) {
  const card = await frame(parent, { name: `Rule/${title}`, fill: 'bg', radius: 16, pad: 20, gap: 8, w: 280 })
  await text(card, title, { size: 15, weight: 'Semibold' })
  await text(card, body, { size: 13, color: 'muted', w: 240 })
}

async function buildPackBoard(x, y) {
  const id = await board(
    'Icons/Pack',
    x,
    y,
    'Code Reps icon pack',
    'Drawn for Code Reps, not taken from a library. Every icon is built from the logo’s two strokes, the code bracket and the code line, so the set reads as one family with the logo. The dashed square is the live area: 2px of air on the 24px grid. Green marks the rep line.',
  )
  const anatomy = await frame(id, { name: 'Anatomy', dir: 'horizontal', gap: 20, wrap: true, w: 1300 })
  await anatomyCard(anatomy, 'code', 'The logo in small: two brackets and three code lines. The middle line is the rep line.')
  await anatomyCard(
    anatomy,
    'arrow',
    'Forward: a bracket head with the rep line as its shaft. The head nudges on first and the shaft follows.',
  )
  await anatomyCard(anatomy, 'book', 'A lesson is a notebook: the spine, the rep line, and a thinner second line of text.')
  await anatomyCard(anatomy, 'calendar', 'The marked day is a dot in the rep-line colour. On hover it moves on to the next day.')
  const rules = await frame(id, { name: 'Rules', dir: 'horizontal', gap: 20, wrap: true, w: 1300 })
  await ruleCard(
    rules,
    'Grid and strokes',
    '24 × 24 grid, 2px of air round the edge. 1.8px strokes with round ends and joins; soft 2.5–3px corners on closed shapes. Scale the whole icon; never thin the stroke.',
  )
  await ruleCard(
    rules,
    'The rep line',
    'At most one per icon, for the part that matters. As in the logo, it has the same weight as the brackets; only its colour can differ: var(--icon-mark, currentColor), so a dark surface can light it in the logo’s lime. Dots (the points of info and alert, the calendar day) take the same colour.',
  )
  await ruleCard(
    rules,
    'Reactions',
    'Each icon answers once when the button or link round it is hovered, reached with Tab, or pressed: 240–560ms, a few px, transform only, inside its own 24px box. Result icons also play when the result arrives. No reactions with reduced motion.',
  )
  await ruleCard(
    rules,
    'In code',
    '<Icon name="arrow" /> draws inline SVG from src/icon-pack.ts. <Icon play={value} /> plays on mount and when the value changes; <Icon still /> never reacts. yarn icons regenerates icon-pack.css (keyframes, mask images); yarn design:icons redraws this page.',
  )
  return id
}

// ── 5. Icons/Reactions: rest → peak for every icon, with a hoverable prototype component.

const EASING = { spring: 'bouncy', standard: 'easeOut' }

async function reactionComponents(parent) {
  const ids = []
  for (const shape of ICON_SHAPES) {
    for (const state of ['Rest', 'Peak']) {
      const id = await create('component', {
        parent,
        name: `Name=${shape}, State=${state}`,
        width: 48,
        height: 48,
        props: { fills: [], clip: false },
      })
      await drawIcon(id, shape, { size: 48, pose: state === 'Peak', names: true })
      ids.push({ id, shape, state })
    }
  }
  await f.run('component.combineVariants', { ids: ids.map(v => v.id) })
  for (const shape of ICON_SHAPES) {
    const rest = ids.find(v => v.shape === shape && v.state === 'Rest').id
    const peak = ids.find(v => v.shape === shape && v.state === 'Peak').id
    const r = REACTIONS[ICONS[shape].react]
    await f.run('proto.interaction.add', {
      id: rest,
      trigger: { type: 'onHover' },
      action: { type: 'changeTo', dest: peak },
      transition: { type: 'smartAnimate' },
      durationMs: Math.round(r.ms * 0.45),
      easing: EASING[r.ease],
    })
  }
  return ids
}

async function buildReactionsBoard(x, y) {
  const id = await board(
    'Icons/Reactions',
    x,
    y,
    'Icon reactions',
    'Every icon answers when it is pointed at: hover or Tab onto the button or link it sits in, or press it, and it plays one short reaction that fits what it shows. The arrow nudges on, the brackets open, the flag flutters, the marked day moves on. Each row shows the icon at rest and at the height of its reaction, with the moving parts in green. Present this board and hover the large icons to play them.',
  )
  const grid = await frame(id, { name: 'Reactions', dir: 'horizontal', gap: 16, wrap: true, w: 1300 })
  await text(
    id,
    'Component “Icon reaction” (Name × State): the Rest variant changes to Peak while hovered, with smart animate at the reaction’s easing.',
    {
      size: 13,
      color: 'muted',
      w: 880,
    },
  )
  const parts = await frame(id, { name: 'Prototype parts', dir: 'horizontal', gap: 12, wrap: true, w: 1300 })
  const ids = await reactionComponents(parts)
  const setNode = (await f.run('component.list', {})).find(c => c.type === 'COMPONENT_SET' && c.page === ICONS_PAGE && c.name !== 'Icon')
  if (!setNode) throw new Error('Could not combine the reaction variants')
  await set(setNode.id, {
    name: 'Icon reaction',
    description: 'Rest and Peak of each icon reaction. Rest changes to Peak on hover (smart animate).',
  })
  for (const shape of ICON_SHAPES) {
    const icon = ICONS[shape]
    const r = REACTIONS[icon.react]
    const cell = await frame(grid, { name: `Reaction/${shape}`, fill: 'bg', radius: 16, pad: 18, gap: 10, w: 308 })
    const stage = await frame(cell, { name: 'Stage', dir: 'horizontal', gap: 14, cross: 'center' })
    const rest = ids.find(v => v.shape === shape && v.state === 'Rest').id
    const live = await f.run('instance.create', { component: rest, parent: stage })
    await set(live.id, { name: `Hover: ${shape}` })
    const still = await frame(stage, { name: 'Rest', w: 32, h: 32, dir: null })
    await drawIcon(still, shape, { size: 32 })
    const arrowBox = await frame(stage, { name: 'to', w: 16, h: 16, dir: null })
    await drawIcon(arrowBox, 'arrow', { size: 16, color: 'muted' })
    const peak = await frame(stage, { name: 'Peak', w: 32, h: 32, dir: null })
    await drawIcon(peak, shape, { size: 32, pose: true, moving: 'accent' })
    await text(cell, shape, { size: 15, weight: 'Semibold' })
    const names = [
      ...new Set(
        iconParts(shape)
          .layers.flatMap(l => (l.reaction ? [l.reaction.name] : []))
          .concat(icon.whole ? [icon.react] : []),
      ),
    ]
    await text(
      cell,
      `${names.join(' + ')} · ${r.ms}ms · ${r.ease === 'spring' ? 'spring' : 'ease'}${icon.stagger ? ` · ${icon.stagger}ms stagger` : ''}`,
      {
        size: 12,
        color: 'muted',
        mono: true,
        w: 272,
      },
    )
    await text(cell, ICON_NOTES[shape].note, { size: 13, color: 'muted', w: 272 })
  }
  await f.run('proto.flow.add', { start: id, name: 'Icon reactions' })
  return id
}

// ── 6. Previews.

const PREVIEWS = [
  ['09-icons-set.png', ['Icons/Set']],
  ['10-icons-rules.png', ['Icons/Rules']],
  ['10a-icons-pack.png', ['Icons/Pack']],
  ['10b-icons-reactions.png', ['Icons/Reactions']],
  ...[
    'Brand',
    'StatusChip',
    'Button',
    'Fields',
    'Navigation',
    'Lists',
    'Feedback',
    'Trail',
    'Cards',
    'Practice',
    'Overlays',
    'PageHeader',
    'Redesign additions',
  ].map((name, i) => [`${11 + i}-components-${name.toLowerCase().replace(/ /g, '-')}.png`, [`Components/${name}`]]),
  ['24-screen-trail.png', ['Screen/Desktop/Trail · Your trail']],
  ['25-screen-all-tracks.png', ['Screen/Desktop/Trail · All tracks']],
  ['26-screen-library.png', ['Screen/Desktop/Library · Exercises']],
  ['27-screen-lesson.png', ['Screen/Desktop/Library · Lesson']],
  ['28-screen-projects.png', ['Screen/Desktop/Library · Projects']],
  ['29-screen-practice.png', ['Screen/Desktop/Practice · Understand']],
  ['30-screen-practice-failed-checks.png', ['Screen/Desktop/Practice · Failed checks']],
  ['31-screen-progress.png', ['Screen/Desktop/Progress · Skills']],
  ['32-screen-skill-map.png', ['Screen/Desktop/Progress · Skill map']],
  ['33-screen-journal.png', ['Screen/Desktop/Progress · Journal']],
  ['34-screen-search.png', ['Screen/Desktop/Search']],
  ['35-screens-phone.png', ['Screens/Narrow overview']],
  ['36-proposal-learning-evidence-light.png', ['Learning evidence — Sage Light']],
  ['37-proposal-learning-evidence-dark.png', ['Learning evidence — Sage Dark']],
  ['38-proposal-learning-evidence-phone.png', ['Narrow 390 — Sage Light', 'Narrow 390 — Sage Dark'], 11637],
  ['39-proposal-achievement-badges-light.png', ['Achievement badges — Sage Light']],
  ['40-proposal-achievement-badges-dark.png', ['Achievement badges — Sage Dark']],
  ['42-proposal-zero-to-hero-light.png', ['Zero to hero — Sage Light']],
  ['43-proposal-zero-to-hero-dark.png', ['Zero to hero — Sage Dark']],
  ['44-proposal-zero-to-hero-phone.png', ['Narrow 390 — Sage Light', 'Narrow 390 — Sage Dark'], 16206],
]

async function exportPreviews() {
  const doc = await f.tool('inspect_document', { allPages: true, depth: 1 })
  const frames = doc.pages.flatMap(p =>
    (p.children ?? []).map(c => ({ page: p.id, id: c.id, name: c.name, x: c.absoluteBounds.x, width: c.width })),
  )
  // Keep each existing preview's width (some boards are exported at half size): a PNG's width is bytes 16–19.
  const pngWidth = file => (existsSync(file) ? readFileSync(file).readUInt32BE(16) : null)
  for (const [png, names, page] of PREVIEWS) {
    const ids = names.map(name => {
      const match = frames.filter(c => c.name === name && (!page || c.page === page))
      if (match.length !== 1) throw new Error(`Preview ${png}: expected one frame named ${name}, found ${match.length}`)
      return match[0].id
    })
    const chosen = ids.map(id => frames.find(c => c.id === id))
    const span = Math.max(...chosen.map(c => c.x + c.width)) - Math.min(...chosen.map(c => c.x))
    const existing = pngWidth(path.join(previews, png))
    const scale = existing ? +(existing / span).toFixed(4) : 1
    await f.run('page.select', { id: chosen[0].page })
    await f.tool('export', { ids, format: 'png', scale, path: path.join(previews, png) })
  }
}

// ── Run.

try {
  await f.tool('open_file', { path: file })
  await f.run('page.select', { id: ICONS_PAGE })
  const top = await f.tool('inspect_document', { depth: 1 })
  const page = top.pages.find(p => p.id === ICONS_PAGE)
  const setBoard = page.children.find(c => c.name === 'Icons/Set')
  const rulesBoard = page.children.find(c => c.name === 'Icons/Rules')
  if (!setBoard || !rulesBoard) throw new Error('The Icons page needs its Icons/Set and Icons/Rules boards')

  // Remove the boards (and the reaction components) this script owns, so it can run again.
  const owned = page.children.filter(c => c.name === 'Icons/Pack' || c.name === 'Icons/Reactions').map(c => c.id)
  if (owned.length) await f.run('edit.delete', { ids: owned })

  const { variants } = await iconVariants()
  const records = await recordInstanceColours(new Set(variants.map(v => v.id)))
  console.log(
    `${variants.length} Icon variants, ${records.length} instances (${records.filter(r => r.variable && r.variable !== VAR.text).length} recoloured)`,
  )
  await redrawVariants(variants)
  const restored = await restoreInstanceColours(records)
  console.log(`restored ${restored} vector colours`)
  await rewriteIconsPageText(setBoard.id, rulesBoard.id)

  await f.run('page.select', { id: ICONS_PAGE })
  const below = Math.max(setBoard.y + setBoard.height, rulesBoard.y + rulesBoard.height) + 160
  await buildPackBoard(0, below)
  const pack = (await f.tool('inspect_document', { depth: 1 })).pages
    .find(p => p.id === ICONS_PAGE)
    .children.find(c => c.name === 'Icons/Pack')
  await buildReactionsBoard(0, pack.y + pack.height + 160)

  await f.tool('save_file', { path: file })
  console.log('saved', file)
  await exportPreviews()
  console.log('previews in', previews)
} finally {
  f.close()
}
