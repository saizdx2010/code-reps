// Shared by the practice review form and attempt history so both describe saved answers the same way.
// Difficulty values are stored on attempts and in backups: never rename or reuse one. New values are appended.
export type Difficulty = 'none' | 'wording' | 'approach' | 'typescript' | 'edge-cases' | 'prerequisite' | 'integration'
export type Confidence = 'need-practice' | 'getting-there' | 'confident'
export const difficultyLabels: Record<Difficulty, string> = {
  none: 'Nothing in particular',
  wording: 'Understanding the wording',
  approach: 'Finding an approach',
  typescript: 'Writing TypeScript',
  'edge-cases': 'Handling edge cases',
  prerequisite: 'Something I had not learned yet',
  integration: 'Combining the pieces',
}
export const isDifficulty = (value: unknown): value is Difficulty => typeof value === 'string' && Object.hasOwn(difficultyLabels, value)
export const confidenceLabels: Record<Confidence, string> = {
  'need-practice': 'Need more practice',
  'getting-there': 'Getting there',
  confident: 'Confident',
}
