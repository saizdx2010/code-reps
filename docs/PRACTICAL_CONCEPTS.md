# Practical Concepts

Specialized concepts used in application code, spread across Foundations (How JavaScript runs), Frontend, and Backend. Start with values, functions, arrays, and maps in the TypeScript path; lesson prerequisites identify the next useful reading. Each new lesson has an example trace, two interactive predictions, common mistakes, and a separately revealed reasoning challenge. Coding reps include progressive hints, boundary checks, input preservation, and post-attempt reasoning, alternatives, counterexamples, and transfer prompts.

## Coverage

| Area | Lessons and practice |
| --- | --- |
| Runtime | Closures, reference equality and shallow copies, event-loop ordering; existing promises lesson with a new settled-outcomes rep |
| Patterns | Scoped singletons, observer and topic pub/sub, subscription ordering and cleanup, dependency injection with a fake clock |
| Async control | Trailing debounce, leading throttle, request identities, cancellation, and out-of-order responses |
| Networking | WebSocket lifecycle and send gating; polling, SSE, and bidirectional capability selection |
| Ownership | Shared connections, named leases, reference counting, first acquire/final release, per-owner subscription disposal |
| Reliability | Cache keys and expiry, retry eligibility and bounded reconnect backoff, jitter explanation, idempotency keys and conflicts, optimistic updates and concurrent rollback |

The resource-ownership journey progresses from shared connection leases to independent subscription cleanup, then room membership recall after three days. Recurring review rotates through those applications. The request-ownership journey starts with obsolete-result rejection, continues with independent search display states, and recalls the skill across independent preview slots after three days. Recurring review begins with preserving report data through refresh, failure, and cancellation, then rotates through preview and search applications. Other topics record lesson answers, attempts, and self-assessment but do not claim delayed retention without a dedicated journey. See [Content gaps](./CONTENT_GAPS.md) for the next small batches.

## Verification boundaries

Practical-concept reps run in the existing synchronous TypeScript worker. Networking and scheduling reps operate on deterministic traces, with their simplifications and equality policies stated in their prompts. They do not open sockets, wait on actual timers, or validate server persistence. The promises rep processes already-settled records rather than awaiting requests. Closure, singleton, and injected-clock reps request helper functions, but output checks cannot prove that learners used those helpers or a particular architecture; the self-review must inspect the implementation.

Passing checks establishes the checked behavior, not production integration fluency. Real implementations need checks for actual subscriptions, timing, browser scheduling, disconnect/reconnect behavior, account boundaries, malformed payloads, authentication, concurrent server transactions, and reconciliation with authoritative results as applicable.

Reference implementations live in `tests/fixtures/practical-solutions.mjs` and `tests/fixtures/async-solutions.mjs`, outside learner content. Content tests run every authored check against those solutions. Additional tests reject plausible mistakes, verify path and persistence integration, and exercise delayed recall. Run `yarn content:check`, `yarn lint`, `yarn test`, and `yarn build` after editing.

## Technical references

The examples and exercise policies are authored locally. These primary API references support the underlying platform behavior:

- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
- [MDN: Spread syntax and shallow copies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [MDN: Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN: Microtask guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) and [readyState](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState)
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [MDN: Idempotent HTTP methods](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent)
