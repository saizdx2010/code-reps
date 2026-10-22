// Minimal client for `figcraft-cli mcp` (stdio JSON-RPC), so the design file can be built from code.
import { spawn } from 'node:child_process'
import os from 'node:os'

export async function connect() {
  const proc = spawn(`${os.homedir()}/.local/bin/figcraft-cli`, ['mcp'], { stdio: ['pipe', 'pipe', 'inherit'] })
  let buf = ''
  let nextId = 0
  const pending = new Map()
  proc.stdout.on('data', chunk => {
    buf += chunk
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i)
      buf = buf.slice(i + 1)
      if (!line.trim()) continue
      const msg = JSON.parse(line)
      pending.get(msg.id)?.(msg)
      pending.delete(msg.id)
    }
  })
  const rpc = (method, params) =>
    new Promise(resolve => {
      const id = ++nextId
      pending.set(id, resolve)
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    })

  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'kata-design', version: '1' } })
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')

  async function tool(name, args = {}) {
    const res = await rpc('tools/call', { name, arguments: args })
    if (res.error) throw new Error(`${name}: ${res.error.message}`)
    const r = res.result
    if (r.isError) throw new Error(`${name} ${JSON.stringify(args).slice(0, 300)}: ${r.content?.map(c => c.text).join(' ')}`)
    const text = r.content?.find(c => c.type === 'text')?.text
    try {
      return text ? JSON.parse(text) : r
    } catch {
      return text
    }
  }

  return {
    tool,
    run: (command, params = {}) => tool('run_command', { command, params }),
    close: () => proc.kill(),
  }
}
