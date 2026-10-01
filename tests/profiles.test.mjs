import test from 'node:test'
import assert from 'node:assert/strict'
import { legacyMigration, parseProfiles, scopedKey } from '../src/profiles.ts'
import { createLocalStore } from '../src/local-store.ts'
class MemoryStorage { data=new Map(); get length(){return this.data.size} key(i){return [...this.data.keys()][i]??null} getItem(k){return this.data.get(k)??null} setItem(k,v){this.data.set(k,v)} removeItem(k){this.data.delete(k)} }
test('legacy migration preserves existing progress and excludes storage infrastructure',()=>{
  const entries={'code-reps:history:v1':'old','code-reps:attempt:sum-positive-numbers:v1':'draft','code-reps:pending-writes:v1':'journal','code-reps:server-mode:v1':'true'}
  const updates=legacyMigration(entries)
  assert.equal(updates[scopedKey('default','code-reps:history:v1')],'old')
  assert.equal(updates['code-reps:history:v1'],null)
  assert.equal(updates['code-reps:server-mode:v1'],undefined)
  const collision=legacyMigration({...entries,[scopedKey('default','code-reps:history:v1')]:'new'})
  assert.equal(collision[scopedKey('default','code-reps:history:v1')],undefined)
})
test('profile-scoped drafts and history persist separately through server synchronization',async()=>{
  const storage=new MemoryStorage();let entries={};const request=async(url,options)=>{
    if(options?.method==='PATCH')entries={...entries,...JSON.parse(options.body).entries}
    return new Response(JSON.stringify({entries}),{headers:{'content-type':'application/json'}})
  }
  const store=createLocalStore({storage,request,onError(){}});await store.initializeStorage()
  const a=scopedKey('default','code-reps:history:v1');const b=scopedKey('other','code-reps:history:v1')
  store.localStore.setEntries({[a]:'first learner',[b]:'second learner'});await store.flushStorage()
  assert.equal(entries[a],'first learner');assert.equal(entries[b],'second learner')
  assert.notEqual(a,b)
})
test('registry rejects duplicate IDs and malformed profiles without resetting data',()=>{
  const registry=parseProfiles(null);assert.equal(registry.profiles[0].id,'default')
  assert.throws(()=>parseProfiles(JSON.stringify({...registry,profiles:[...registry.profiles,...registry.profiles]})))
  assert.throws(()=>scopedKey('../escape','code-reps:history:v1'))
  assert.throws(()=>parseProfiles('not json'))
})

test('full profile imports validate attempts, notes, assessments and preferences before any write',async()=>{
  const {parseProfileBackup}=await import('../src/profile-backup.ts');const {emptyFluency}=await import('../src/fluency.ts');const {reps}=await import('../src/rep.ts')
  const ids=new Set(reps.map(r=>r.id))
  const profile={format:'code-reps-profile',version:1,name:'Learner',entries:{'history:v1':'[]','fluency:v1':JSON.stringify(emptyFluency()),'selected-rep':reps[0].id,'split-width':'35'}}
  assert.equal(parseProfileBackup(JSON.stringify(profile),ids).name,'Learner')
  assert.throws(()=>parseProfileBackup(JSON.stringify({...profile,entries:{...profile.entries,'profiles:v1':'[]'}}),ids),/unsupported/)
  assert.throws(()=>parseProfileBackup(JSON.stringify({...profile,entries:{...profile.entries,'history:v1':'[{"bad":true}]'}}),ids),/attempt/)
  assert.throws(()=>parseProfileBackup(JSON.stringify({...profile,entries:{...profile.entries,'split-width':'NaN'}}),ids),/preference/)
  assert.throws(()=>parseProfileBackup(JSON.stringify({...profile,entries:{...profile.entries,'fluency:v1':'{}'}}),ids),/invalid/)
})
