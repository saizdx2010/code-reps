import { writeFile } from 'node:fs/promises'
import { renderCatalogIndex } from './catalog-index.mjs'

const target = new URL('../src/catalog-index.ts', import.meta.url)
await writeFile(target, renderCatalogIndex())
console.log('Wrote src/catalog-index.ts')
