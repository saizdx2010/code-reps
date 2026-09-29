import type { PathIntroduction as Introduction } from './path'

type Props = {
  introduction: Introduction
  onStart: () => void
}

export function PathIntroduction({ introduction, onStart }: Props) {
  return <section className="path-introduction" id="path-introduction" aria-labelledby="path-introduction-title">
    <div className="path-introduction-copy">
      <span className="home-label">BEFORE YOUR FIRST REP</span>
      <h2 id="path-introduction-title">{introduction.title}</h2>
      <p>{introduction.body}</p>
      <div className="path-introduction-next"><strong>What comes next</strong><p>{introduction.next}</p></div>
      <button className="primary-button" type="button" onClick={onStart}>Try the first rep <span aria-hidden="true">→</span></button>
    </div>
    <div className="path-introduction-example">
      <span className="home-label">A SMALL EXAMPLE</span>
      <pre><code>{introduction.example}</code></pre>
      <p>{introduction.explanation}</p>
    </div>
  </section>
}
