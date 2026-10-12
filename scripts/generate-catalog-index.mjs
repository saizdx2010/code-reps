import { writeFile } from 'node:fs/promises'
import { renderCatalogIndex, renderRepChunks } from './catalog-index.mjs'

const target = new URL('../src/catalog-index.ts', import.meta.url)
await writeFile(target, renderCatalogIndex())
await writeFile(new URL('../src/rep-chunks.ts', import.meta.url), renderRepChunks())
console.log('Wrote src/catalog-index.ts and src/rep-chunks.ts')
