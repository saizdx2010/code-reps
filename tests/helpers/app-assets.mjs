import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Writes a minimal built app so server tests do not depend on a prior `yarn build`. */
export async function writeAppAssets(assetsDir) {
  await mkdir(join(assetsDir, 'assets'), { recursive: true })
  await writeFile(join(assetsDir, 'index.html'), '<main>Code Reps</main>')
  await writeFile(join(assetsDir, 'assets', 'app-123.js'), 'export {}')
  return assetsDir
}
