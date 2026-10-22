import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { renderIconCss } from '../scripts/icon-pack.mjs'
import { pathBounds, poseMatrix, transformPath } from '../design/tools/icon-geometry.mjs'
import { ICONS, ICON_NOTES, ICON_SHAPES, REACTIONS, STROKE, circle, iconParts } from '../src/icon-pack.ts'

const layerBounds = (layer, matrix) => {
  const d = layer.dot ? circle(...layer.dot) : layer.d
  const box = pathBounds(matrix ? transformPath(d, matrix) : d)
  const half = layer.dot ? 0 : STROKE / 2
  return { x0: box.x0 - half, y0: box.y0 - half, x1: box.x1 + half, y1: box.y1 + half }
}

test('the generated icon stylesheet matches the icon pack', () => {
  assert.equal(
    readFileSync(new URL('../src/icon-pack.css', import.meta.url), 'utf8'),
    renderIconCss(),
    'Run `yarn icons` and commit src/icon-pack.css.',
  )
})

test('every icon keeps about 2px of air on the 24px grid at rest', () => {
  for (const shape of ICON_SHAPES)
    for (const layer of ICONS[shape].layers) {
      const box = layerBounds(layer)
      for (const edge of [box.x0, box.y0]) assert.ok(edge >= 1.75, `${shape} reaches ${edge} from the top-left edge`)
      for (const edge of [box.x1, box.y1]) assert.ok(edge <= 22.25, `${shape} reaches ${edge} toward the bottom-right edge`)
    }
})

test('every reaction pose stays inside the icon box and returns to rest', () => {
  for (const shape of ICON_SHAPES) {
    const { layers, whole } = iconParts(shape)
    for (const layer of layers) {
      const reaction = whole ?? layer.reaction
      if (!reaction) continue
      for (const [, pose] of REACTIONS[reaction.name].frames) {
        const box = layerBounds(layer, poseMatrix(pose, reaction.origin))
        for (const edge of [box.x0, box.y0]) assert.ok(edge >= 0, `${shape} (${reaction.name}) leaves its box at ${edge}`)
        for (const edge of [box.x1, box.y1]) assert.ok(edge <= 24, `${shape} (${reaction.name}) leaves its box at ${edge}`)
      }
    }
  }
  for (const [name, reaction] of Object.entries(REACTIONS)) {
    assert.ok(reaction.ms >= 200 && reaction.ms <= 600, `${name} should be short`)
    // Turns end a whole symmetry away from rest; other reactions must not end on a moved pose.
    const last = reaction.frames.at(-1)
    if (last[0] === 100) assert.ok(last[1].r && Object.keys(last[1]).length === 1, `${name} ends away from rest`)
  }
})

test('icons that move use reactions that exist, and the pack has one rep line at most per icon', () => {
  for (const shape of ICON_SHAPES) {
    const icon = ICONS[shape]
    assert.ok(REACTIONS[icon.react], `${shape} reacts with an unknown reaction`)
    assert.ok(icon.whole || icon.layers.some(layer => layer.move), `${shape} has nothing that moves`)
    assert.ok(icon.layers.filter(layer => layer.mark).length <= 1, `${shape} has more than one rep line`)
    assert.ok(ICON_NOTES[shape]?.note && ICON_NOTES[shape]?.use, `${shape} needs a note and a use`)
  }
})
