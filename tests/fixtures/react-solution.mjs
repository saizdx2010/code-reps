export const reactSolution = `function ChannelCounter({ channel, source }) {
  const [total, setTotal] = React.useState(0)
  React.useEffect(() => source.subscribe(channel, value => setTotal(previous => previous + value)), [channel, source])
  return <section><p data-testid="total">{channel + ': ' + total}</p><button data-testid="reset" type="button" onClick={() => setTotal(0)}>Reset</button></section>
}`

export const reactRowKeysSolution = `type Task = { id: string; title: string }
function TaskRows({ tasks }: { tasks: Task[] }) {
  return (
    <ul data-testid="list">
      {tasks.map(task => (
        <li key={task.id} data-testid={'row-' + task.id}>
          <label>
            <input type="checkbox" data-testid={'check-' + task.id} /> {task.title}
          </label>
        </li>
      ))}
    </ul>
  )
}`

export const reactStaleRequestSolution = `type Source = { request: (query: string, done: (results: string[]) => void) => void }
function SearchResults({ query, source }: { query: string; source: Source }) {
  const [answer, setAnswer] = React.useState<{ query: string; results: string[] } | null>(null)
  React.useEffect(() => {
    let current = true
    source.request(query, results => {
      if (current) setAnswer({ query, results })
    })
    return () => {
      current = false
    }
  }, [query, source])
  const results = answer && answer.query === query ? answer.results : null
  const status =
    results === null
      ? 'Searching for ' + query
      : results.length === 0
        ? 'No results for ' + query
        : results.length + (results.length === 1 ? ' result for ' : ' results for ') + query
  return (
    <div>
      <p data-testid="status">{status}</p>
      {results && results.length > 0 && (
        <ul>
          {results.map((result, index) => (
            <li key={index} data-testid="result">
              {result}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}`

export const reactSolutions = {
  'react-channel-counter': reactSolution,
  'react-row-keys': reactRowKeysSolution,
  'react-stale-request': reactStaleRequestSolution,
}
