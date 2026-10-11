// Independent reference solutions for Foundations reps added after the original set.
export const foundationsSolutions = {
  'function-returns-function': 'function makeAdder(amount: number) { return (x: number) => x + amount } function addAll(amount: number, values: number[]) { const add = makeAdder(amount); return values.map(value => add(value)) }',
  'pass-or-retry': 'function passLabel(score: number) { return score >= 50 ? "Pass" : "Retry" }',
}
