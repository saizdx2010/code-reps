import { richReps } from './rich-reps.ts'
import { encodeFiles } from './project-files.ts'
import type { Rep } from './rep.ts'
const directory = richReps.find(r => r.id === 'frontend-directory')!
const tickets = richReps.find(r => r.id === 'backend-ticket-handler')!
export const capstoneReps: Rep[] = [
  {
    ...directory, id: 'project-team-directory', title: 'Integrate a multi-file team directory',
    context: 'Project integration: separate data selection from browser rendering. Edit the local TypeScript modules, then use the preview and interaction checks to verify the whole feature.',
    planPrompt: 'Define the contract of visiblePeople before rendering. Which request states return early? Explain how the rendering module will use the data module without mutating source records.',
    starter: encodeFiles({ entry: 'directory.ts', files: {
      'data.ts': 'export type Person = { name: string }\n\nexport function visiblePeople(people: Person[], query: string): Person[] {\n  // Return matching original people, preserving order and labels.\n  return []\n}\n',
      'directory.ts': 'import { visiblePeople } from "./data"\nimport type { Person } from "./data"\nexport type DirectoryState = { loading: boolean; error: string | null; people: Person[]; retry: () => void }\n\nexport function mountDirectory(root: HTMLElement, state: DirectoryState): void {\n  // Use visiblePeople for the current query, and render the request states.\n  root.replaceChildren()\n}\n',
    } }),
  },
  {
    ...tickets, id: 'project-ticket-api', title: 'Integrate a multi-file ticket API',
    context: 'Project integration: separate query validation from request handling. Keep the request and response contract from the ticket exercise and verify the integrated modules.',
    planPrompt: 'parseQuery returns null for any invalid query. Decide which inputs count as invalid. Trace filtering, matching total, and page slice in the handler. Explain which checks cover the boundary between the modules.',
    starter: encodeFiles({ entry: 'handler.ts', files: {
      'query.ts': 'export type Query = { status?: "open" | "closed"; search: string; page: number; size: number }\n\nexport function parseQuery(input: unknown): Query | null {\n  // Validate the query contract in the brief; use page 1 and size 2 defaults.\n  return null\n}\n',
      'handler.ts': 'import { parseQuery } from "./query"\nexport type Ticket = { id: string; title: string; status: "open" | "closed" }\n\nexport function handleTickets(request: { method: string; query: unknown }, tickets: Ticket[]): unknown {\n  // Check request.method, then parseQuery(request.query), filter and page matching tickets.\n  return { status: 400, body: { error: "INVALID_QUERY" } }\n}\n',
    } }),
  },
]
