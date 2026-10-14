// Reference implementations of the fluency rep contracts.
export const fluencySolutions = {
  'sum-matching-prices':
    'function availableTotal(items: {price:number;available:boolean}[]) { let total=0; for(const item of items) if(item.available) total+=item.price; return total }',
  'count-open-tickets':
    'function countPriority(tickets:{open:boolean;priority:number}[], minimum:number) { return tickets.filter(t=>t.open && t.priority>=minimum).length }',
  'first-label-ending':
    'function firstEnding(labels:string[], ending:string) { return labels.find(label=>label.trim().toLowerCase().endsWith(ending.toLowerCase())) ?? null }',
  'count-label-prefix':
    'function countPrefix(labels:string[], prefix:string) { const query=prefix.trim().toLowerCase(); return labels.filter(label=>label.trim() && label.trim().toLowerCase().startsWith(query)).length }',
  'first-duplicate-label':
    'function duplicateLabel(labels:string[]) { const seen=new Set<string>(); for(const raw of labels) { const label=raw.trim(); if(!label) continue; if(seen.has(label)) return label; seen.add(label) } return null }',
  'count-statuses':
    'function countStatuses(statuses: ("open"|"closed")[]) { const counts={open:0,closed:0}; for(const status of statuses) counts[status]++; return counts }',
  'remaining-actions':
    'function remainingActions(actions:string[]) { const stack:string[]=[]; for(const action of actions) { if(action==="UNDO") stack.pop(); else stack.push(action) } return stack }',
  'cancel-adjacent-ids':
    'function cancelIds(ids:number[]) { const stack:number[]=[]; for(const id of ids) { if(stack.length && stack.at(-1)===id) stack.pop(); else stack.push(id) } return stack }',
  'validate-page-query':
    'function validatePaging(input:unknown) { if(!input || typeof input!=="object" || Array.isArray(input)) return null; const x=input as Record<string,unknown>; if(typeof x.page!=="number" || !Number.isInteger(x.page) || x.page<1 || typeof x.size!=="number" || !Number.isInteger(x.size) || x.size<1 || x.size>50) return null; return {page:x.page,size:x.size} }',
  'derive-task-summary':
    'function taskSummary(tasks:{title:string;done:boolean}[], query:string) { const pending=tasks.filter(t=>!t.done); const q=query.trim().toLowerCase(); return {titles:pending.filter(t=>t.title.toLowerCase().includes(q)).map(t=>t.title),remaining:pending.length} }',
  'debug-page-offset':
    'function pageWindow(ids:string[],page:number,size:number) { const start=(page-1)*size; return ids.slice(start,start+size) }',
}
