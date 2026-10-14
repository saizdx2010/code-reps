// Every DSA rep in catalog order, for Node consumers. Each topic module below is its own source in
// src/rep-sources.ts, so the app downloads only the topic of the rep it opens.
import { dsaGridReps } from './dsa-grid-reps.ts'
import { dsaApplicationReps } from './dsa-application-reps.ts'
import { dsaBasicsReps } from './dsa-basics-reps.ts'
import { dsaPracticeReps } from './dsa-practice-reps.ts'
import { dsaPuzzleReps } from './dsa-puzzle-reps.ts'
import { dsaHarderReps } from './dsa-harder-reps.ts'
import type { Rep } from './rep.ts'

export const dsaReps: Rep[] = [
  ...dsaGridReps,
  ...dsaApplicationReps,
  ...dsaBasicsReps,
  ...dsaPracticeReps,
  ...dsaPuzzleReps,
  ...dsaHarderReps,
]
