// Independent reference implementations for the stack-trace journey; they intentionally differ from the reviews.
export const stackTraceSolutions = {
  'stack-trace-missing-field':
    'function badgeLabels(people) { return people.map(p => { const words = p.name.match(/[A-Za-z]+/g) ?? []; const letters = words.length ? [words[0], words.at(-1)].slice(0, Math.min(2, words.length)).map(w => w[0].toUpperCase()).join("") : "?"; return letters + " " + p.id }) }',
  'stack-trace-wrong-caller':
    'function formatRow(cells, widths) { let out = ""; for (let i = 0; i < cells.length; i++) out += (i ? " | " : "") + cells[i].padEnd(widths[i], " "); return out }',
  'stack-trace-null-lookup':
    'function ownerNames(tickets, users) { const names = new Map(users.map(u => [u.id, u.name])); return tickets.map(t => (t.ownerId !== null && names.has(t.ownerId) ? names.get(t.ownerId) : "Unassigned")) }',
}
