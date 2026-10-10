// Node-only: tests, scripts, and the practice worker see every rep synchronously through this list.
// The app never imports it; it loads one source at a time through src/rep-content.ts.
// The order here is the catalog order. Add a new rep module to this list, to src/rep-content.ts, and run `yarn content:index`.
import { aiEraReps, coreLessons } from './ai-era-reps.ts'
import { appReps } from './app-reps.ts'
import { browserStateReps } from './browser-state-reps.ts'
import { capstoneReps } from './capstone-reps.ts'
import { connectedFeatureReps } from './connected-feature-reps.ts'
import { coreReps } from './core-reps.ts'
import { domReps } from './dom-reps.ts'
import { dsaAdvancedReps } from './dsa-advanced-reps.ts'
import { dsaReps } from './dsa-reps.ts'
import { fluencyReps } from './fluency-reps.ts'
import { foundationReps, foundations } from './foundations.ts'
import { journeyReps } from './journey-reps.ts'
import { practicalReps } from './practical-concepts.ts'
import { richReps } from './rich-reps.ts'
import { transferReps } from './transfer-reps.ts'
import { validationReps } from './validation-reps.ts'
import type { Rep } from './rep-types.ts'

export type RepSourceLesson = { repId: string; title: string; explanation: string; example: string; tip: string }
export const repSources: { name: string; reps: Rep[]; lessons?: readonly RepSourceLesson[] }[] = [
  { name: 'practical-concepts', reps: practicalReps },
  { name: 'foundations', reps: foundationReps, lessons: foundations },
  { name: 'dsa-reps', reps: dsaReps },
  { name: 'dsa-advanced-reps', reps: dsaAdvancedReps },
  { name: 'ai-era-reps', reps: aiEraReps, lessons: coreLessons },
  { name: 'core-reps', reps: coreReps },
  { name: 'journey-reps', reps: journeyReps },
  { name: 'transfer-reps', reps: transferReps },
  { name: 'rich-reps', reps: richReps },
  { name: 'fluency-reps', reps: fluencyReps },
  { name: 'capstone-reps', reps: capstoneReps },
  { name: 'validation-reps', reps: validationReps },
  { name: 'app-reps', reps: appReps },
  { name: 'browser-state-reps', reps: browserStateReps },
  { name: 'dom-reps', reps: domReps },
  { name: 'connected-feature-reps', reps: connectedFeatureReps },
]
