// Reference work for the Break it hunts: a learner's tries table as the hunt saves it, which catches every authored
// bug with inputs inside the contract. The worker reruns every input, so the saved answers here are what it returns.
export const breakPageCountTries = `[
  {"input":[7,3],"suspect":"3","contract":"3","caught":[]},
  {"input":[0,5],"suspect":"1","contract":"0","caught":["no-items"]},
  {"input":[10,5],"suspect":"3","contract":"2","caught":["full-last-page"]}
]`

/** An independent page count, written without Math.ceil: fill pages one at a time until every item has a place. */
export function referencePageCount(items, perPage) {
  let pages = 0
  for (let placed = 0; placed < items; placed += perPage) pages++
  return pages
}

export const breakItSolutions = { 'break-page-count': breakPageCountTries }
