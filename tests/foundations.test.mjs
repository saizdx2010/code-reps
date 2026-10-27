import test from 'node:test'
import { assertMutantsFail } from './helpers/checks.mjs'

// Realistic wrong answers for the first Foundations stages (docs/QUALITY_PASS.md, point 6). Each must fail an authored check.
test('Foundations stage 1 checks reject plausible wrong answers', () => {
  assertMutantsFail([
    // Drops the space after the comma.
    [
      'declare-variables',
      'function makeGreeting(name: string) { const greeting = "Hello,"; let message = greeting; message = message + name; return message }',
    ],
    // Hardcodes the example.
    ['declare-variables', 'function makeGreeting(name: string) { return "Hello, Ada" }'],
    // Reassigns a const.
    [
      'declare-variables',
      'function makeGreeting(name: string) { const greeting = "Hello, "; const message = greeting; message = message + name; return message }',
    ],
    // Treats an age of 0 as missing.
    [
      'basic-types',
      'function describePerson(name: string, age: number, active: boolean) { return `${name} is ${age || "unknown"}. Active: ${active}` }',
    ],
    // Writes yes or no instead of the boolean.
    [
      'basic-types',
      'function describePerson(name: string, age: number, active: boolean) { return `${name} is ${age}. Active: ${active ? "yes" : "no"}` }',
    ],
    // Hardcodes true.
    ['basic-types', 'function describePerson(name: string, age: number, active: boolean) { return `${name} is ${age}. Active: true` }'],
    // Misspells the format.
    [
      'create-objects',
      'type Person = { name: string; age: number }; function introduce(name: string, age: number) { const person: Person = { name, age }; return `${person.name} is ${person.age} year old` }',
    ],
    // Leaves age out of the object.
    [
      'create-objects',
      'type Person = { name: string; age: number }; function introduce(name: string, age: number) { const person = { name } as Person; return `${person.name} is ${person.age} years old` }',
    ],
    // Hides an age of 0.
    [
      'create-objects',
      'type Person = { name: string; age: number }; function introduce(name: string, age: number) { const person: Person = { name, age }; return `${person.name} is ${person.age || ""} years old` }',
    ],
    // Turns an empty first name into null.
    ['make-arrays', 'function firstName(names: string[]) { return names[0] || null }'],
    // Returns undefined for an empty array.
    ['make-arrays', 'function firstName(names: string[]) { return names[0] }'],
    // Removes the item it reads.
    ['make-arrays', 'function firstName(names: string[]) { return names.shift() ?? null }'],
    // Adds instead of multiplying.
    ['write-functions', 'function totalPrice(price: number, quantity: number) { return price + quantity }'],
    // Rounds the total down.
    ['write-functions', 'function totalPrice(price: number, quantity: number) { return Math.floor(price * quantity) }'],
    // Computes the total but never returns it.
    ['write-functions', 'function totalPrice(price: number, quantity: number) { price * quantity }'],
  ])
})

