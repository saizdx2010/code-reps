import { skillIndex } from './catalog-index.ts'
import { dayNumber } from './dates.ts'
import type { FluencyState } from './fluency.ts'
import { getActiveProfile } from './local-store.ts'
import { routeHash } from './ui-navigation.ts'

// A lesson question whose first prediction was wrong comes back a few days later, to be answered from memory rather
// than straight after reading the explanation. Answering it right then ends it; a wrong answer brings it back after the
// same gap. The first prediction stays the lesson's evidence: a revisit is spaced practice and changes no evidence.
export const revisitDays = 3

export type DueQuestion = { skillId: string; questionId: string; missedAt: string }

/** Missed lesson questions ready to come back, the earliest miss first. Retired questions never come back. */
export function dueQuestions(answers: FluencyState['answers'], now: number): DueQuestion[] {
  const today = dayNumber(new Date(now))
  const due: DueQuestion[] = []
  for (const skill of skillIndex)
    for (const question of skill.questions) {
      const answer = answers[`${skill.id}:${question.id}`]
      if (!answer || answer.correct || answer.revisit?.correct) continue
      const last = new Date(answer.revisit?.at ?? answer.answeredAt)
      if (today - dayNumber(last) >= revisitDays) due.push({ skillId: skill.id, questionId: question.id, missedAt: answer.answeredAt })
    }
  return due.sort((a, b) => a.missedAt.localeCompare(b.missedAt))
}

/** Opens a lesson on its Predict section, where the questions to revisit wait blank. */
export function openRevisit(skillId: string) {
  try {
    sessionStorage.setItem(`code-reps:ui:${getActiveProfile()}:lesson-section:${skillId}`, 'predict')
  } catch {
    /* Without session storage the lesson opens where it was; the questions are one tab away. */
  }
  location.hash = routeHash({ view: 'knowledge', skillId })
}
