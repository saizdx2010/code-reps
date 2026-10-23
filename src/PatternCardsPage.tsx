import { useState } from 'react'
import { Button } from './Button'
import { InfoNote, PageHeader, StatusChip } from './Layout'
import { patternTools, shuffledCards } from './pattern-cards.ts'
import type { PatternTool } from './pattern-cards.ts'
import { repTitle } from './rep-index.ts'

/** One card at a time: choose a tool, then read the signal and the near miss. Nothing here is saved. */
export function PatternCardsPage({ openRep, onLessons }: { openRep: (id: string) => void; onLessons: () => void }) {
  const [cards, setCards] = useState(() => shuffledCards())
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<PatternTool | undefined>()
  const [score, setScore] = useState({ matched: 0, answered: 0 })
  const card = cards[index]
  const done = index >= cards.length
  function choose(tool: PatternTool) {
    if (chosen) return
    setChosen(tool)
    setScore(current => ({ matched: current.matched + Number(tool === card.answer), answered: current.answered + 1 }))
  }
  function next() {
    setChosen(undefined)
    setIndex(index + 1)
  }
  function restart() {
    setCards(shuffledCards())
    setIndex(0)
    setChosen(undefined)
    setScore({ matched: 0, answered: 0 })
  }
  return (
    <main className="learn-main pattern-cards-main">
      <PageHeader
        back={{ label: 'Lessons', onClick: onLessons }}
        title="Pattern cards"
        description="Read a short contract and choose the tool that fits it best."
      />
      <InfoNote label="What this practices">
        <p>
          Recognizing a tool is a first step, not coding fluency. Your answers stay on this page only and never change skill progress. The
          lesson “Recognize the pattern” explains how to read a contract for its decisive signal.
        </p>
      </InfoNote>
      {done ? (
        <section className="pattern-card" aria-labelledby="pattern-done-title">
          <h2 id="pattern-done-title">Deck finished</h2>
          <p>
            You matched {score.matched} of {score.answered}. Cards you missed are worth coding: each one links to a rep that applies its
            tool.
          </p>
          <Button variant="primary" onClick={restart}>
            Shuffle and start again
          </Button>
        </section>
      ) : (
        <section className="pattern-card" aria-labelledby="pattern-card-title">
          <p className="pattern-card-count">
            Card {index + 1} of {cards.length}
            {score.answered > 0 && ` · matched ${score.matched} of ${score.answered}`}
          </p>
          <h2 id="pattern-card-title">{card.contract}</h2>
          <div className="pattern-choices" role="group" aria-label="Which tool fits best?">
            {card.choices.map(tool => {
              const result = chosen ? (tool === card.answer ? 'answer' : tool === chosen ? 'missed' : 'other') : undefined
              return (
                <button
                  key={tool}
                  type="button"
                  className="pattern-choice"
                  aria-pressed={chosen === tool}
                  data-result={result}
                  disabled={Boolean(chosen) && tool !== chosen && tool !== card.answer}
                  onClick={() => choose(tool)}
                >
                  {patternTools[tool]}
                  {result === 'answer' && <span className="pattern-choice-tag">Best fit</span>}
                  {result === 'missed' && <span className="pattern-choice-tag">Your choice</span>}
                </button>
              )
            })}
          </div>
          {chosen && (
            <div className="pattern-feedback" role="status">
              <StatusChip tone={chosen === card.answer ? 'success' : 'attention'}>
                {chosen === card.answer ? 'Best fit' : 'Not the best fit'}
              </StatusChip>
              <p>
                <strong>Signal:</strong> {card.signal}
              </p>
              <p>
                <strong>Near miss:</strong> {card.nearMiss}
              </p>
              <div className="pattern-actions">
                <Button variant="primary" onClick={next}>
                  {index + 1 === cards.length ? 'See how you did' : 'Next card'}
                </Button>
                <Button onClick={() => openRep(card.repId)}>Practice it: {repTitle(card.repId)}</Button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