test('Foundations stage 2 checks reject plausible wrong answers', () => {
  assertMutantsFail([
    // Leaves exactly 50 out of Pass.
    ['pass-or-retry', 'function passLabel(score: number) { return score > 50 ? "Pass" : "Retry" }'],
    // Moves the edge down by one.
    ['pass-or-retry', 'function passLabel(score: number) { return score >= 49 ? "Pass" : "Retry" }'],
    // Treats 100 as out of range.
    ['pass-or-retry', 'function passLabel(score: number) { if (score >= 50 && score < 100) return "Pass"; return "Retry" }'],
    // Tests the lowest band first.
    [
      'use-conditions',
      'function gradeLabel(score: number) { if (score < 0 || score > 100) return "Invalid"; if (score >= 60) return "D"; if (score >= 70) return "C"; if (score >= 80) return "B"; if (score >= 90) return "A"; return "F" }',
    ],
    // Excludes each lower edge from its band.
    [
      'use-conditions',
      'function gradeLabel(score: number) { if (score < 0 || score > 100) return "Invalid"; if (score > 90) return "A"; if (score > 80) return "B"; if (score > 70) return "C"; if (score > 60) return "D"; return "F" }',
    ],
    // Rejects the valid ends 0 and 100.
    [
      'use-conditions',
      'function gradeLabel(score: number) { if (score <= 0 || score >= 100) return "Invalid"; if (score >= 90) return "A"; if (score >= 80) return "B"; if (score >= 70) return "C"; if (score >= 60) return "D"; return "F" }',
    ],
    // Stops before n.
    ['loop-with-for', 'function sumUpTo(n: number) { let total = 0; for (let i = 1; i < n; i++) total += i; return total }'],
    // Overwrites the total instead of adding.
    ['loop-with-for', 'function sumUpTo(n: number) { let total = 0; for (let i = 1; i <= n; i++) total = i; return total }'],
    // Starts the total at 1, so 0 returns 1.
    ['loop-with-for', 'function sumUpTo(n: number) { let total = 1; for (let i = 2; i <= n; i++) total += i; return total }'],
    // Halves without rounding down.
    [
      'loop-while',
      'function stepsToOne(n: number) { let value = n; let steps = 0; while (value > 1) { value = value / 2; steps++ } return steps }',
    ],
    // Keeps going at 1.
    [
      'loop-while',
      'function stepsToOne(n: number) { let value = n; let steps = 0; while (value >= 1) { value = Math.floor(value / 2); steps++ } return steps }',
    ],
    // Always counts one step, even for 1.
    [
      'loop-while',
      'function stepsToOne(n: number) { let value = n; let steps = 0; do { value = Math.floor(value / 2); steps++ } while (value > 1); return steps }',
    ],
    // Reads word[0] of empty pieces.
    ['string-basics', 'function initials(fullName: string) { return fullName.split(" ").map(word => word[0].toUpperCase()).join("") }'],
    // Forgets uppercase.
    ['string-basics', 'function initials(fullName: string) { return fullName.trim().split(" ").map(word => word.slice(0, 1)).join("") }'],
    // Keeps only the first and last words.
    [
      'string-basics',
      'function initials(fullName: string) { const words = fullName.trim().split(" "); return (words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)).toUpperCase() }',
    ],
    // Flips done instead of setting it.
    [
      'object-update',
      'type Task = { title: string; done: boolean; priority: number }; function setDone(task: Task, done: boolean) { return { ...task, done: !task.done } }',
    ],
    // Spreads after done, so the old value wins.
    [
      'object-update',
      'type Task = { title: string; done: boolean; priority: number }; function setDone(task: Task, done: boolean) { return { done, ...task } }',
    ],
    // Changes the received task before copying it.
    [
      'object-update',
      'type Task = { title: string; done: boolean; priority: number }; function setDone(task: Task, done: boolean) { task.done = done; return { ...task } }',
    ],
  ])
})

test('Foundations stage 3 checks reject plausible wrong answers', () => {
  assertMutantsFail([
    // Empties the caller's array with shift() while summing.
    [
      'sum-positive-numbers',
      'function sumPositive(numbers: number[]) { let total = 0; while (numbers.length > 0) { const n = numbers.shift()!; if (n > 0) total += n } return total }',
    ],
    // Returns after the first positive number.
    [
      'sum-positive-numbers',
      'function sumPositive(numbers: number[]) { let total = 0; for (const n of numbers) { if (n > 0) { total += n; return total } } return total }',
    ],
    // Reduces without a starting value.
    ['sum-positive-numbers', 'function sumPositive(numbers: number[]) { return numbers.filter(n => n > 0).reduce((a, b) => a + b) }'],
    // Treats -3 as even, because -3 % 2 is -1.
    [
      'count-even-numbers',
      'function countEvens(numbers: number[]) { let count = 0; for (const n of numbers) if (n % 2 !== 1) count++; return count }',
    ],
    // Leaves out zero and negative evens.
    ['count-even-numbers', 'function countEvens(numbers: number[]) { return numbers.filter(n => n > 0 && n % 2 === 0).length }'],
    // Counts distinct values only.
    ['count-even-numbers', 'function countEvens(numbers: number[]) { return new Set(numbers.filter(n => n % 2 === 0)).size }'],
    // Counts values equal to the limit.
    ['count-above-threshold', 'function countAbove(numbers: number[], limit: number) { return numbers.filter(n => n >= limit).length }'],
    // Counts distinct values only.
    [
      'count-above-threshold',
      'function countAbove(numbers: number[], limit: number) { return [...new Set(numbers)].filter(n => n > limit).length }',
    ],
    // Sorts the caller's array to stop early.
    [
      'count-above-threshold',
      'function countAbove(numbers: number[], limit: number) { numbers.sort((a, b) => b - a); let count = 0; while (count < numbers.length && numbers[count] > limit) count++; return count }',
    ],
    // Excludes a word of exactly the minimum length.
    [
      'first-long-word',
      'function firstLongWord(words: string[], minimum: number) { for (const word of words) if (word.length > minimum) return word; return null }',
    ],
    // Returns undefined instead of null.
    ['first-long-word', 'function firstLongWord(words: string[], minimum: number) { return words.find(w => w.length >= minimum) }'],
    // Returns the shortest qualifying word.
    [
      'first-long-word',
      'function firstLongWord(words: string[], minimum: number) { return [...words].sort((a, b) => a.length - b.length).find(w => w.length >= minimum) ?? null }',
    ],
    // Turns an empty match into null.
    ['first-long-word', 'function firstLongWord(words: string[], minimum: number) { return words.find(w => w.length >= minimum) || null }'],
  ])
})

