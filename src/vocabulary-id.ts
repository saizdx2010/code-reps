/** Optional Indonesian glosses for rep vocabulary, keyed by the exact English term. English stays primary. */
export const indonesianGlossary: Record<string, string> = {
  Mutation: 'mengubah data yang sudah ada',
}

export function indonesianMeaning(term: string): string | undefined {
  return indonesianGlossary[term]
}
