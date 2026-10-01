export type ProjectFiles = { entry: string; files: Record<string, string> }
export const encodeFiles = (project: ProjectFiles) => JSON.stringify({ format: 'code-reps-files', version: 1, ...project })
export function decodeFiles(code: string): ProjectFiles | null {
  if (!code.trimStart().startsWith('{')) return null
  let value: unknown
  try { value = JSON.parse(code) } catch { return null }
  if (!value || typeof value !== 'object' || !('format' in value) || value.format !== 'code-reps-files') return null
  const project = value as unknown as { version: unknown; entry: unknown; files: unknown }
  if (project.version !== 1 || typeof project.entry !== 'string' || !project.files || typeof project.files !== 'object' || Array.isArray(project.files)) throw new Error('The project files could not be read.')
  const files = project.files as Record<string, unknown>
  if (Object.keys(files).length < 1 || Object.keys(files).length > 12 || !(project.entry in files) || Object.entries(files).some(([name, content]) => !/^[a-z][a-z0-9-]*\.ts$/.test(name) || typeof content !== 'string' || content.length > 100_000)) throw new Error('Project files must be named TypeScript files with a valid entry.')
  return { entry: project.entry, files: files as Record<string, string> }
}
