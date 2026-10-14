export const typescriptDepthSolutions = {
  'guard-contact-input':
    "type Contact = {name: string; subscribed: boolean}\nfunction isContact(value: unknown): value is Contact { return typeof value === 'object' && value !== null && !Array.isArray(value) && 'name' in value && typeof value.name === 'string' && 'subscribed' in value && typeof value.subscribed === 'boolean' }\nfunction readContact(value: unknown): Contact | null { if (!isContact(value)) return null; const name = value.name.trim(); return name.length >= 1 && name.length <= 40 ? {name, subscribed: value.subscribed} : null }",
  'exhaustive-delivery-label':
    "type Delivery = {kind: 'queued'} | {kind: 'sent'; receipt: string} | {kind: 'rejected'; reason: string}\nfunction deliveryLabel(delivery: Delivery): string { switch(delivery.kind) { case 'queued': return 'Queued'; case 'sent': return 'Sent: '+delivery.receipt; case 'rejected': return 'Rejected: '+delivery.reason; default: { const unhandled: never = delivery; throw new Error(String(unhandled)) } } }",
  'generic-prefix-copy':
    'function takePrefix<T>(items: readonly T[], count: number): T[] { const output: T[] = []; for (let i=0; i<Math.min(count,items.length); i++) output.push(items[i]); return output }',
  'typed-record-lookup':
    "type Lookup<T> = {kind: 'found'; value: T} | {kind: 'missing'; id: string}\nfunction lookupRecord<T extends {id: string}>(records: readonly T[], id: string): Lookup<T> { for (const record of records) if (record.id === id) return {kind:'found',value:record}; return {kind:'missing',id} }",
  'sensor-import-report':
    "type Reading = {channel: string; reading: number}\nfunction isReading(v: unknown): v is Reading { return typeof v==='object' && v!==null && !Array.isArray(v) && 'channel' in v && typeof v.channel==='string' && v.channel.length>=1 && v.channel.length<=20 && 'reading' in v && typeof v.reading==='number' && Number.isInteger(v.reading) && v.reading>=-100 && v.reading<=100 }\nfunction sensorReport(values: readonly unknown[]): {accepted: {channel:string;total:number}[];rejected:number[]} { const groups=new Map<string,number>(); const rejected:number[]=[]; values.forEach((v,i)=>{if(!isReading(v)) rejected.push(i); else groups.set(v.channel,(groups.get(v.channel)??0)+v.reading)}); return {accepted:[...groups].map(([channel,total])=>({channel,total})),rejected} }",
}
