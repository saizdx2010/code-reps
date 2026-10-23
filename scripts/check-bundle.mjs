import { readFile, readdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const manifest = JSON.parse(await readFile(join(dist, '.vite/manifest.json'), 'utf8'))
// Manifest IDs of the startup chunks: the app entry and everything it imports statically.
const startupIds = new Set()
const visitStartup = id => {
  if (startupIds.has(id)) return
  startupIds.add(id)
  for (const dependency of manifest[id]?.imports ?? []) visitStartup(dependency)
}
visitStartup('index.html')
const filesFor = (key, dynamic = false) => {
  const files = new Set()
  const visited = new Set()
  const visit = id => {
    if (visited.has(id)) return
    visited.add(id)
    const entry = manifest[id]
    if (!entry) throw new Error(`Missing bundle entry: ${id}`)
    if (entry.file.endsWith('.js')) files.add(entry.file)
    for (const dependency of entry.imports ?? []) visit(dependency)
    // Shared imports may point back to startup chunks (the app entry, or a chunk split from it); their other routes and
    // lazy content are separate.
    if (dynamic && !startupIds.has(id)) for (const dependency of entry.dynamicImports ?? []) visit(dependency)
  }
  visit(key)
  return files
}
const initial = filesFor('index.html')
// Vim keys load only for learners who turn them on, so their chunk has its own budget instead of the editor's. It shares
// the editor's Monaco chunks, which stay in the editor group.
const vimEntry = manifest['node_modules/monaco-vim/dist/index.mjs']
if (!vimEntry) throw new Error('Missing bundle entry: monaco-vim')
const vimKeys = new Set([vimEntry.file])
const editor = filesFor('src/CodeEditor.tsx', true).difference(initial).difference(vimKeys)
const frontend = filesFor('src/FrontendPreview.tsx', true).union(filesFor('src/frontend-run.ts', true)).difference(initial)
const assets = await readdir(join(dist, 'assets'))
const workers = assets.filter(name => /^(ts|editor|runner)\.worker-.*\.js$/.test(name)).map(name => `assets/${name}`)
if (workers.length !== 3) throw new Error('Expected the editor, TypeScript, and practice workers')
// Worker builds have their own chunks outside the app manifest. Include lazy and shared JS.
const workerFiles = new Set(workers)
for (const file of workerFiles) {
  const code = await readFile(join(dist, file), 'utf8')
  for (const match of code.matchAll(/["'`](\.\/[^"'`]+\.js)["'`]/g)) workerFiles.add(join('assets', match[1]))
}
const groups = [
  // The startup catalog and path data grow with each track's stages, journeys, lessons, and rep entries; raised from
  // 153,000 for the SQL track after moving track introductions out of startup and compacting the catalog rows, from
  // 157,500 for the icon pack, whose inline SVG shapes replaced CSS mask images, and from 159,000 for the Trail warm-up
  // and the drawer's type-check note after the comparisons and mistake habits moved out of startup, and from 160,500 for
  // the Today set's navigation in the workspace, and from 161,000 for the Break it format's workspace switch and the
  // Game of Life catalog rows, and from 161,500 for the practice header's way back to the page a rep was opened from
  // (see docs/PERFORMANCE.md).
  { name: 'Initial JavaScript', files: [...initial], limit: 162_500, rawLimit: 530_000 },
  { name: 'Additional editor JavaScript', files: [...editor], limit: 1_050_000, rawLimit: 4_200_000 },
  // About 10% above the 30,703 gzip / 100,124 raw bytes of monaco-vim 0.4.4; see docs/PERFORMANCE.md.
  { name: 'Vim keys JavaScript', files: [...vimKeys], limit: 34_000, rawLimit: 110_000 },
  { name: 'Additional frontend JavaScript', files: [...frontend], limit: 1_050_000, rawLimit: 3_900_000 },
  // The practice worker bundles every rep's checks and text, so its raw size grows with the catalog. Raised from 12,000,000
  // for the DevOps track; see docs/PERFORMANCE.md for the measurements.
  { name: 'Local worker JavaScript', files: [...workerFiles], limit: 3_100_000, rawLimit: 12_150_000 },
  // Every stylesheet the first page needs. Set at about 5% above 157,475 raw / 28,762 gzip bytes; see docs/PERFORMANCE.md.
  { name: 'Initial CSS', files: [...startupIds].flatMap(id => manifest[id]?.css ?? []), limit: 30_200, rawLimit: 165_000 },
]
const report = []
for (const group of groups) {
  if (!group.files.length) throw new Error(`No files found for ${group.name}`)
  let rawBytes = 0
  let gzipBytes = 0
  for (const file of group.files) {
    const content = await readFile(join(dist, file))
    rawBytes += content.length
    gzipBytes += gzipSync(content).length
  }
  report.push({ name: group.name, rawBytes, gzipBytes, limit: group.limit, rawLimit: group.rawLimit, files: group.files })
  console.log(`${group.name}: ${gzipBytes.toLocaleString('en-US')} gzip bytes / ${group.limit.toLocaleString('en-US')} budget`)
}
await writeFile(join(dist, 'bundle-size.json'), JSON.stringify(report, null, 2) + '\n')
const exceeded = report.filter(group => group.gzipBytes > group.limit || group.rawBytes > group.rawLimit)
if (exceeded.length) throw new Error(`Bundle budget exceeded: ${exceeded.map(group => group.name).join(', ')}`)
const unused = assets.filter(name => /^(css|html|json)\.worker-/.test(name))
if (unused.length) throw new Error(`Unused language workers were bundled: ${unused.join(', ')}`)
