// Independent reference solutions, kept outside learner-visible content.
export const asyncSolutions = {
  'search-request-state': `function searchState(events) {
    let owner = null
    let display = {status: 'idle', items: [], error: null}
    for (const event of events) {
      if (event.kind === 'start') {
        owner = event.id
        display = {status: 'loading', items: [], error: null}
      } else if (owner === event.id) {
        owner = null
        if (event.kind === 'resolve') display = {status: 'ready', items: [...event.items], error: null}
        else if (event.kind === 'reject') display = {status: 'error', items: [], error: event.message}
        else display = {status: 'idle', items: [], error: null}
      }
    }
    return display
  }`,
  'preview-slot-results': `function previewSlots(events) {
    let slots = []
    for (const event of events) {
      const index = slots.findIndex(slot => slot.slot === event.slot)
      if (event.kind === 'remove') {
        if (index !== -1) slots.splice(index, 1)
      } else if (event.kind === 'select') {
        const next = {slot: event.slot, token: event.token, status: 'loading', url: null}
        if (index === -1) slots.push(next)
        else slots[index] = next
      } else if (index !== -1 && slots[index].token === event.token) {
        slots[index] = {slot: event.slot, token: null, status: 'ready', url: event.url}
      }
    }
    return slots.map(({slot, status, url}) => ({slot, status, url}))
  }`,
  'refresh-report-state': `function reportState(initial, events) {
    const result = events.reduce((state, event) => {
      if (event.kind === 'refresh') return {...state, owner: event.id, pending: true, error: null}
      if (state.owner !== event.id) return state
      return {
        owner: null,
        value: event.kind === 'resolve' ? event.value : state.value,
        pending: false,
        error: event.kind === 'reject' ? event.message : null,
      }
    }, {owner: null, value: initial, pending: false, error: null})
    return {value: result.value, pending: result.pending, error: result.error}
  }`,
}
