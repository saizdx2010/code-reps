export const browserStateSolutions = {
  'task-state-label': `type TaskState = {kind: 'draft'; title: string} | {kind: 'saved'; title: string; done: boolean} | {kind: 'failed'; message: string}
function taskLabel(state: TaskState): string {
  switch (state.kind) {
    case 'failed': return 'Error: ' + state.message
    case 'saved': return (state.done ? 'Done: ' : 'Open: ') + state.title
    case 'draft': return state.title.trim().length ? 'Draft: ' + state.title.trim() : 'Untitled draft'
  }
}`,
  'saved-record-status': `type SaveResult = {status: 'idle'} | {status: 'saved'; count: number} | {status: 'failed'; reason: string; recoverable: boolean}
function saveStatus(result: SaveResult): {text: string; retry: boolean} {
  switch (result.status) {
    case 'failed': return {text: result.reason, retry: result.recoverable}
    case 'saved': return {text: ['Saved', result.count, 'books'].join(' '), retry: false}
    case 'idle': return {text: 'Not saved', retry: false}
  }
}`,
  'catalog-request-summary': `type CatalogRequest = {status: 'pending'; id: string} | {status: 'ready'; id: string; titles: string[]} | {status: 'failed'; id: string; error: string}
function requestSummary(requests: CatalogRequest[]): {pending: string[]; empty: string[]; errors: {id: string; message: string}[]} {
  return {
    pending: requests.flatMap(request => request.status === 'pending' ? [request.id] : []),
    empty: requests.flatMap(request => request.status === 'ready' && request.titles.length === 0 ? [request.id] : []),
    errors: requests.flatMap(request => request.status === 'failed' ? [{id: request.id, message: request.error}] : []),
  }
}`,
}
