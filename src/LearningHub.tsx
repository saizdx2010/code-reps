import { PageHeader } from './Layout'
import { goToView } from './ui-navigation'
import { Button } from './Button'
import { Icon } from './Icon'
import { learningPageTitles } from './learning-pages'
import type { HubTab } from './learning-pages'
import { screenNavigated } from './screen-focus'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { FluencyState } from './fluency'
import type { PortableRecord } from './portability'
import { LearningKnowledge } from './LearningKnowledge'
import { LearningNotebook } from './LearningNotebook'
import { LearningPlan } from './LearningPlan'
import { LearningAssessment } from './LearningAssessment'
import { LearningProjects } from './LearningProjects'
import { LearningInterview } from './LearningInterview'
export type { HubTab } from './learning-pages'

type Props = {
  journalTabs?: ReactNode
  tab: HubTab
  setTab: (tab: HubTab) => void
  state: FluencyState
  update: (next: FluencyState) => boolean
  error: string
  history: PortableRecord[]
  openRep: (id: string) => void
  reviewRep: (id: string) => void
  skillId: string
  onSkill: (id: string) => void
  onQuickLessons: () => void
  candidates: { repId: string; reason: string; mode?: string }[]
}

export function LearningHub(props: Props) {
  useEffect(() => {
    // Restore the page heading after a focused loading placeholder is replaced, but only after in-app navigation; a page load keeps focus at the top.
    if (screenNavigated() && document.activeElement === document.body) document.querySelector<HTMLElement>('.learning-hub h1')?.focus({ preventScroll: true })
  }, [])
  const { tab, setTab, state, update, history, openRep, reviewRep, onSkill } = props
  const [interviewMinutes, setInterviewMinutes] = useState(30)
  return <main className="learning-hub">
    <PageHeader
      eyebrow={tab === 'notebook' ? 'Journal' : undefined} title={learningPageTitles[tab].title} description={learningPageTitles[tab].description}
      actions={tab === 'notebook' ? props.journalTabs : undefined}
    />
    {props.error && <p role="alert">{props.error}</p>}
    {tab === 'knowledge' && <LearningKnowledge
      state={state} update={update} history={history} openRep={openRep} skillId={props.skillId} onSkill={onSkill} onQuickLessons={props.onQuickLessons}
    />}
    {tab === 'assessment' && <LearningAssessment
      state={state} update={update} history={history} reviewRep={reviewRep} onReviewSkill={id => { onSkill(id); setTab('knowledge') }}
    />}
    {tab === 'plan' && <LearningPlan state={state} update={update} history={history} openRep={openRep} reviewRep={reviewRep} candidates={props.candidates} />}
    {tab === 'notebook' && <LearningNotebook state={state} update={update} />}
    {tab === 'projects' && <LearningProjects state={state} update={update} history={history} openRep={openRep} openNotebook={() => setTab('notebook')} />}
    {tab === 'interview' && <LearningInterview
      state={state} update={update} openRep={openRep} reviewRep={reviewRep} minutes={interviewMinutes} setMinutes={setInterviewMinutes}
    />}
    {(tab === 'plan' || tab === 'assessment') && <p className="projects-more"><Button variant="text" onClick={() => goToView('progress')}>Back to Skills</Button></p>}
    {tab === 'interview' && <p className="projects-more"><Button variant="text" onClick={() => setTab('projects')}>Back to Projects</Button></p>}
    {tab === 'projects' && <p className="projects-more">
      Optional: <Button variant="text" onClick={() => setTab('interview')}>Timed interview practice<Icon name="arrow" /></Button>
    </p>}
  </main>
}
