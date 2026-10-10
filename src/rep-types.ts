export type Check = { name: string; input: unknown[]; expected: unknown }
export type Rep = {
  id: string
  title: string
  category: string
  format?: 'debug' | 'read' | 'transform' | 'frontend' | 'backend' | 'refactor'
  context?: string
  acceptanceCriteria?: string[]
  prompt: string
  /** Optional structured brief: shown in place of `prompt`; `prompt` stays the full contract text. */
  brief?: { summary: string; rules: string[]; edgeCases?: string[] }
  example: { input: string; output: string }
  note: string
  vocabulary: { term: string; meaning: string }[]
  planPrompt: string
  starter: string
  functionName: string
  preserveInput?: boolean
  /** Frontend reps that check authored DOM and ARIA contracts. Without it the rep uses the directory scenarios. */
  domPreview?: { title: string; description: string; props: Record<string, unknown>; review: string[] }
  hints: string[]
  checks: Check[]
}
