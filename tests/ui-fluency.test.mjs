import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { JSDOM } from 'jsdom'

// Run the actual React profile/hub flows in a DOM. Monaco's unrelated native worker
// loading is stubbed; real code execution and module integration have separate tests.
test('local profiles isolate learning drafts, knowledge checks, notes and goal preferences',async()=>{
  const rootDir=await mkdtemp(join(process.cwd(),'node_modules/.fluency-ui-'))
  let root
  const dom=new JSDOM('<div id="root"></div>',{url:'http://127.0.0.1:4187/',pretendToBeVisual:true})
  const original=new Map()
  const bind=(key,value)=>{original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true})}
  try {
    for(const key of ['window','document','localStorage','sessionStorage','location','history','HTMLElement','HTMLDialogElement','Event','MouseEvent','CSS','navigator'])bind(key,dom.window[key])
    bind('self',dom.window);bind('IS_REACT_ACT_ENVIRONMENT',true)
    bind('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}))
    bind('ResizeObserver',class{observe(){} disconnect(){}})
    bind('requestAnimationFrame',callback=>setTimeout(callback,0));bind('cancelAnimationFrame',clearTimeout)
    dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=()=>{}
    dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false}
    bind('CSS',{escape:value=>value.replaceAll('"','\\"')})
    // Offline/dev mode uses browser storage with the exact production store implementation.
    bind('fetch',async()=>new Response('',{status:404}))
    for(const name of await readdir('src')) {
      if(!/\.tsx?$/.test(name))continue
      let source=await readFile(join('src',name),'utf8')
      source=source.replace(/import ['"]\.\/[^'"]+\.css['"]\s*;?/g,'')
      let js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText
      js=js.replace(/(from\s*['"]|import\(['"])(\.\/[^'"]+)(['"])/g,(_,prefix,path,suffix)=>prefix+path.replace(/\.(ts|tsx)$/,'')+'.js'+suffix)
      if(name==='CodeEditor.tsx')js='import {jsx} from "react/jsx-runtime"; export default function Editor(props){return jsx("textarea",{"aria-label":"Test code editor",value:props.value,onChange:e=>props.onChange(e.target.value)})}'
      await writeFile(join(rootDir,name.replace(/\.tsx?$/,'.js')),js)
    }
    const {act}=await import('react');const {createRoot}=await import('react-dom/client')
    const {initializeStorage}=await import(pathToFileURL(join(rootDir,'local-store.js')))
    await initializeStorage()
    // Seed a legacy learner to prove migration before opening the app.
    localStorage.setItem('code-reps:history:v1','[]')
    const {default:ProfileApp}=await import(pathToFileURL(join(rootDir,'ProfileApp.js')))
    const {jsx}=await import('react/jsx-runtime')
    root=createRoot(document.getElementById('root'))
    await act(async()=>root.render(jsx(ProfileApp,{})))
    assert.equal(localStorage.getItem('code-reps:history:v1'),null)
    assert.equal(localStorage.getItem('code-reps:profile:default:history:v1'),'[]')
    const button=(text)=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text || b.getAttribute('aria-label')===text)
    const click=async(text)=>{const target=button(text);assert.ok(target,`Missing button ${text}`);await act(async()=>target.click())}
    const input=async(element,value)=>{assert.ok(element);await act(async()=>{const setter=Object.getOwnPropertyDescriptor(element.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:element.tagName==='SELECT'?dom.window.HTMLSelectElement.prototype:dom.window.HTMLInputElement.prototype,'value').set;setter.call(element,value);element.dispatchEvent(new dom.window.Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}))})}
    await click('Learn')
    const nextLesson = document.querySelector('.knowledge-topic-list button:nth-child(2)')
    await act(async()=>nextLesson.click())
    await act(async()=>new Promise(resolve=>setTimeout(resolve,10)))
    assert.equal(document.activeElement,document.querySelector('.knowledge-reading'))
    await act(async()=>document.querySelector('.knowledge-topic-list button').click())
    assert.ok(document.body.textContent.includes('Values, types, and functions'))
    assert.equal(document.querySelectorAll('.top-nav button').length,4)
    assert.ok([...document.querySelectorAll('.top-nav button')].some(button=>button.textContent==='Learn'))
    assert.equal(document.querySelectorAll('.knowledge-group').length,6)
    const topic=document.querySelector('.knowledge-index select')
    await input(topic,'async')
    assert.equal(document.querySelectorAll('.knowledge-group').length,1)
    assert.ok(document.querySelector('.knowledge-group summary').textContent.includes('Async & runtime'))
    await input(document.querySelector('.knowledge-index input[type="search"]'),'Cancellation and race conditions')
    assert.equal(document.querySelectorAll('.knowledge-topic-list button').length,1)
    await click('Clear knowledge filters')
    await click('Quick lessons')
    assert.equal(window.location.hash,'#/learn')
    assert.ok(document.body.textContent.includes('Quick lessons'))
    await click('Browse knowledge')
    assert.equal(window.location.hash,'#/knowledge')
    assert.equal(document.querySelector('.knowledge-index select').value,'')
    await click('Predict')
    const radios=document.querySelectorAll('input[name="values:return"]')
    await act(async()=>radios[1].click())
    await click('Check prediction')
    assert.ok(document.body.textContent.includes('Correct prediction.'))
    await click('Notebook');await click('New entry')
    assert.equal(document.querySelector('.section-nav [aria-current="page"]').textContent,'Notebook')
    assert.equal(document.querySelectorAll('.section-nav [aria-current="page"]').length,1)
    await input(document.querySelector('input[maxlength="120"]'),'Return is not printing')
    await input(document.querySelector('textarea'),'I need to return a value to the caller.')
    await click('Save entry')
    assert.ok(document.body.textContent.includes('Entry saved.'))
    const saved=JSON.parse(localStorage.getItem('code-reps:profile:default:fluency:v1'))
    assert.equal(saved.notes[0].title,'Return is not printing');assert.equal(saved.answers['values:return'].correct,true)
    await click('New entry');await input(document.querySelector('input[maxlength="120"]'),'An unfinished thought')
    const savedWithDraft=localStorage.getItem('code-reps:profile:default:fluency:v1')
    await click('Manage profiles');await input(document.querySelector('.profile-dialog input[maxlength="60"]'),'Second learner');await click('Create profile')
    assert.ok(document.querySelector('.profile-trigger').textContent.includes('Second learner'))
    await click('Close');await click('Learn');await click('Notebook')
    assert.ok(document.body.textContent.includes('Your notebook is empty.'))
    assert.equal(localStorage.getItem('code-reps:profile:default:fluency:v1'),savedWithDraft)
    await click('Manage profiles');await input(document.querySelector('.profile-dialog select'),'default');await click('Close')
    await click('Learn');await click('Notebook')
    assert.ok(document.body.textContent.includes('Return is not printing'));assert.equal(document.querySelector('input[maxlength="120"]').value,'An unfinished thought');await click('Cancel')
    await click('Home');await click('Practice plan')
    const goal=document.querySelector('.hub-form-row select');await input(goal,'backend')
    assert.equal(JSON.parse(localStorage.getItem('code-reps:profile:default:fluency:v1')).goal.pathId,'backend')
    const budget=document.querySelector('.hub-form-row input[type="number"]')
    await input(budget,'');assert.equal(budget.value,'')
    assert.equal(JSON.parse(localStorage.getItem('code-reps:profile:default:fluency:v1')).goal.minutes,20)
    await input(budget,'35');assert.equal(budget.value,'35')
    assert.equal(JSON.parse(localStorage.getItem('code-reps:profile:default:fluency:v1')).goal.minutes,35)
    assert.ok(budget.classList.contains('ui-input'))
    assert.ok(goal.classList.contains('ui-select-native'))
    assert.ok(document.querySelector('.hub-form-row [role=combobox]').classList.contains('ui-select'))

    await click('Progress');await click('Self-assessment');await click('Start assessment')
    assert.ok(JSON.parse(localStorage.getItem('code-reps:profile:default:fluency:v1')).diagnosticStartedAt)
    await click('Practice');await click('Interview');await click('Start round')
    assert.ok(document.body.textContent.includes('Time remaining'))
    await click('Round controls and debrief');await click('End round and review')
    await input(document.querySelector('.learning-hub textarea'),'I need clearer assumptions next time.')
    const round=JSON.parse(localStorage.getItem('code-reps:profile:default:fluency:v1')).rounds[0]
    assert.ok(round.endedAt);assert.equal(round.debrief,'I need clearer assumptions next time.')
    await click('Projects')
    const milestones=[...document.querySelectorAll('button')].filter(b=>b.textContent==='Open milestone')
    await act(async()=>{milestones[3].click();await new Promise(resolve=>setTimeout(resolve,30))})
    assert.ok(document.body.textContent.includes('Integrate a multi-file team directory'))
    await click('data.ts')
    await input(document.querySelector('textarea[aria-label="Test code editor"]'),'export function visiblePeople() { return [] }')
    await click('Manage profiles')
    await act(async()=>window.dispatchEvent(new Event('code-reps-save-current',{cancelable:true})))
    const project=JSON.parse(JSON.parse(localStorage.getItem('code-reps:profile:default:attempt:project-team-directory:v1')).code)
    assert.equal(project.files['data.ts'],'export function visiblePeople() { return [] }')
    assert.ok(project.files['directory.ts'].includes('mountDirectory'))
    await click('Close')
    await click('Learn')
    await act(async()=>[...document.querySelectorAll('.section-nav button')].find(button=>button.textContent==='Lessons').click())
    await input(document.querySelector('.knowledge-index select'),'async')
    await click('Practice')
    await click('Learn')
    assert.equal(document.querySelector('.knowledge-index select').value,'async')
    assert.equal(document.querySelectorAll('.knowledge-group').length,1)
    await click('Clear knowledge filters')
    const search=document.querySelector('.knowledge-index input[type="search"]')
    await input(search,'no-such-topic')
    assert.ok(document.body.textContent.includes('No matching knowledge.'))
    await click('Clear knowledge filters')

    // Real profile drafts feed the Home queue; expanding must not discard hidden work.
    await click('Practice')
    for(const title of ['Keep search results consistent','Recall ownership across preview slots','Refresh a report without losing its data','Reject obsolete request results']) {
      const row=[...document.querySelectorAll('.rep-list-row')].find(row=>row.textContent.includes(title))
      assert.ok(row)
      await act(async()=>row.click())
      await input(document.querySelector('#plan'),'Preserve this draft')
      await click('Practice')
    }
    await click('Home')
    assert.equal(document.querySelectorAll('#home-drafts>li').length,3)
    const expand=[...document.querySelectorAll('button')].find(button=>/^Show all .* drafts$/.test(button.textContent))
    assert.ok(expand)
    await act(async()=>expand.click())
    assert.equal(document.querySelectorAll('#home-drafts>li').length,5)
    await click('Learn');await click('Home')
    assert.equal(document.querySelectorAll('#home-drafts>li').length,5)
    await click('Show fewer drafts')
    assert.equal(document.querySelectorAll('#home-drafts>li').length,3)

    await click('Manage profiles')
    let finishImport
    const pendingFile={text:()=>new Promise(resolve=>{finishImport=resolve})}
    const fileInput=document.querySelector('.profile-dialog input[type="file"]')
    Object.defineProperty(fileInput,'files',{value:[pendingFile],configurable:true})
    await act(async()=>fileInput.dispatchEvent(new Event('change',{bubbles:true})))
    assert.equal(document.querySelector('.profile-dialog [role="status"]').textContent,'Importing profile…')
    assert.equal(button('Create profile').disabled,true)
    await act(async()=>finishImport('{}'))
    assert.notEqual(document.querySelector('.profile-dialog [role="status"]').textContent,'Importing profile…')
    assert.equal(button('Close').disabled,false)
    await click('Close')

    const {default:FrontendPreview}=await import(pathToFileURL(join(rootDir,'FrontendPreview.js')))
    const {reps}=await import(pathToFileURL(join(rootDir,'rep.js')))
    const frontend=reps.find(rep=>rep.format==='frontend')
    assert.ok(frontend)
    await act(async()=>root.render(jsx(FrontendPreview,{code:frontend.starter,rep:frontend})))
    await click('Update preview')
    const frame=document.querySelector('iframe')
    const frameWindow=frame.contentWindow
    await click('Expand preview')
    assert.equal(document.querySelector('iframe'),frame)
    assert.equal(frame.contentWindow,frameWindow)
    await click('Exit expanded preview')
    assert.equal(document.querySelector('iframe'),frame)
    assert.equal(frame.contentWindow,frameWindow)
    await act(async()=>new Promise(resolve=>setTimeout(resolve,10)))
    assert.equal(document.activeElement,button('Expand preview'))

  }finally{
    if(root){const {act}=await import('react');await act(async()=>root.unmount())}
    dom.window.close()
    for(const [key,descriptor] of original)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]
    await rm(rootDir,{recursive:true,force:true})
  }
})
