// Path geometry for the icon pack: normalise SVG paths to absolute M/L/C/Z so the design build can scale, turn, and pose
// them (FigCraft vectors take path data, not transforms), and so tests can measure each icon's bounds.
// Adapted from the Kata design tools.

const n = v => +v.toFixed(2)

function tokenize(d) {
  return d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) ?? []
}

function arcToCubics(x1, y1, rx, ry, phi, large, sweep, x2, y2) {
  if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]]
  const rad = (phi * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const xp = cos * dx + sin * dy
  const yp = -sin * dx + cos * dy
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry)
  if (lam > 1) {
    rx *= Math.sqrt(lam)
    ry *= Math.sqrt(lam)
  }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp
  const den = rx * rx * yp * yp + ry * ry * xp * xp
  let coef = Math.sqrt(Math.max(0, num / den))
  if (large === sweep) coef = -coef
  const cxp = (coef * rx * yp) / ry
  const cyp = (-coef * ry * xp) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const ang = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    return a
  }
  const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry)
  let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry)
  if (!sweep && dt > 0) dt -= 2 * Math.PI
  if (sweep && dt < 0) dt += 2 * Math.PI
  const segs = Math.ceil(Math.abs(dt) / (Math.PI / 2))
  const step = dt / segs
  const k = (4 / 3) * Math.tan(step / 4)
  const out = []
  let t = t1
  const pt = a => [cx + rx * Math.cos(a) * cos - ry * Math.sin(a) * sin, cy + rx * Math.cos(a) * sin + ry * Math.sin(a) * cos]
  const dpt = a => [-rx * Math.sin(a) * cos - ry * Math.cos(a) * sin, -rx * Math.sin(a) * sin + ry * Math.cos(a) * cos]
  for (let i = 0; i < segs; i++) {
    const a = t
    const b = t + step
    const [ax, ay] = pt(a)
    const [bx, by] = pt(b)
    const [dax, day] = dpt(a)
    const [dbx, dby] = dpt(b)
    out.push([ax + k * dax, ay + k * day, bx - k * dbx, by - k * dby, bx, by])
    t = b
  }
  return out
}

/** Parses a path into absolute segments: ['M', x, y] | ['L', x, y] | ['C', x1, y1, x2, y2, x, y] | ['Z']. */
export function normalizePath(d) {
  const tk = tokenize(d)
  const out = []
  let i = 0
  let cmd = ''
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  let lastC = null
  const num = () => parseFloat(tk[i++])
  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++]
    const rel = cmd === cmd.toLowerCase()
    const ox = rel ? x : 0
    const oy = rel ? y : 0
    const C = cmd.toUpperCase()
    let ctrl = null
    if (C === 'M') {
      x = ox + num()
      y = oy + num()
      sx = x
      sy = y
      out.push(['M', x, y])
      cmd = rel ? 'l' : 'L'
    } else if (C === 'L') {
      x = ox + num()
      y = oy + num()
      out.push(['L', x, y])
    } else if (C === 'H') {
      x = ox + num()
      out.push(['L', x, y])
    } else if (C === 'V') {
      y = oy + num()
      out.push(['L', x, y])
    } else if (C === 'C' || C === 'S') {
      let x1
      let y1
      if (C === 'C') {
        x1 = ox + num()
        y1 = oy + num()
      } else {
        x1 = lastC ? 2 * x - lastC[0] : x
        y1 = lastC ? 2 * y - lastC[1] : y
      }
      const x2 = ox + num()
      const y2 = oy + num()
      x = ox + num()
      y = oy + num()
      out.push(['C', x1, y1, x2, y2, x, y])
      ctrl = [x2, y2]
    } else if (C === 'A') {
      const rx = num()
      const ry = num()
      const phi = num()
      const large = num()
      const sweep = num()
      const nx = ox + num()
      const ny = oy + num()
      for (const c of arcToCubics(x, y, rx, ry, phi, large, sweep, nx, ny)) out.push(['C', ...c])
      x = nx
      y = ny
    } else if (C === 'Z') {
      out.push(['Z'])
      x = sx
      y = sy
    } else {
      throw new Error(`Unsupported path command ${cmd} in ${d}`)
    }
    lastC = ctrl
  }
  return out
}

export function pathBounds(d) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const s of normalizePath(d)) {
    for (let k = 1; k < s.length; k += 2) {
      x0 = Math.min(x0, s[k])
      x1 = Math.max(x1, s[k])
      y0 = Math.min(y0, s[k + 1])
      y1 = Math.max(y1, s[k + 1])
    }
  }
  return { x0, y0, x1, y1 }
}

/** The pose as a 2D matrix about an origin, in the order CSS applies translate() rotate() scale(). */
export function poseMatrix(p, [ox, oy]) {
  const r = ((p.r ?? 0) * Math.PI) / 180
  const sx = (p.s ?? 1) * (p.sx ?? 1)
  const sy = (p.s ?? 1) * (p.sy ?? 1)
  const a = Math.cos(r) * sx
  const b = Math.sin(r) * sx
  const c = -Math.sin(r) * sy
  const dd = Math.cos(r) * sy
  const tx = p.x ?? 0
  const ty = p.y ?? 0
  return (x, y) => [ox + tx + a * (x - ox) + c * (y - oy), oy + ty + b * (x - ox) + dd * (y - oy)]
}

export function transformPath(d, m) {
  return normalizePath(d)
    .map(s => {
      if (s[0] === 'Z') return 'Z'
      const pts = []
      for (let k = 1; k < s.length; k += 2) pts.push(...m(s[k], s[k + 1]).map(n))
      return s[0] + pts.join(' ')
    })
    .join('')
}

/** A pose matrix that also turns the whole icon about its centre first (the down, left, and right variants). */
export const turnMatrix = degrees => poseMatrix({ r: degrees }, [12, 12])

/** Scales grid units to a display size. */
export const scaleMatrix = factor => (x, y) => [x * factor, y * factor]
