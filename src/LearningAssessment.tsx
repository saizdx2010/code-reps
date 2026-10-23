import { stageLabels } from './learning'
import { formatDate } from './ui-copy.ts'
import { InfoNote, ListGroup } from './Layout'
import { Button } from './Button'
import { judgmentLabels } from './learning-pages'
import { skills, knowledgeGroups } from './knowledge'
import { diagnosticRepIds, rubrics, skillEvidence } from './fluency'
import type { FluencyState } from './fluency'
import type { PortableRecord } from './portability'
import { repSummaryById } from './rep-index.ts'

type Props = {
  state: FluencyState
  update: (next: FluencyState) => boolean
  history: PortableRecord[]
  reviewRep: (id: string) => void
  onReviewSkill: (id: string) => void
}

/** The optional self-assessment: four short tasks, then the evidence gathered for every skill. */
export function LearningAssessment({ state, update, history, reviewRep, onReviewSkill }: Props) {
  const diagnostic = diagnosticRepIds.map(id => {
    const started = state.diagnosticStartedAt
    const attempts = history.filter(r => r.repId === id && started && Date.parse(r.completedAt) >= Date.parse(started))
    return { rep: repSummaryById.get(id)!, attempt: attempts[0] }
  })
  const missing = diagnostic.find(d => !d.attempt || d.attempt.hintCount)
  const focus = missing
    ? `${missing.rep.category}: ${missing.attempt ? 'try a related problem without hints.' : 'start here to gather evidence.'}`
    : 'You completed these tasks without revealed hints. Try a practical project and later recall to gather broader evidence.'
  return (
    <>
      <section className="hub-panel hub-section">
        <h2>A short self-assessment</h2>
        <InfoNote label="What this assessment shows">
          <p>
            Optional: solve four short tasks before using hints. Your code checks show behavior; review your reasoning separately. This is a
            snapshot of these skills, not an overall coding score.
          </p>
        </InfoNote>
        <Button variant="primary" type="button" onClick={() => update({ ...state, diagnosticStartedAt: new Date().toISOString() })}>
          {state.diagnosticStartedAt ? 'Start a new assessment' : 'Start assessment'}
        </Button>
        {state.diagnosticStartedAt && (
          <>
            <p>Started {formatDate(state.diagnosticStartedAt, true)}. Earlier attempts remain in History.</p>
            <ol className="milestone-list">
              {diagnostic.map(({ rep, attempt }) => (
                <li key={rep.id}>
                  <div>
                    <strong>{rep.title}</strong>
                    <p>
                      {attempt
                        ? `${attempt.hintCount ? 'Completed with help' : 'Completed without hints'} · ${formatDate(attempt.completedAt)}`
                        : 'No completed attempt since this assessment started.'}
                    </p>
                  </div>
                  <Button variant="text" type="button" onClick={() => reviewRep(rep.id)}>
                    Try from a fresh start
                  </Button>
                </li>
              ))}
            </ol>
            <p>
              <strong>Suggested focus:</strong> {focus}
            </p>
          </>
        )}
      </section>
      <div className="hub-evidence">
        {knowledgeGroups.map(group => (
          <ListGroup key={group.id} title={group.title} count={group.skillIds.length}>
            {skills
              .filter(skill => group.skillIds.includes(skill.id))
              .map(skill => (
                <SkillEvidenceCard
                  key={skill.id}
                  skillId={skill.id}
                  title={skill.title}
                  state={state}
                  history={history}
                  onReview={onReviewSkill}
                />
              ))}
          </ListGroup>
        ))}
      </div>
    </>
  )
}

type CardProps = { skillId: string; title: string; state: FluencyState; history: PortableRecord[]; onReview: (id: string) => void }

function SkillEvidenceCard({ skillId, title, state, history, onReview }: CardProps) {
  const evidence = skillEvidence(skillId, history, state)
  // The same ladder words as Skills and the skill map.
  const stage = evidence.retained
    ? stageLabels.retained
    : evidence.independent.length
      ? stageLabels.independent
      : evidence.attempts.length
        ? stageLabels.practising
        : stageLabels.learning
  const selfReview = evidence.selfReview
  return (
    <li>
      <details className="hub-panel evidence-card">
        <summary>
          <h3>{title}</h3>
          <span className="evidence-stage">{stage}</span>
        </summary>
        <div className="evidence-card-body">
          <p>
            {evidence.attempts.length} checked completions · {evidence.independent.length} without hints · {evidence.lessonCorrect}/
            {evidence.lessonTotal} latest predictions
          </p>
          <p>
            {evidence.retained ? 'Delayed recall recorded' : 'Later recall not recorded'}
            {selfReview ? ` · Self-reviewed ${formatDate(selfReview.updatedAt)}` : ' · No self-review yet'}
          </p>
          {selfReview && (
            <dl className="compact-rubric">
              {(Object.keys(rubrics) as (keyof typeof rubrics)[]).map(key => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{judgmentLabels[selfReview[key]]}</dd>
                </div>
              ))}
            </dl>
          )}
          <Button variant="text" type="button" onClick={() => onReview(skillId)}>
            Review your progress
          </Button>
        </div>
      </details>
    </li>
  )
}
