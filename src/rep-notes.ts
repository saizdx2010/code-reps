/** Keep task details visible while collecting assessment guidance in one disclosure. */
export function repNotes(note: string): { brief: string; checking: string } {
  const brief: string[] = []
  const checking: string[] = []
  for (const sentence of note.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
    const assessment = /\bchecks\b|\bself-review(?:ed)?\b|\breview (?:your\b|.*\byourself\b)/i.test(sentence)
    if (assessment) checking.push(sentence)
    else brief.push(sentence)
  }
  return { brief: brief.join(' '), checking: checking.join(' ') }
}
