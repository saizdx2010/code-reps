import { useState } from 'react'
import { decodeFiles, encodeFiles } from './project-files'
import { SolutionEditor } from './SolutionEditor'
import type { ComponentProps } from 'react'
type Props = ComponentProps<typeof SolutionEditor> & { showHeader?: boolean }
export function ProjectEditor({ showHeader, ...props }: Props) {
  const project = decodeFiles(String(props.value ?? ''))
  const [selected,setSelected] = useState(project?.entry ?? 'solution.ts')
  const filename = project ? selected in project.files ? selected : project.entry : 'solution.ts'
  const header = showHeader && <div className="editor-top"><span className="file-tab"><span className="ts-icon">TS</span> {filename}</span><span className="editor-hint">Ctrl / ⌘ Enter to run</span></div>
  if(!project)return <>{header}<SolutionEditor {...props}/></>
  const base = props.path?.replace(/solution\.ts$/, '') ?? ''
  const siblingFiles = Object.fromEntries(Object.entries(project.files).filter(([name]) => name !== filename).map(([name, content]) => [`${base}${name}`, content]))
  return <>{header}<div className="project-file-tabs" role="group" aria-label="Project files">{Object.keys(project.files).map(name=><button type="button" key={name} aria-pressed={filename===name} onClick={()=>setSelected(name)}>{name}{name===project.entry?' · entry':''}</button>)}</div><SolutionEditor {...props} key={filename} path={`${base}${filename}`} siblingFiles={siblingFiles} value={project.files[filename]} onChange={value=>props.onChange(encodeFiles({...project,files:{...project.files,[filename]:value}}))}/></>
}
