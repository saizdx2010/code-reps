// Shared by the practice review form and attempt history so both describe saved answers the same way.
export type Difficulty = 'none' | 'wording' | 'approach' | 'typescript' | 'edge-cases'
export type Confidence = 'need-practice' | 'getting-there' | 'confident'
export const difficultyLabels: Record<Difficulty, string> = { none: 'Nothing in particular', wording: 'Understanding the wording', approach: 'Finding an approach', typescript: 'Writing TypeScript', 'edge-cases': 'Handling edge cases' }
export const confidenceLabels: Record<Confidence, string> = { 'need-practice': 'Need more practice', 'getting-there': 'Getting there', confident: 'Confident' }
