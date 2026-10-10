import { readFile, readdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const manifest = JSON.parse(await readFile(join(dist, '.vite/manifest.json'), 'utf8'))
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
    // Shared imports may point back to the app entry; its other routes are separate.
    if (dynamic && id !== 'index.html') for (const dependency of entry.dynamicImports ?? []) visit(dependency)
  }
  visit(key)
  return files
}
const initial = filesFor('index.html')
const editor = filesFor('src/CodeEditor.tsx', true).difference(initial)
const frontend = filesFor('src/FrontendPreview.tsx', true).union(filesFor('src/frontend-run.ts', true)).difference(initial)
const assets = await readdir(join(dist, 'assets'))
const workers = assets.filter(name => /^(ts|editor|runner)\.worker-.*\.js$/.test(name)).map(name => `assets/${name}`)
if (workers.length !== 3) throw new Error('Expected the editor, TypeScript, and practice workers')
const groups = [
  { name: 'Initial JavaScript', files: [...initial], limit: 252_000, rawLimit: 860_000 },
  { name: 'Additional editor JavaScript', files: [...editor], limit: 1_050_000, rawLimit: 4_200_000 },
  { name: 'Additional frontend JavaScript', files: [...frontend], limit: 1_050_000, rawLimit: 3_900_000 },
  { name: 'Local worker JavaScript', files: workers, limit: 3_100_000, rawLimit: 11_200_000 },
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
