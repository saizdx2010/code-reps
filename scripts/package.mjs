import { cp, mkdir, rm, writeFile, chmod } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../', import.meta.url)))
const output = join(root, 'release', `code-reps-${process.platform}-${process.arch}`)
const executable = process.platform === 'win32' ? 'node.exe' : 'node'

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(join(root, 'dist'), join(output, 'dist'), { recursive: true })
await cp(join(root, 'server'), join(output, 'server'), { recursive: true })
await cp(process.execPath, join(output, executable))
await cp(join(root, 'docs', 'PORTABLE_BUNDLE.md'), join(output, 'README.md'))

if (process.platform === 'win32') {
  await writeFile(join(output, 'Start Code Reps.cmd'), '@echo off\r\ncd /d "%~dp0"\r\nif "%CODE_REPS_PORT%"=="" set CODE_REPS_PORT=4173\r\necho Open http://127.0.0.1:%CODE_REPS_PORT% in your browser.\r\n"%~dp0node.exe" "%~dp0server\\index.mjs"\r\npause\r\n')
} else {
  const launcher = join(output, 'start-code-reps.sh')
  await writeFile(launcher, '#!/bin/sh\ncd "$(dirname "$0")" || exit 1\necho "Open http://127.0.0.1:${CODE_REPS_PORT:-4173} in your browser."\nexec ./node server/index.mjs\n')
  await chmod(launcher, 0o755)
}

process.stdout.write(`Portable bundle: ${output}\n`)
