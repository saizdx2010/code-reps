import { useRef } from 'react'
import { stageLabels } from './learning'
import type { JourneyProgress } from './learning'

type Props = {
  progress: JourneyProgress[]
  onOpenRep: (id: string) => void
  onReviewRep: (id: string) => void
  onExport: () => void
  onImport: (file: File) => void
  transferMessage: string
  serverReady: boolean
}

export function ProgressPage({ progress, onOpenRep, onReviewRep, onExport, onImport, transferMessage, serverReady }: Props) {
  const importRef = useRef<HTMLInputElement | null>(null)
  return <main className="progress-main">
    <div className="home-heading"><span className="home-label">EVIDENCE OF GROWTH</span><h1 tabIndex={-1}>What can you solve on your own?</h1><p>Passing checks shows working code. Each skill shows when you solved related problems without hints. Plans and explanations are yours to review.</p></div>
    {progress.map(({ journey, stage, guided, independent, retained, recallAt, recallDue }, index) => <details className="progress-journey" aria-labelledby={`progress-${journey.id}`} key={journey.id} open={index === 0}>
      <summary className="progress-heading"><div><h2 id={`progress-${journey.id}`}>{journey.title}</h2><p>Guided practice → independent problem → fresh recall after {journey.delayDays} days</p></div><span className="journey-state">{stageLabels[stage]}</span></summary>
      <ol className="evidence-list">
        <li><strong>1. Guided practice</strong><span>{guided ? `Completed ${new Date(guided.completedAt).toLocaleDateString()}${guided.hintCount ? ` with ${guided.hintCount} hint(s)` : ' without hints'}` : 'Start with a guided rep.'}</span><button type="button" className="text-button" onClick={() => onOpenRep(journey.guided)}>Open rep →</button></li>
        <li><strong>2. Independent problem</strong><span>{independent ? `Solved without hints ${new Date(independent.completedAt).toLocaleDateString()}` : 'Solve a related problem without hints after guided practice.'}</span><button type="button" className="text-button" disabled={!guided} onClick={() => onReviewRep(journey.independent)}>{!guided ? 'After guided rep' : independent ? 'Open rep →' : 'Try rep →'}</button></li>
        <li><strong>3. Later recall</strong><span>{retained ? `Fresh problem solved without hints ${new Date(retained.completedAt).toLocaleDateString()}` : recallAt ? recallDue ? 'Ready now. Solve a fresh problem without hints.' : `Ready ${new Date(recallAt).toLocaleDateString()}. A later attempt is needed for retention.` : 'Available after an independent solve.'}</span><button type="button" className="text-button" disabled={!recallDue} onClick={() => onReviewRep(journey.recall)}>{recallDue ? 'Try recall →' : retained ? 'Evidence recorded' : 'Available later'}</button></li>
      </ol>
    </details>)}
    <p className="evidence-note">Hints remain visible in History, but a hinted attempt cannot establish independence or retention. These are skill-specific observations, not an overall coding score.</p>
    <section className="local-data" aria-labelledby="local-data-title"><div><h2 id="local-data-title">Your work stays yours</h2><p>{serverReady ? 'Code Reps is free. The local server saves your progress in SQLite on your laptop.' : 'Code Reps is free. In development mode, your progress is saved in this browser.'} Download a backup to carry it elsewhere.</p><p>Import adds completed attempts and fills empty drafts. Existing drafts stay as they are.</p></div><div className="local-data-actions"><button type="button" onClick={onExport}>Download backup</button><button type="button" onClick={() => importRef.current?.click()}>Import backup</button><input ref={importRef} type="file" accept=".json,application/json" aria-label="Choose Code Reps backup" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = '' }} /></div>{transferMessage && <p className="transfer-message" role="status">{transferMessage}</p>}</section>
  </main>
}
