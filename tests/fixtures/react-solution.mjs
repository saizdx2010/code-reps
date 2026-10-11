export const reactSolution = `function ChannelCounter({ channel, source }) {
  const [total, setTotal] = React.useState(0)
  React.useEffect(() => source.subscribe(channel, value => setTotal(previous => previous + value)), [channel, source])
  return <section><p data-testid="total">{channel + ': ' + total}</p><button data-testid="reset" type="button" onClick={() => setTotal(0)}>Reset</button></section>
}`
