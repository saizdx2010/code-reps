import type { LessonDepth } from './lesson-depth.ts'
import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Post-attempt reviews for the DevOps track. Keep these out of independent and recall prompts.
export const devopsDepth: Record<string, RepDepth> = {
  'devops-exit-meaning': {
    reasoning:
      'The codes form a few ranges with fixed meanings, so the function only has to put each range in the right order. 0 is the one success. 126 and 127 are reserved by the shell for a command it could not run or could not find, and anything above 128 encodes the signal that stopped the process as 128 plus its number. Everything else, including 128 itself, is the command reporting its own failure.',
    trace:
      'For 137, the code is not 0, 126, or 127, and it is above 128, so the signal is 137 - 128 = 9 and the result is "stopped by signal 9". For 128, no special case matches and 128 is not above 128, so it is "failed with code 128". For 255 the signal is 127.',
    alternative:
      'A lookup table of named signals could return "killed (signal 9)" or "terminated (signal 15)", which reads better but needs a table that differs between operating systems. Returning an object such as {ok, signal} would suit a program better than text, but text is what a person reading a CI page needs.',
    counterexample:
      'Testing code >= 128 for signals reports 128 as "stopped by signal 0", which "Treats 128 as an ordinary failure" refuses. Checking the signal range before 126 and 127 is harmless here, but checking "code > 0" for failures first would hide 126 and 127 behind "failed with code".',
    transfer:
      'A test runner documents its own exit codes: 1 for failed tests and 2 for a configuration error. Decide how to combine those meanings with the shell conventions, and which one wins for code 2. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-first-error': {
    reasoning:
      'Cleaning first means every rule sees the text a person would read: colour codes and the leading timestamp are presentation, not content. Skipping warnings and the exit-code summary before testing for errors means a line that mentions an error without being one can never be reported. The first remaining error is the earliest point where something went wrong, which is usually the cause.',
    trace:
      'For "\\u001b[90m2026-10-19T08:00:01Z\\u001b[0m error: lost connection", removing colour codes leaves "2026-10-19T08:00:01Z error: lost connection"; the timestamp is now at the start, so it is removed, leaving "error: lost connection". For "Errors: 0", the lowercased text starts with "error" but the next character is "s", so it is not the word error and the line is skipped.',
    alternative:
      'Searching for the substring "error" anywhere is shorter but reports "Errors: 0" and "errorHandler registered". A real problem matcher uses one pattern per tool, which is more precise but needs configuration for every tool; this rep trades that for a small fixed rule set.',
    counterexample:
      'Removing the timestamp before the colour codes misses it when the timestamp is coloured, so "Removes colour codes before the timestamp" returns a line that still starts with the date and is not seen as an error. A timestamp replace that is not anchored to the start also removes the time from "error: retry stopped at 2026-10-19T08:00:01Z after 3 tries".',
    transfer:
      'Some tools print the error on one line and its explanation on the next three lines, indented. Decide how to return the error with its indented lines, and when the explanation ends. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-step-outcomes': {
    reasoning:
      'The job carries one fact forward: whether a step has failed it yet. Each step decides whether it runs from its condition and that fact, and only a real failure, one not allowed by continueOnError, changes the fact. Because the fact only ever turns on, the status at the end is simply its final value.',
    trace:
      'For a, b (always), c (always), d: a exits 1 and is not allowed to fail, so it is failed and the job has failed. b runs because it always runs and passes. c always runs and exits 3, so it is failed too, and the job stays failed. d runs only on success, so it is skipped. The status is failure.',
    alternative:
      'Recording the failing step\'s name instead of a boolean would let later steps say why they were skipped, at the cost of a slightly larger state. CI services also offer a "cancelled" condition and per-step timeouts, which would add more states to the same loop.',
    counterexample:
      'Letting an ignored failure set the failed flag runs the failure step in "An ignored failure does not start failure steps" and reports a failed job. Using a skipped step\'s exit code fails the job in "A skipped step never fails".',
    transfer:
      'Add a fourth condition, "cancelled", for steps that run only when someone cancels the job part way. Decide how a cancellation is passed in and how it combines with failure. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-error-annotations': {
    reasoning:
      'An anchored pattern accepts a line only when the whole trimmed line has the expected shape, so a different format or a missing message cannot slip through as a partial match. A key made of file, line, column, and code identifies one problem, so a repeat is dropped before counting, and the limit applies only to new problems, with the rest reported as omitted rather than lost.',
    trace:
      'With limit 1 and two lines both "src/a.ts(1,1): error TS1005", the first is new, so it becomes the one annotation. The second has the same key, so it is dropped before the limit is checked and omitted stays 0. With limit 0 and two different errors, both are new and both are counted as omitted.',
    alternative:
      'Running the compiler with a machine-readable output format avoids parsing text altogether, when the tool offers one. Grouping errors by file would suit a summary page better than log order, but annotations usually appear in the order they were found.',
    counterexample:
      'Counting duplicates as omitted reports 1 in "Drops a repeated error without counting it". A pattern without the end anchor, or one that allows an empty message, accepts "src/a.ts(1,1): error TS1005: ".',
    transfer:
      'Accept the "pretty" format too, src/a.ts:3:7 - error TS2304: message. Decide whether one error printed in both formats counts once or twice. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-failing-step': {
    reasoning:
      "Two decisions are kept apart: which step to blame, then what explains it. The step is found from exit codes and continueOnError alone, so errors printed by an allowed step can never be blamed. Only then is that one step's log read, and the exit code is described only when the log has no error line, because a message from the program is more specific than a number.",
    trace:
      'For an allowed Lint step whose log says "error: unused total" and a Test step that exits 1 with the log "Tests: 1 failed", the first non-zero step that is not allowed is Test. Its log has no line starting with the word error or fatal, so line is null and the cause is "exit code 1". The lint error is never looked at.',
    alternative:
      'Reporting every failed step, including allowed ones, gives a fuller picture but hides which one stopped the job. Reading the last error in the log is sometimes more specific, but it is more often an effect of the first.',
    counterexample:
      'Searching every step\'s log for the first error blames Lint in "Ignores error lines in an allowed failure". Reporting the last failing step blames Cleanup in "Reports the first failing step, not a later one".',
    transfer:
      "Steps can now be retried once. Each step lists its attempts, and the step fails only if its last attempt fails. Decide which attempt's log explains the failure. This changed contract is self-reviewed, not checked by the original cases.",
  },
}

export const devopsGuides: Record<string, ReflectionGuide> = {
  'devops-exit-meaning': {
    plan: ['Return the text for 0, 126, and 127.', 'Turn codes above 128 into a signal number.', 'Describe every other code as a failure.'],
    explanation: ['Trace 128 and 129.', 'Explain what 137 usually means in CI.', 'Say why 0 is the only success.'],
    example:
      'I return "passed" for 0, "not executable" for 126, and "command not found" for 127. A code above 128 returns "stopped by signal" with code - 128. Anything else is "failed with code" and the code. The work is constant. The checks call the function directly; no shell runs.',
  },
  'devops-first-error': {
    plan: [
      'Clean each line: colour codes, then a leading timestamp, then trim.',
      'Skip warnings and the exit-code summary line.',
      'Return the first line that matches an error rule, with its line number.',
    ],
    explanation: [
      'Trace a coloured, timestamped error line.',
      'Explain why "Errors: 0" is not an error.',
      'Say why the last line is not the cause.',
    ],
    example:
      'For each line I remove /\\u001b\\[[0-9;]*m/g, then an ISO time at the start followed by a space, then trim. I skip lines starting with "warn" or containing "process completed with exit code". A line starting with the word error or fatal, starting with "npm err!", or containing ": error " is returned as {line: index + 1, text}. The work is linear in the log. The checks pass authored lines, not a real CI log.',
  },
  'devops-step-outcomes': {
    plan: [
      'Start with failed = false.',
      'Decide whether each step runs from its condition and failed.',
      'Record its outcome, and set failed only for a failure that is not allowed.',
    ],
    explanation: [
      'Trace a job where a step fails and an always step follows.',
      'Explain why an allowed failure does not start failure steps.',
      "Say what a skipped step's exit code means.",
    ],
    example:
      'I keep failed = false. A step runs when its condition is always, or success while not failed, or failure while failed. A skipped step is "skipped"; exit 0 is "passed"; otherwise it is "ignored" if continueOnError, or "failed" and failed becomes true. The status is failure if failed is true. The work is linear in the steps. The checks pass authored steps, not a CI service.',
  },
  'devops-error-annotations': {
    plan: [
      'Match each trimmed line against one anchored pattern.',
      'Drop a match whose file, line, column, and code were seen before.',
      'Keep the first limit annotations and count the rest as omitted.',
    ],
    explanation: [
      'Trace a repeated error with a limit of 1.',
      'Explain why the pattern is anchored at both ends.',
      'Say what omitted tells a reader.',
    ],
    example:
      'I test each trimmed line with /^([^\\s()]+)\\((\\d+),(\\d+)\\): error (TS\\d+): (.+)$/. A match builds a key from file, line, column, and code; a seen key is dropped. New matches are pushed while there are fewer than limit, and counted as omitted otherwise. The work is linear in the lines. The checks pass authored lines; no compiler or CI service runs.',
  },
  'devops-failing-step': {
    plan: [
      'Find the first step with a non-zero exit code that is not allowed to fail.',
      'Look for the first error or fatal line in its log.',
      'Describe its exit code when the log has none.',
    ],
    explanation: [
      'Trace a job with an allowed lint failure and a failing test step.',
      "Explain why only one step's log is read.",
      'Say what "stopped by signal 9" suggests.',
    ],
    example:
      'I find the first step with exitCode !== 0 and continueOnError false, or return null. In its log I find the first trimmed line matching /^(error|fatal)\\b/i and return its 1-based position and text. Without one, the cause is "command not found" for 127, "stopped by signal" and code - 128 above 128, and "exit code" otherwise. The work is linear in the steps and that log. The checks pass authored steps, not a CI service.',
  },
}

export const devopsLessonDepth: Record<string, LessonDepth> = {
  'ci-output': {
    title: 'The last line reports a failure; the first error explains it',
    code: "PASS src/cart.test.ts\nError: Cannot find module './tax'\nTypeError: calculateTax is not a function\nError: Process completed with exit code 1.",
    reasoning:
      'Programs keep running for a while after something goes wrong, so one cause often produces several errors. Here the missing module comes first; the TypeError follows because the function it should have provided does not exist. The last line is written by CI after the step ends and only repeats that it failed. Fixing the first error usually removes the later ones, while fixing a later one first treats a symptom.',
    challenge:
      'A log shows "warning: error handler is deprecated", then "Errors: 0", then "fatal: could not read from remote repository", then "npm ERR! code 128". Predict which line is the first real error, and what the exit code 128 in the last line most likely is.',
    answer:
      'The warning and "Errors: 0" are not errors. The first real error is "fatal: could not read from remote repository", a Git failure such as a missing access token or a wrong URL. "npm ERR! code 128" is a later effect: npm reporting that the Git command it ran exited with 128, which is an ordinary failure code, not a signal.',
  },
}
