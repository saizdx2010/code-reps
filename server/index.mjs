import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { join, resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStore } from './store.mjs'
import { maxRequestBytes } from './storage-keys.mjs'

const distDir = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(value))
}

async function readJson(request) {
  // Decode once at the end: a multi-byte character can be split across chunks.
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    // Keep reading without storing, so the client gets this error instead of a reset connection.
    if (size <= maxRequestBytes) chunks.push(chunk)
  }
  if (size > maxRequestBytes) throw new Error('Request is too large.')
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new Error('Invalid JSON.')
  }
}

/** The request's `entries`, or a validation error for a body that is not a JSON object. */
async function readEntries(request) {
  const body = await readJson(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request body.')
  return body.entries
}

export async function startServer({ port = Number(process.env.CODE_REPS_PORT || 4173), dataDir, assetsDir = distDir } = {}) {
  const appDir = resolve(assetsDir)
  try {
    if (!(await stat(join(appDir, 'index.html'))).isFile()) throw new Error('Missing index')
  } catch {
    throw new Error('The built app is missing. Run yarn build or replace the portable bundle before starting.')
  }
  const store = createStore(dataDir)
  try {
    if (store.existed) await store.makeBackup()
  } catch (error) {
    await store.close()
    throw error
  }
  let boundPort = port
  const server = createServer(async (request, response) => {
    const host = request.headers.host
    // Keep the bound address while close() drains already accepted requests.
    const expectedHost = `127.0.0.1:${boundPort}`
    if (host !== expectedHost) return sendJson(response, 403, { error: 'This server accepts local requests only.' })
    const origin = request.headers.origin
    if (origin && origin !== `http://${expectedHost}`) return sendJson(response, 403, { error: 'This request came from another site.' })
    const pathname = new URL(request.url || '/', `http://${expectedHost}`).pathname
    try {
      if (pathname === '/api/state' && request.method === 'GET') return sendJson(response, 200, { entries: store.entries() })
      if (pathname === '/api/migrate' && request.method === 'POST') {
        return sendJson(response, 200, store.migrate(await readEntries(request)))
      }
      if (pathname === '/api/entries' && request.method === 'PATCH') {
        store.applyEntries(await readEntries(request))
        return sendJson(response, 200, { saved: true })
      }
      if (pathname.startsWith('/api/')) return sendJson(response, 404, { error: 'Unknown endpoint.' })
      if (request.method !== 'GET' && request.method !== 'HEAD') return sendJson(response, 405, { error: 'Method not allowed.' })
      const candidate = resolve(appDir, `.${pathname}`)
      if (!candidate.startsWith(`${appDir}${sep}`) && candidate !== appDir) return sendJson(response, 403, { error: 'Invalid path.' })
      let file = candidate
      try {
        if (!(await stat(file)).isFile()) throw new Error('Not a file')
      } catch {
        if (pathname.startsWith('/assets/') || extname(pathname))
          return sendJson(response, 404, {
            error: 'This app file is missing. Stop the server, rebuild or replace the bundle, then reload.',
          })
        file = join(appDir, 'index.html')
      }
      const content = await readFile(file)
      response.writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      response.end(request.method === 'HEAD' ? undefined : content)
    } catch (error) {
      sendJson(response, error instanceof Error && /Invalid|large/.test(error.message) ? 400 : 500, {
        error: error instanceof Error ? error.message : 'Server error.',
      })
    }
  })
  try {
    await new Promise((done, reject) => {
      server.once('error', reject)
      server.listen(port, '127.0.0.1', () => {
        boundPort = server.address().port
        server.removeListener('error', reject)
        done()
      })
    })
  } catch (error) {
    await store.close()
    throw error
  }
  const timer = setInterval(() => store.makeBackup().catch(error => process.stderr.write(`Backup failed: ${error}\n`)), 24 * 60 * 60 * 1000)
  server.on('close', () => {
    clearInterval(timer)
    void store.close().catch(error => process.stderr.write(`Closing progress failed: ${error}\n`))
  })
  async function close() {
    if (server.listening) await new Promise((done, reject) => server.close(error => (error ? reject(error) : done())))
    await store.close()
  }
  return { server, store, close, url: `http://127.0.0.1:${server.address().port}` }
}

// Node resolves symlinks for the main module, so compare real paths (a bundle may sit under a symlinked folder).
function isEntryPoint() {
  try {
    return Boolean(process.argv[1]) && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
}

if (isEntryPoint()) {
  startServer()
    .then(({ url, store, close }) => {
      process.stdout.write(`Code Reps is running at ${url}\nData: ${store.dbPath}\n`)
      const shutdown = () => {
        void close()
          .catch(error => {
            process.stderr.write(`${error}\n`)
            process.exitCode = 1
          })
          .finally(() => {
            if (process.connected) process.disconnect()
          })
      }
      process.once('SIGINT', shutdown)
      process.once('SIGTERM', shutdown)
      // A parent smoke-test process can close the bundled Windows runtime cleanly.
      if (process.connected)
        process.on('message', message => {
          if (message === 'shutdown') shutdown()
        })
    })
    .catch(error => {
      process.stderr.write(`${error}\n`)
      process.exitCode = 1
    })
}
