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
