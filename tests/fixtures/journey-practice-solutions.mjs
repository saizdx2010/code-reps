export const journeyPracticeSolutions = {
  'sum-in-range': 'function sumInRange(numbers: number[], low: number, high: number): number { let sum=0; for (const n of numbers) if(n>=low && n<=high) sum+=n; return sum }',
  'adjacent-rise-count': 'function countRises(numbers: number[]): number { let count=0; for(let i=1;i<numbers.length;i++) if(numbers[i]>numbers[i-1]) count++; return count }',
  'last-matching-word': 'function lastMatchingWord(words: string[], suffix: string): string | null { for(let i=words.length-1;i>=0;i--) if(words[i].endsWith(suffix)) return words[i]; return null }',
  'word-length-span': 'function wordLengthSpan(words: string[]): number { if(!words.length) return 0; const lengths=words.map(w=>w.length); return Math.max(...lengths)-Math.min(...lengths) }',
  'shared-number-count': 'function sharedNumberCount(left: number[], right: number[]): number { const a=new Set(left); const b=new Set(right); let count=0; for(const n of a) if(b.has(n)) count++; return count }',
  'singleton-number-list': 'function singletonNumbers(numbers: number[]): number[] { const counts=new Map<number,number>(); for(const n of numbers) counts.set(n,(counts.get(n)??0)+1); return numbers.filter(n=>counts.get(n)===1) }',
  'undo-word-actions': 'function applyWordActions(actions: string[]): string[] { const result:string[]=[]; for(const action of actions) { if(action==="UNDO") result.pop(); else result.push(action) } return result }',
  'erase-text-markers': 'function eraseMarkers(text: string): string { const chars:string[]=[]; for(const c of text) { if(c==="#") chars.pop(); else chars.push(c) } return chars.join("") }'
}