test('Foundations stage 4 checks reject plausible wrong answers', () => {
  assertMutantsFail([
    // Compares only neighbors, so the two 3s in [3, 1, 3] are missed.
    [
      'has-duplicate',
      'function hasDuplicate(numbers: number[]) { for (let i = 0; i + 1 < numbers.length; i++) if (numbers[i] === numbers[i + 1]) return true; return false }',
    ],
    // Sorts the caller's array so that repeats sit side by side.
    [
      'has-duplicate',
      'function hasDuplicate(numbers: number[]) { numbers.sort((a, b) => a - b); for (let i = 1; i < numbers.length; i++) if (numbers[i] === numbers[i - 1]) return true; return false }',
    ],
    // Adds before checking, so every number looks repeated.
    [
      'has-duplicate',
      'function hasDuplicate(numbers: number[]) { const seen = new Set<number>(); for (const n of numbers) { seen.add(n); if (seen.has(n)) return true } return false }',
    ],
    // Tests the stored index for truthiness: a repeat of the first number reads index 0 as missing.
    [
      'has-duplicate',
      'function hasDuplicate(numbers: number[]) { const firstIndex = new Map<number, number>(); for (let i = 0; i < numbers.length; i++) { if (firstIndex.get(numbers[i])) return true; firstIndex.set(numbers[i], i) } return false }',
    ],
    // Lets the last number to reach the highest count win a tie.
    [
      'most-frequent-number',
      'function mostFrequent(numbers: number[]) { const counts = new Map<number, number>(); let best: number | null = null; for (const n of numbers) { counts.set(n, (counts.get(n) ?? 0) + 1); if (best === null || counts.get(n)! >= counts.get(best)!) best = n } return best }',
    ],
    // Sorts the keys with sort() and no comparator, which orders -1 before -3.
    [
      'most-frequent-number',
      'function mostFrequent(numbers: number[]) { if (numbers.length === 0) return null; const counts = new Map<number, number>(); for (const n of numbers) counts.set(n, (counts.get(n) ?? 0) + 1); const keys = [...counts.keys()].sort(); let best = keys[0]; for (const key of keys) if (counts.get(key)! > counts.get(best)!) best = key; return best }',
    ],
    // Turns a winning 0 into null.
    [
      'most-frequent-number',
      'function mostFrequent(numbers: number[]) { const counts = new Map<number, number>(); let best = 0; let bestCount = 0; for (const n of numbers) { const count = (counts.get(n) ?? 0) + 1; counts.set(n, count); if (count > bestCount || (count === bestCount && n < best)) { best = n; bestCount = count } } return best || null }',
    ],
    // Sorts the caller's array, then counts runs of equal values.
    [
      'most-frequent-number',
      'function mostFrequent(numbers: number[]) { numbers.sort((a, b) => a - b); let best: number | null = null; let bestRun = 0; let run = 0; for (let i = 0; i < numbers.length; i++) { run = i > 0 && numbers[i] === numbers[i - 1] ? run + 1 : 1; if (run > bestRun) { best = numbers[i]; bestRun = run } } return best }',
    ],
    // Lowercases before counting, so a and A count as one character.
    [
      'first-unique-character',
      'function firstUnique(text: string) { const lower = text.toLowerCase(); for (let i = 0; i < lower.length; i++) if (lower.indexOf(lower[i]) === lower.lastIndexOf(lower[i])) return i; return -1 }',
    ],
    // Returns null instead of -1 when no character is unique.
    [
      'first-unique-character',
      'function firstUnique(text: string) { const counts = new Map<string, number>(); for (const c of text) counts.set(c, (counts.get(c) ?? 0) + 1); for (let i = 0; i < text.length; i++) if (counts.get(text[i]) === 1) return i; return null }',
    ],
    // Decides in one pass, before later repeats are seen.
    [
      'first-unique-character',
      'function firstUnique(text: string) { const seen = new Set<string>(); for (let i = 0; i < text.length; i++) { if (!seen.has(text[i])) return i; seen.add(text[i]) } return -1 }',
    ],
    // Keeps the last unique index instead of returning the first.
    [
      'first-unique-character',
      'function firstUnique(text: string) { const counts = new Map<string, number>(); for (const c of text) counts.set(c, (counts.get(c) ?? 0) + 1); let found = -1; for (let i = 0; i < text.length; i++) if (counts.get(text[i]) === 1) found = i; return found }',
    ],
  ])
})

