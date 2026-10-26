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
