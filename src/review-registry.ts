// The single list of review modules. src/rep-depth.ts and src/reflection-guides.ts both read it.
// Add a new src/review-*.ts module here once; a later module's entry replaces an earlier one with the same rep ID.
import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'
import { aiEraDepth, aiEraGuides } from './review-ai-era.ts'
import { appDepth, appGuides } from './review-app.ts'
import { asyncRepDepth, asyncGuides } from './review-async.ts'
import { asyncRuntimeDepth, asyncRuntimeGuides } from './review-async-runtime.ts'
import { browserStateDepth, browserStateGuides } from './review-browser-state.ts'
import { connectedFeatureDepth, connectedFeatureGuides } from './review-connected-feature.ts'
import { coreDepth, coreGuides } from './review-core.ts'
import { domDepth, domGuides } from './review-dom.ts'
import { dsaDepth, dsaGuides } from './review-dsa.ts'
import { dsaAdvancedDepth, dsaAdvancedGuides } from './review-dsa-advanced.ts'
import { dsaLinkedDepth, dsaLinkedGuides } from './review-dsa-linked.ts'
import { fluencyDepth, fluencyGuides } from './review-fluency.ts'
import { foundationsDepth, foundationsGuides } from './review-foundations.ts'
import { journeyPracticeDepth, journeyPracticeGuides } from './review-journey-practice.ts'
import { maintenanceJourneyDepth, maintenanceJourneyGuides } from './review-maintenance-journey.ts'
import { practicalRepDepth, practicalGuides } from './review-practical.ts'
import { reactDepth, reactGuides } from './review-react.ts'
import { richDepth, richGuides } from './review-rich.ts'
import { sqliteDepth, sqliteGuides } from './review-sqlite.ts'
import { stackTraceDepth, stackTraceGuides } from './review-stack-traces.ts'
import { testingJourneyDepth, testingJourneyGuides } from './review-testing-journey.ts'
import { typescriptDepth, typescriptGuides } from './review-typescript-depth.ts'
import { validationDepth, validationGuides } from './review-validation.ts'

export type Review = { depth: Record<string, RepDepth>; guides: Record<string, ReflectionGuide> }

export const reviews: Review[] = [
  { depth: asyncRuntimeDepth, guides: asyncRuntimeGuides },
  { depth: sqliteDepth, guides: sqliteGuides },
  { depth: journeyPracticeDepth, guides: journeyPracticeGuides },
  { depth: connectedFeatureDepth, guides: connectedFeatureGuides },
  { depth: testingJourneyDepth, guides: testingJourneyGuides },
  { depth: maintenanceJourneyDepth, guides: maintenanceJourneyGuides },
  { depth: asyncRepDepth, guides: asyncGuides },
  { depth: practicalRepDepth, guides: practicalGuides },
  { depth: dsaDepth, guides: dsaGuides },
  { depth: dsaAdvancedDepth, guides: dsaAdvancedGuides },
  { depth: dsaLinkedDepth, guides: dsaLinkedGuides },
  { depth: stackTraceDepth, guides: stackTraceGuides },
  { depth: validationDepth, guides: validationGuides },
  { depth: appDepth, guides: appGuides },
  { depth: domDepth, guides: domGuides },
  { depth: reactDepth, guides: reactGuides },
  { depth: browserStateDepth, guides: browserStateGuides },
  { depth: typescriptDepth, guides: typescriptGuides },
  { depth: foundationsDepth, guides: foundationsGuides },
  { depth: aiEraDepth, guides: aiEraGuides },
  { depth: coreDepth, guides: coreGuides },
  { depth: richDepth, guides: richGuides },
  { depth: fluencyDepth, guides: fluencyGuides },
]