test('Foundations stage 5 checks reject plausible wrong answers', () => {
  assertMutantsFail([
    // Splits at single spaces, so a tab does not separate words.
    ['count-words', "function countWords(text: string) { return text.split(' ').filter(word => word !== '').length }"],
    // Splits at whitespace runs without trimming, so the outer spaces leave empty pieces.
    ['count-words', 'function countWords(text: string) { return text.split(/\\s+/).length }'],
    // Trims and splits but counts the one empty piece left by empty text.
    ['count-words', 'function countWords(text: string) { return text.trim().split(/\\s+/).length }'],
    // Splits at each single whitespace character, so repeated spaces add empty pieces.
    [
      'count-words',
      "function countWords(text: string) { const trimmed = text.trim(); return trimmed === '' ? 0 : trimmed.split(/\\s/).length }",
    ],
    // Uses the largest number as n, so a missing n is never found.
    [
      'missing-number',
      'function missingNumber(numbers: number[]) { const n = Math.max(0, ...numbers); let total = 0; for (let k = 0; k <= n; k++) total += k; for (const value of numbers) total -= value; return total }',
    ],
    // Adds 0 through n - 1, leaving n out of the total.
    [
      'missing-number',
      'function missingNumber(numbers: number[]) { let total = 0; for (let k = 0; k < numbers.length; k++) total += k; for (const value of numbers) total -= value; return total }',
    ],
    // Sorts a copy with sort() and no comparator, which puts 10 before 2.
    [
      'missing-number',
      'function missingNumber(numbers: number[]) { const sorted = [...numbers].sort(); for (let i = 0; i < sorted.length; i++) if (sorted[i] !== i) return i; return sorted.length }',
    ],
    // Sorts the caller's array to find the gap.
    [
      'missing-number',
      'function missingNumber(numbers: number[]) { numbers.sort((a, b) => a - b); for (let i = 0; i < numbers.length; i++) if (numbers[i] !== i) return i; return numbers.length }',
    ],
  ])
})

test('Foundations stage 6 checks reject plausible wrong answers', () => {
  assertMutantsFail([
    // Compares only the totals of ( and ).
    [
      'valid-parentheses',
      "function validParentheses(text: string) { let open = 0; for (const c of text) open += c === '(' ? 1 : -1; return open === 0 }",
    ],
    // Compares the totals and only rejects a text that starts with ).
    [
      'valid-parentheses',
      "function validParentheses(text: string) { let open = 0; for (const c of text) open += c === '(' ? 1 : -1; return open === 0 && text[0] !== ')' }",
    ],
    // Never lets the count go below 0 but forgets that it must end at 0.
    [
      'valid-parentheses',
      "function validParentheses(text: string) { let open = 0; for (const c of text) { open += c === '(' ? 1 : -1; if (open < 0) return false } return true }",
    ],
    // Returns true as soon as the count is back to 0.
    [
      'valid-parentheses',
      "function validParentheses(text: string) { let open = 0; for (const c of text) { open += c === '(' ? 1 : -1; if (open < 0) return false; if (open === 0) return true } return open === 0 }",
    ],
    // Uses one stack for every kind, so a ) can close a [.
    [
      'balanced-brackets',
      "function isBalanced(text: string) { const stack: string[] = []; for (const c of text) { if ('([{'.includes(c)) stack.push(c); else if (stack.pop() === undefined) return false } return stack.length === 0 }",
    ],
    // Forgets to check that nothing is left open at the end.
    [
      'balanced-brackets',
      "function isBalanced(text: string) { const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }; const stack: string[] = []; for (const c of text) { if ('([{'.includes(c)) stack.push(c); else if (stack.pop() !== pairs[c]) return false } return true }",
    ],
    // Skips the comparison when the stack is empty.
    [
      'balanced-brackets',
      "function isBalanced(text: string) { const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }; const stack: string[] = []; for (const c of text) { if ('([{'.includes(c)) stack.push(c); else if (stack.length > 0 && stack.pop() !== pairs[c]) return false } return stack.length === 0 }",
    ],
    // Returns true as soon as the stack is empty again.
    [
      'balanced-brackets',
      "function isBalanced(text: string) { const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }; const stack: string[] = []; for (const c of text) { if ('([{'.includes(c)) stack.push(c); else { if (stack.pop() !== pairs[c]) return false; if (stack.length === 0) return true } } return stack.length === 0 }",
    ],
    // Compares the text with its mirror image, which rejects pairs side by side.
    [
      'balanced-brackets',
      "function isBalanced(text: string) { const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' }; for (let i = 0; i < text.length / 2; i++) if (pairs[text[i]] !== text[text.length - 1 - i]) return false; return text.length % 2 === 0 }",
    ],
    // Removes (), [], and {} once each, in that order, instead of until nothing changes.
    [
      'balanced-brackets',
      "function isBalanced(text: string) { return text.replaceAll('()', '').replaceAll('[]', '').replaceAll('{}', '') === '' }",
    ],
  ])
})
