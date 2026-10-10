import { useState } from 'react'
import { decodeFiles, encodeFiles } from './project-files'
import { SolutionEditor } from './SolutionEditor'
import type { ComponentProps } from 'react'
type Props = ComponentProps<typeof SolutionEditor>
export function ProjectEditor(props: Props) {
  const project = decodeFiles(String(props.value ?? ''))
  const [selected,setSelected] = useState(project?.entry ?? 'solution.ts')
  if(!project)return <SolutionEditor {...props}/>
  const filename = selected in project.files ? selected : project.entry
  const base = props.path?.replace(/solution\.ts$/, '') ?? ''
  const siblingFiles = Object.fromEntries(Object.entries(project.files).filter(([name]) => name !== filename).map(([name, content]) => [`${base}${name}`, content]))
  return <><div className="project-file-tabs" role="group" aria-label="Project files">{Object.keys(project.files).map(name=><button type="button" key={name} aria-pressed={filename===name} onClick={()=>setSelected(name)}>{name}{name===project.entry?' · entry':''}</button>)}</div><SolutionEditor {...props} key={filename} path={`${base}${filename}`} siblingFiles={siblingFiles} value={project.files[filename]} onChange={value=>props.onChange(encodeFiles({...project,files:{...project.files,[filename]:value}}))}/></>
}
