import { parseBackup } from './portability.ts'
import { parseFluency } from './fluency.ts'
export type ProfileBackup = { format: 'code-reps-profile'; version: 1; name: string; exportedAt: string; entries: Record<string,string> }
export function parseProfileBackup(text: string, repIds: Set<string>): ProfileBackup {
  if(text.length>2_000_000)throw new Error('Profile file exceeds the local import limit of 2 MB.')
  let value: unknown
  try{value=JSON.parse(text)}catch{throw new Error('Profile file is not valid JSON.')}
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('This is not a valid local profile export.')
  const raw=value as Record<string,unknown>
  if(raw.format!=='code-reps-profile'||raw.version!==1||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>60||!raw.entries||typeof raw.entries!=='object'||Array.isArray(raw.entries)||Object.keys(raw.entries).length>1000)throw new Error('This is not a valid local profile export.')
  const entries=raw.entries as Record<string,string>
  const allowed=new Set(['history:v1','learner-start:v1','fluency:v1','selected-rep','split-width',...Array.from(repIds,id=>`attempt:${id}:v1`)])
  if(Object.entries(entries).some(([k,v])=>!allowed.has(k)||typeof v!=='string'||v.length>1_000_000))throw new Error('This profile contains unsupported or invalid entries.')
  let history,drafts
  try{history=JSON.parse(entries['history:v1']??'[]');drafts=Object.fromEntries(Array.from(repIds).flatMap(id=>{const raw=entries[`attempt:${id}:v1`];return raw?[[id,JSON.parse(raw)]]:[]}))}catch{throw new Error('Profile contains unreadable learner records.')}
  parseBackup(JSON.stringify({format:'code-reps-backup',version:1,learnerStart:entries['learner-start:v1']??null,history,drafts}),repIds)
  if(entries['fluency:v1'])parseFluency(JSON.parse(entries['fluency:v1']))
  if(entries['selected-rep']&&!repIds.has(entries['selected-rep']))throw new Error('Profile refers to an unknown selected exercise.')
  if(entries['split-width']&&(Number(entries['split-width'])<25||Number(entries['split-width'])>60||!Number.isFinite(Number(entries['split-width']))))throw new Error('Invalid workspace preference.')
  return {format:'code-reps-profile',version:1,name:raw.name.trim(),exportedAt:typeof raw.exportedAt==='string'?raw.exportedAt:'',entries}
}
