import type { Question } from './knowledge.ts'

// One interactive lesson check. Lesson modules import it from here, not from knowledge.ts, to avoid an import cycle.
export const q = (id: string, prompt: string, code: string, options: string[], answer: number, explanation: string): Question => ({ id, prompt, code, options, answer, explanation })
