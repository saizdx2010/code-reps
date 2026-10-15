// What the Search palette finds and how it orders it. Pure data, so the matching rules are testable without a browser.
import { repIndex as reps, skillIndex } from './catalog-index.ts'
import type { RepSummary, SkillSummary } from './catalog-index.ts'
import { catalogTopic } from './catalog-labels.ts'
import { skillSummariesForRep } from './skill-index.ts'
import type { View } from './ui-navigation.ts'

export const searchGroups = ['Continue', 'This rep', 'Lessons', 'Exercises', 'Pages', 'Settings'] as const
export type SearchGroup = (typeof searchGroups)[number]
export type SearchTarget =
  | { kind: 'rep'; repId: string }
  | { kind: 'lesson'; skillId: string }
  | { kind: 'page'; view: View }
  | { kind: 'action'; id: string }
export type SearchEntry = {
  group: SearchGroup
  label: string
  /** A short second line: the topic, the lesson tag, or the state. */
  detail?: string
  shortcut?: string
  target: SearchTarget
  /** Lowercased words the query is matched against, beyond the label. */
  text: string
}

export const searchWords = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean)

// A rep is also found by its topic, area, format, and the titles of the lessons it practices, so "binary search" or
// "closures" finds the reps that use the idea.
export const repSearchText = (rep: RepSummary) =>
  `${rep.title} ${catalogTopic(rep)} ${rep.category} ${rep.format ?? 'algorithm'} ${skillSummariesForRep(rep.id)
    .map(skill => skill.title)
    .join(' ')}`.toLowerCase()

// A lesson is found by its title and summary.
export const lessonSearchText = (skill: SkillSummary) => `${skill.title} ${skill.summary}`.toLowerCase()

// A query word matches the start of a word, so "arr" finds arrays but not "narrowing", and "closure" not "disclosure".
const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/)
const startsWord = (tokens: string[], word: string) => tokens.some(token => token.startsWith(word))

/** The pages, named as the navigation names them. */
export const pageEntries: { view: View; label: string }[] = [
  { view: 'home', label: 'Trail › Your trail' },
  { view: 'paths', label: 'Trail › All tracks' },
  { view: 'catalog', label: 'Library › Exercises' },
  { view: 'knowledge', label: 'Library › Lessons' },
  { view: 'learn', label: 'Library › Lessons › Quick lessons' },
  { view: 'projects', label: 'Library › Projects' },
  { view: 'interview', label: 'Library › Projects › Timed interview' },
  { view: 'progress', label: 'Progress › Skills' },
  { view: 'skillmap', label: 'Progress › Skills › Skill map' },
  { view: 'plan', label: 'Progress › Skills › Plan a practice week' },
  { view: 'assessment', label: 'Progress › Skills › Self-assessment' },
  { view: 'history', label: 'Progress › Journal › Attempts' },
  { view: 'notebook', label: 'Progress › Journal › Notebook' },
  { view: 'mistakes', label: 'Progress › Journal › Mistakes' },
]

const repEntries: SearchEntry[] = reps.map(rep => ({
  group: 'Exercises',
  label: rep.title,
  detail: catalogTopic(rep),
  target: { kind: 'rep', repId: rep.id },
  text: repSearchText(rep),
}))
const lessonEntries: SearchEntry[] = skillIndex.map(skill => ({
  group: 'Lessons',
  label: skill.title,
  target: { kind: 'lesson', skillId: skill.id },
  text: lessonSearchText(skill),
}))
const pageSearchEntries: SearchEntry[] = pageEntries.map(page => ({
  group: 'Pages',
  label: page.label,
  target: { kind: 'page', view: page.view },
  text: page.label.toLowerCase(),
}))

/** At most this many results per group while typing; an empty query shows only the short groups. */
const groupLimit: Partial<Record<SearchGroup, number>> = { Lessons: 4, Exercises: 8 }

/**
 * Matches every query word against an entry's label and words. Titles that start with the query rank first, then titles
 * that contain every word, then entries found only through their topic or lesson vocabulary. An empty query offers
 * what to continue, this rep's actions, pages, and settings, never the whole catalog.
 */
export function searchPalette(query: string, context: SearchEntry[]): { group: SearchGroup; entries: SearchEntry[] }[] {
  const terms = searchWords(query)
  const all = [...context, ...lessonEntries, ...repEntries, ...pageSearchEntries]
  const shown = terms.length
    ? all
        .map((entry, index) => {
          const label = words(entry.label)
          const text = words(entry.text)
          if (!terms.every(word => startsWord(label, word) || startsWord(text, word))) return null
          const rank = entry.label.toLowerCase().startsWith(terms.join(' ')) ? 0 : terms.every(word => startsWord(label, word)) ? 1 : 2
          return { entry, rank, index }
        })
        .filter(item => item !== null)
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map(item => item.entry)
    : all.filter(entry => entry.group !== 'Lessons' && entry.group !== 'Exercises')
  return searchGroups
    .map(group => {
      const entries = shown.filter(entry => entry.group === group)
      return { group, entries: terms.length ? entries.slice(0, groupLimit[group] ?? entries.length) : entries }
    })
    .filter(section => section.entries.length)
}
