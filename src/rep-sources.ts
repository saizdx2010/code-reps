import { reactReps } from './react-reps.ts'
import { asyncRuntimeReps } from './async-runtime-reps.ts'
import { sqliteReps } from './sqlite-reps.ts'
// Node-only: tests, scripts, and the practice worker see every rep synchronously through this list.
// The app never imports it; it loads one source at a time through src/rep-content.ts.
// This is the one list of rep sources, and its order is the catalog order. After adding a rep module here, run
// `yarn content:index`: it generates the app's lazy loader for each source in src/rep-chunks.ts.
import { aiEraReps, coreLessons } from './ai-era-reps.ts'
import { appReps } from './app-reps.ts'
import { typescriptDepthReps } from './typescript-depth-reps.ts'
import { browserStateReps } from './browser-state-reps.ts'
import { capstoneReps } from './capstone-reps.ts'
import { connectedFeatureReps } from './connected-feature-reps.ts'
import { coreReps } from './core-reps.ts'
import { domReps } from './dom-reps.ts'
import { dsaAdvancedReps } from './dsa-advanced-reps.ts'
import { dsaLinkedReps } from './dsa-linked-reps.ts'
import { dsaGridReps } from './dsa-grid-reps.ts'
import { dsaApplicationReps } from './dsa-application-reps.ts'
import { dsaBasicsReps } from './dsa-basics-reps.ts'
import { dsaPracticeReps } from './dsa-practice-reps.ts'
import { dsaPuzzleReps } from './dsa-puzzle-reps.ts'
import { dsaHarderReps } from './dsa-harder-reps.ts'
import { fluencyReps } from './fluency-reps.ts'
import { foundationReps, foundations } from './foundations.ts'
import { journeyReps } from './journey-reps.ts'
import { maintenanceJourneyReps } from './maintenance-journey-reps.ts'
import { practicalReps } from './practical-concepts.ts'
import { asyncReps } from './async-reps.ts'
import { richReps } from './rich-reps.ts'
import { stackTraceReps } from './stack-trace-reps.ts'
import { testingJourneyReps } from './testing-journey-reps.ts'
import { transferReps } from './transfer-reps.ts'
import { validationReps } from './validation-reps.ts'
import type { RepLesson } from './rep-source-loader.ts'
import type { Rep } from './rep-types.ts'

export const repSources: { name: string; reps: Rep[]; lessons?: readonly RepLesson[] }[] = [
  { name: 'async-runtime-reps', reps: asyncRuntimeReps },
  { name: 'sqlite-reps', reps: sqliteReps },
  { name: 'practical-concepts', reps: practicalReps },
  { name: 'async-reps', reps: asyncReps },
  { name: 'foundations', reps: foundationReps, lessons: foundations },
  { name: 'dsa-grid-reps', reps: dsaGridReps },
  { name: 'dsa-application-reps', reps: dsaApplicationReps },
  { name: 'dsa-basics-reps', reps: dsaBasicsReps },
  { name: 'dsa-practice-reps', reps: dsaPracticeReps },
  { name: 'dsa-puzzle-reps', reps: dsaPuzzleReps },
  { name: 'dsa-harder-reps', reps: dsaHarderReps },
  { name: 'dsa-advanced-reps', reps: dsaAdvancedReps },
  { name: 'dsa-linked-reps', reps: dsaLinkedReps },
  { name: 'ai-era-reps', reps: aiEraReps, lessons: coreLessons },
  { name: 'core-reps', reps: coreReps },
  { name: 'journey-reps', reps: journeyReps },
  { name: 'transfer-reps', reps: transferReps },
  { name: 'rich-reps', reps: richReps },
  { name: 'stack-trace-reps', reps: stackTraceReps },
  { name: 'fluency-reps', reps: fluencyReps },
  { name: 'capstone-reps', reps: capstoneReps },
  { name: 'validation-reps', reps: validationReps },
  { name: 'app-reps', reps: appReps },
  { name: 'ts-depth-reps', reps: typescriptDepthReps },
  { name: 'browser-state-reps', reps: browserStateReps },
  { name: 'react-reps', reps: reactReps },
  { name: 'dom-reps', reps: domReps },
  { name: 'connected-feature-reps', reps: connectedFeatureReps },
  { name: 'testing-journey-reps', reps: testingJourneyReps },
  { name: 'maintenance-journey-reps', reps: maintenanceJourneyReps },
]
