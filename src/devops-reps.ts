import type { Rep } from './rep-types.ts'

// DevOps track reps. Each one is a plain TypeScript function that applies an authored policy to authored inputs. The
// checks never run a shell, Docker, a CI service, or a real network, and anything that depends on time takes the
// instant and the time zone as inputs. Every rep's note says so. Reviews live in src/review-devops.ts.
const notRun = 'The checks call your function with authored inputs; they do not run a shell, Docker, a CI service, or a real network.'

export const devopsReps: Rep[] = [
  {
    id: 'devops-exit-meaning',
    title: 'Read an exit code',
    category: 'DevOps',
    format: 'devops',
    context:
      'Every command a CI job runs ends with an exit code, a whole number from 0 to 255. CI treats 0 as success and anything else as failure, and a few values say more about what went wrong, which tells you where to look first.',
    prompt:
      'Implement exitMeaning(code). code is a whole number from 0 to 255. Return "passed" for 0, "not executable" for 126, "command not found" for 127, and "stopped by signal N" for 129 to 255, where N is code - 128. Return "failed with code N" for every other code, where N is the code.',
    brief: {
      summary: 'Implement exitMeaning(code), where code is a whole number from 0 to 255.',
      rules: [
        'Return "passed" for 0.',
        'Return "not executable" for 126 and "command not found" for 127.',
        'Return "stopped by signal N" for 129 to 255, where N is code - 128.',
        'Return "failed with code N" for every other code, where N is the code.',
      ],
      edgeCases: ['128 is an ordinary failure, not a signal.', '255 is signal 127.'],
    },
    example: { input: 'exitMeaning(137)', output: '"stopped by signal 9"' },
    note: `These meanings follow common shell conventions; a program can also choose its own codes. Signal 9 (code 137) often means the system stopped the process, for example when it ran out of memory. ${notRun}`,
    vocabulary: [
      { term: 'Exit code', meaning: 'the whole number a finished command reports: 0 for success, anything else for failure' },
      { term: 'Signal', meaning: 'a message the operating system sends to a running process, for example to stop it' },
    ],
    planPrompt:
      'List the ranges your function has to tell apart. Which code sits on each boundary, and what does each boundary code return?',
    starter:
      "function exitMeaning(code: number): string {\n  // Check the codes with their own text first, then the ranges.\n  return 'passed'\n}\n",
    functionName: 'exitMeaning',
    hints: [
      'Handle 0, 126, and 127 first; each has its own text.',
      'Codes above 128 mean a signal stopped the command; subtract 128 to get its number.',
      'A template string puts the number into the text, as in `failed with code ${code}`.',
    ],
    checks: [
      { name: 'Reports success for 0', input: [0], expected: 'passed' },
      { name: 'Reports an ordinary failure', input: [1], expected: 'failed with code 1' },
      { name: 'Keeps the code in the text', input: [2], expected: 'failed with code 2' },
      { name: 'Treats 125 as an ordinary failure', input: [125], expected: 'failed with code 125' },
      { name: 'Names 126', input: [126], expected: 'not executable' },
      { name: 'Names 127', input: [127], expected: 'command not found' },
      { name: 'Treats 128 as an ordinary failure', input: [128], expected: 'failed with code 128' },
      { name: 'Starts signals at 129', input: [129], expected: 'stopped by signal 1' },
      { name: 'Reads signal 9 from 137', input: [137], expected: 'stopped by signal 9' },
      { name: 'Reads signal 15 from 143', input: [143], expected: 'stopped by signal 15' },
      { name: 'Handles the largest code', input: [255], expected: 'stopped by signal 127' },
    ],
  },
  {
    id: 'devops-first-error',
    title: 'Find the first real error in a log',
    category: 'DevOps',
    format: 'devops',
    context:
      'A failed CI step can print hundreds of lines: colour codes, timestamps, warnings, stack traces, and a final line saying the step failed. The last line only reports the failure. The cause is usually the first error, so that is the line to find.',
    prompt:
      'Implement firstError(lines), where lines is the output of one failed CI step. Clean each line first: remove every ANSI colour code (the escape character, code 27, then "[", any digits and semicolons, then "m"); then remove a leading timestamp, an ISO 8601 UTC time such as 2026-10-19T08:00:01Z or 2026-10-19T08:00:01.123Z followed by one space; then trim spaces from both ends. Ignore a cleaned line that starts with "warn" or that contains "process completed with exit code" (both in any letter case). A cleaned line is an error when, in any letter case, it starts with the word "error" or "fatal" (not followed by a letter, digit, or underscore), starts with "npm err!", or contains ": error ". Return {line, text} for the first error, where line counts from 1 and text is the cleaned line, or null when there is none. Do not change lines.',
    brief: {
      summary: 'Implement firstError(lines) and return {line, text} for the first error, or null.',
      rules: [
        'Clean each line: remove ANSI colour codes (code 27, "[", digits and semicolons, "m"), then a leading ISO 8601 UTC timestamp such as 2026-10-19T08:00:01Z or 2026-10-19T08:00:01.123Z and its space, then trim.',
        'Ignore a cleaned line that starts with "warn" or contains "process completed with exit code" (any letter case).',
        'An error starts with the word "error" or "fatal" (not followed by a letter, digit, or underscore), starts with "npm err!", or contains ": error ", in any letter case.',
        'Return {line, text} with line counted from 1 and the cleaned text, or null.',
      ],
      edgeCases: [
        'Blank lines still count toward the line number.',
        'Only a timestamp at the start of a line is removed.',
        'Do not change lines.',
      ],
    },
    example: {
      input:
        'firstError(["Run npm test", "PASS src/cart.test.ts", "Error: Cannot find module \'./tax\'", "Error: Process completed with exit code 1."])',
      output: '{line: 3, text: "Error: Cannot find module \'./tax\'"}',
    },
    note: `lines has at most 2,000 entries. These rules are this rep's authored policy for spotting errors; real tools print many other formats. ${notRun}`,
    vocabulary: [
      { term: 'CI log', meaning: 'the text output a CI job records while it runs each step' },
      { term: 'ANSI colour code', meaning: 'a short hidden sequence in terminal output that changes the colour of the text after it' },
    ],
    planPrompt:
      'Why is the last line of a failed step rarely the line to read? Name three kinds of line your function must not report, and one line that looks harmless but is the error.',
    starter:
      'function firstError(lines: string[]): { line: number; text: string } | null {\n  // Clean each line, then decide whether it is an error.\n  return null\n}\n',
    functionName: 'firstError',
    preserveInput: true,
    hints: [
      'Write the cleaning as its own small function: colour codes first, then the timestamp at the start, then trim.',
      'A regular expression with \\b after the word, or a check of the next character, tells "error:" from "errors" and "errorHandler".',
      'Lowercase the cleaned line once for the comparisons, but return the cleaned line with its original letter case.',
    ],
    checks: [
      {
        name: 'Finds the error in the example',
        input: [
          ['Run npm test', 'PASS src/cart.test.ts', "Error: Cannot find module './tax'", 'Error: Process completed with exit code 1.'],
        ],
        expected: { line: 3, text: "Error: Cannot find module './tax'" },
      },
      {
        name: 'Skips warnings that mention an error',
        input: [['warning: error handler is deprecated in retry.ts', 'WARN deprecated request@2.88.2', 'error: build failed']],
        expected: { line: 3, text: 'error: build failed' },
      },
      {
        name: 'Skips the line that reports the exit code',
        input: [['Compiling...', 'Error: Process completed with exit code 2.', 'ERROR: PROCESS COMPLETED WITH EXIT CODE 2']],
        expected: null,
      },
      {
        name: 'Needs the whole word error',
        input: [['Errors: 0', 'errorHandler registered', 'error_count=0', 'ERROR in ./src/index.ts']],
        expected: { line: 4, text: 'ERROR in ./src/index.ts' },
      },
      {
        name: 'Removes colour codes',
        input: [['\u001b[32m✓ 12 tests\u001b[0m', '\u001b[1;31merror\u001b[0m: 2 tests failed']],
        expected: { line: 2, text: 'error: 2 tests failed' },
      },
      {
        name: 'Removes a leading timestamp',
        input: [['2026-10-19T08:00:01.123Z npm ci', '2026-10-19T08:00:09.870Z fatal: could not read from remote repository']],
        expected: { line: 2, text: 'fatal: could not read from remote repository' },
      },
      {
        name: 'Removes a timestamp without a fraction',
        input: [['2026-10-19T08:00:01Z Error: disk full']],
        expected: { line: 1, text: 'Error: disk full' },
      },
      {
        name: 'Removes colour codes before the timestamp',
        input: [['\u001b[90m2026-10-19T08:00:01Z\u001b[0m error: lost connection']],
        expected: { line: 1, text: 'error: lost connection' },
      },
      {
        name: 'Keeps a timestamp that is not at the start',
        input: [['error: retry stopped at 2026-10-19T08:00:01Z after 3 tries']],
        expected: { line: 1, text: 'error: retry stopped at 2026-10-19T08:00:01Z after 3 tries' },
      },
      {
        name: 'Finds a compiler error inside the line',
        input: [['tsc -b', "src/cart.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'."]],
        expected: { line: 2, text: "src/cart.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'." },
      },
      {
        name: 'Finds an npm error',
        input: [['> build', 'npm ERR! code ELIFECYCLE', 'npm ERR! errno 1']],
        expected: { line: 2, text: 'npm ERR! code ELIFECYCLE' },
      },
      {
        name: 'Counts blank lines and trims spaces',
        input: [['', '   ', '   error: out of space   ']],
        expected: { line: 3, text: 'error: out of space' },
      },
      { name: 'Returns null for a clean log', input: [['Run npm test', 'PASS src/a.test.ts', 'Tests: 4 passed']], expected: null },
      { name: 'Handles an empty log', input: [[]], expected: null },
    ],
  },
  {
    id: 'devops-step-outcomes',
    title: 'Decide which steps ran',
    category: 'DevOps',
    format: 'devops',
    context:
      'A CI job runs its steps in order. After a step fails, later steps are skipped unless they are marked to run on failure or always, such as one that uploads a test report. A step can also be allowed to fail without failing the job, such as an optional lint.',
    prompt:
      'Implement stepOutcomes(steps). Each step is {name, exitCode, when, continueOnError}, in job order; exitCode is the code the step would exit with if it ran. when is "success" (run only while the job has not failed), "failure" (run only after the job has failed), or "always". A step that does not run is "skipped". A step that runs and exits with 0 is "passed". A step that runs and exits with another code is "ignored" if continueOnError is true, and otherwise "failed", and from then on the job has failed. Return {status, outcomes}: status is "failure" if any step failed and "success" otherwise, and outcomes lists {name, outcome} in order. Do not change steps.',
    brief: {
      summary: 'Implement stepOutcomes(steps) and return {status, outcomes}.',
      rules: [
        'when "success" runs only while the job has not failed, "failure" only after it has failed, and "always" every time.',
        'A step that does not run is "skipped"; one that runs and exits with 0 is "passed".',
        'A step that runs and exits with another code is "ignored" when continueOnError is true, and otherwise "failed", which fails the job from then on.',
        'status is "failure" if any step failed and "success" otherwise; outcomes lists {name, outcome} in order.',
      ],
      edgeCases: [
        'A skipped step never fails, whatever its exit code.',
        'An ignored failure does not start "failure" steps.',
        'Do not change steps.',
      ],
    },
    example: {
      input:
        'stepOutcomes([{name: "test", exitCode: 1, when: "success", continueOnError: false}, {name: "report", exitCode: 0, when: "always", continueOnError: false}, {name: "deploy", exitCode: 0, when: "success", continueOnError: false}])',
      output:
        '{status: "failure", outcomes: [{name: "test", outcome: "failed"}, {name: "report", outcome: "passed"}, {name: "deploy", outcome: "skipped"}]}',
    },
    note: `Step names are unique; there are at most 100 steps. Real CI services have more conditions than these three. ${notRun}`,
    vocabulary: [
      { term: 'Job', meaning: 'a list of steps that CI runs in order on one machine' },
      { term: 'Continue on error', meaning: 'a setting that lets a step fail without failing the job' },
    ],
    planPrompt:
      'Steps: build fails, notify runs on failure, cleanup always runs, deploy runs on success. Which run, what is each outcome, and what is the job status?',
    starter:
      "type Step = { name: string; exitCode: number; when: 'success' | 'failure' | 'always'; continueOnError: boolean }\n\nfunction stepOutcomes(steps: Step[]) {\n  // Track whether the job has failed as you go.\n  return { status: 'success', outcomes: [] as { name: string; outcome: string }[] }\n}\n",
    functionName: 'stepOutcomes',
    preserveInput: true,
    hints: [
      'Keep one boolean, failed, that starts false and only ever becomes true.',
      'Decide whether a step runs from when and failed before looking at its exit code.',
      'An ignored failure leaves failed unchanged.',
    ],
    checks: [
      {
        name: 'Runs the example',
        input: [
          [
            { name: 'test', exitCode: 1, when: 'success', continueOnError: false },
            { name: 'report', exitCode: 0, when: 'always', continueOnError: false },
            { name: 'deploy', exitCode: 0, when: 'success', continueOnError: false },
          ],
        ],
        expected: {
          status: 'failure',
          outcomes: [
            { name: 'test', outcome: 'failed' },
            { name: 'report', outcome: 'passed' },
            { name: 'deploy', outcome: 'skipped' },
          ],
        },
      },
      {
        name: 'Runs every step when nothing fails',
        input: [
          [
            { name: 'checkout', exitCode: 0, when: 'success', continueOnError: false },
            { name: 'test', exitCode: 0, when: 'success', continueOnError: false },
          ],
        ],
        expected: {
          status: 'success',
          outcomes: [
            { name: 'checkout', outcome: 'passed' },
            { name: 'test', outcome: 'passed' },
          ],
        },
      },
      {
        name: 'An ignored failure does not fail the job',
        input: [
          [
            { name: 'lint', exitCode: 1, when: 'success', continueOnError: true },
            { name: 'test', exitCode: 0, when: 'success', continueOnError: false },
          ],
        ],
        expected: {
          status: 'success',
          outcomes: [
            { name: 'lint', outcome: 'ignored' },
            { name: 'test', outcome: 'passed' },
          ],
        },
      },
      {
        name: 'Skips a failure step when nothing failed',
        input: [
          [
            { name: 'build', exitCode: 0, when: 'success', continueOnError: false },
            { name: 'notify', exitCode: 0, when: 'failure', continueOnError: false },
          ],
        ],
        expected: {
          status: 'success',
          outcomes: [
            { name: 'build', outcome: 'passed' },
            { name: 'notify', outcome: 'skipped' },
          ],
        },
      },
      {
        name: 'Runs failure and always steps after a failure',
        input: [
          [
            { name: 'build', exitCode: 2, when: 'success', continueOnError: false },
            { name: 'notify', exitCode: 0, when: 'failure', continueOnError: false },
            { name: 'cleanup', exitCode: 0, when: 'always', continueOnError: false },
          ],
        ],
        expected: {
          status: 'failure',
          outcomes: [
            { name: 'build', outcome: 'failed' },
            { name: 'notify', outcome: 'passed' },
            { name: 'cleanup', outcome: 'passed' },
          ],
        },
      },
      {
        name: 'A failing always step fails the job',
        input: [
          [
            { name: 'build', exitCode: 0, when: 'success', continueOnError: false },
            { name: 'cleanup', exitCode: 1, when: 'always', continueOnError: false },
          ],
        ],
        expected: {
          status: 'failure',
          outcomes: [
            { name: 'build', outcome: 'passed' },
            { name: 'cleanup', outcome: 'failed' },
          ],
        },
      },
      {
        name: 'A skipped step never fails',
        input: [
          [
            { name: 'test', exitCode: 1, when: 'success', continueOnError: false },
            { name: 'deploy', exitCode: 1, when: 'success', continueOnError: false },
          ],
        ],
        expected: {
          status: 'failure',
          outcomes: [
            { name: 'test', outcome: 'failed' },
            { name: 'deploy', outcome: 'skipped' },
          ],
        },
      },
      {
        name: 'Ignores a failure in a failure step',
        input: [
          [
            { name: 'build', exitCode: 1, when: 'success', continueOnError: false },
            { name: 'notify', exitCode: 7, when: 'failure', continueOnError: true },
          ],
        ],
        expected: {
          status: 'failure',
          outcomes: [
            { name: 'build', outcome: 'failed' },
            { name: 'notify', outcome: 'ignored' },
          ],
        },
      },
      {
        name: 'Keeps running always steps after several failures',
        input: [
          [
            { name: 'a', exitCode: 1, when: 'success', continueOnError: false },
            { name: 'b', exitCode: 0, when: 'always', continueOnError: false },
            { name: 'c', exitCode: 3, when: 'always', continueOnError: false },
            { name: 'd', exitCode: 0, when: 'success', continueOnError: false },
          ],
        ],
        expected: {
          status: 'failure',
          outcomes: [
            { name: 'a', outcome: 'failed' },
            { name: 'b', outcome: 'passed' },
            { name: 'c', outcome: 'failed' },
            { name: 'd', outcome: 'skipped' },
          ],
        },
      },
      {
        name: 'An ignored failure does not start failure steps',
        input: [
          [
            { name: 'lint', exitCode: 1, when: 'success', continueOnError: true },
            { name: 'report', exitCode: 0, when: 'failure', continueOnError: false },
          ],
        ],
        expected: {
          status: 'success',
          outcomes: [
            { name: 'lint', outcome: 'ignored' },
            { name: 'report', outcome: 'skipped' },
          ],
        },
      },
      { name: 'A job with no steps succeeds', input: [[]], expected: { status: 'success', outcomes: [] } },
    ],
  },
  {
    id: 'devops-error-annotations',
    title: 'Turn compiler errors into annotations',
    category: 'DevOps',
    format: 'devops',
    context:
      'CI services can show an error next to the line of code it is about, as an annotation, instead of leaving it buried in a log. To do that, a small matcher reads each log line, keeps the ones in a known format, and pulls out the file, position, and message. Services also cap how many annotations one step may add.',
    prompt:
      'Implement annotations(lines, limit). A TypeScript compiler error line looks like src/cart.ts(12,5): error TS2322: Type \'string\' is not assignable. After trimming, a line is an error line when it is exactly: a file path with no spaces or parentheses, "(", a line number, ",", a column number, "): error TS" and one or more digits, ": ", and a message that is not empty. Turn each error line into {file, line, column, code, message}, where line and column are numbers and code is "TS" with its digits, such as "TS2322". Drop an error line whose file, line, column, and code all match an earlier error line. Keep the first limit annotations in log order, and count the rest as omitted. Return {annotations, omitted}. Ignore every other line, and do not change lines.',
    brief: {
      summary: 'Implement annotations(lines, limit) and return {annotations, omitted}.',
      rules: [
        'After trimming, an error line such as src/cart.ts(12,5): error TS2322: message is exactly: a path with no spaces or parentheses, "(", line, ",", column, "): error TS" and digits, ": ", and a non-empty message.',
        'Turn it into {file, line, column, code, message}, with line and column as numbers and code like "TS2322".',
        'Drop an error line whose file, line, column, and code match an earlier one; it is not counted.',
        'Keep the first limit annotations in log order; omitted counts the rest.',
      ],
      edgeCases: ['A message can contain more colons.', 'A limit of 0 keeps none.', 'Do not change lines.'],
    },
    example: {
      input: "annotations([\"src/cart.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.\", 'Found 1 error.'], 10)",
      output:
        "{annotations: [{file: 'src/cart.ts', line: 12, column: 5, code: 'TS2322', message: \"Type 'string' is not assignable to type 'number'.\"}], omitted: 0}",
    },
    note: `limit is a whole number from 0 to 50; lines has at most 2,000 entries. Real matchers are configured per tool; this rep uses one fixed format. ${notRun}`,
    vocabulary: [
      { term: 'Annotation', meaning: 'a note a CI service shows beside a line of code, such as an error found by a check' },
      { term: 'Problem matcher', meaning: 'a pattern that picks errors out of log lines and turns them into annotations' },
    ],
    planPrompt:
      'Which parts of src/cart.ts(12,5): error TS2322: Type is wrong. does your pattern have to capture, and which nearby formats must it refuse?',
    starter:
      'type Annotation = { file: string; line: number; column: number; code: string; message: string }\n\nfunction annotations(lines: string[], limit: number): { annotations: Annotation[]; omitted: number } {\n  // Match each trimmed line against the error format.\n  return { annotations: [], omitted: 0 }\n}\n',
    functionName: 'annotations',
    preserveInput: true,
    hints: [
      'One regular expression anchored with ^ and $ can capture all five parts; [^\\s()]+ matches a path without spaces or parentheses.',
      'Keep a Set of "file|line|column|code" keys you have already seen, so a repeat is dropped before it is counted.',
      'Count every new error line, but only push it while you have fewer than limit annotations.',
    ],
    checks: [
      {
        name: 'Reads the example',
        input: [["src/cart.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.", 'Found 1 error.'], 10],
        expected: {
          annotations: [
            { file: 'src/cart.ts', line: 12, column: 5, code: 'TS2322', message: "Type 'string' is not assignable to type 'number'." },
          ],
          omitted: 0,
        },
      },
      {
        name: 'Keeps several errors in log order',
        input: [["src/b.ts(3,1): error TS2304: Cannot find name 'tax'.", "src/a.ts(9,14): error TS1005: ';' expected."], 10],
        expected: {
          annotations: [
            { file: 'src/b.ts', line: 3, column: 1, code: 'TS2304', message: "Cannot find name 'tax'." },
            { file: 'src/a.ts', line: 9, column: 14, code: 'TS1005', message: "';' expected." },
          ],
          omitted: 0,
        },
      },
      {
        name: 'Applies the limit and counts the rest',
        input: [
          [
            'src/a.ts(1,1): error TS1005: one',
            'src/a.ts(2,1): error TS1005: two',
            'src/a.ts(3,1): error TS1005: three',
            'src/a.ts(4,1): error TS1005: four',
          ],
          2,
        ],
        expected: {
          annotations: [
            { file: 'src/a.ts', line: 1, column: 1, code: 'TS1005', message: 'one' },
            { file: 'src/a.ts', line: 2, column: 1, code: 'TS1005', message: 'two' },
          ],
          omitted: 2,
        },
      },
      {
        name: 'Drops a repeated error without counting it',
        input: [['src/a.ts(1,1): error TS1005: first', 'src/a.ts(1,1): error TS1005: printed again'], 1],
        expected: { annotations: [{ file: 'src/a.ts', line: 1, column: 1, code: 'TS1005', message: 'first' }], omitted: 0 },
      },
      {
        name: 'Keeps two codes at one position',
        input: [['src/a.ts(1,1): error TS1005: first', 'src/a.ts(1,1): error TS2304: second'], 5],
        expected: {
          annotations: [
            { file: 'src/a.ts', line: 1, column: 1, code: 'TS1005', message: 'first' },
            { file: 'src/a.ts', line: 1, column: 1, code: 'TS2304', message: 'second' },
          ],
          omitted: 0,
        },
      },
      {
        name: 'Ignores other formats',
        input: [
          [
            "src/a.ts:3:7 - error TS2304: Cannot find name 'x'.",
            "> src/a.ts(3,7): error TS2304: Cannot find name 'x'.",
            'warning TS6133: unused',
            'error TS5023: Unknown compiler option',
            'src/a.ts(3,7): warning TS6133: unused',
          ],
          5,
        ],
        expected: { annotations: [], omitted: 0 },
      },
      {
        name: 'Trims each line',
        input: [["   src/a.ts(2,3): error TS1005: ';' expected.   "], 5],
        expected: { annotations: [{ file: 'src/a.ts', line: 2, column: 3, code: 'TS1005', message: "';' expected." }], omitted: 0 },
      },
      { name: 'Needs a message', input: [['src/a.ts(1,1): error TS1005: '], 5], expected: { annotations: [], omitted: 0 } },
      { name: 'Refuses a path with spaces', input: [['my file.ts(1,1): error TS1005: x'], 5], expected: { annotations: [], omitted: 0 } },
      {
        name: 'Keeps colons in the message',
        input: [["src/a.ts(2,3): error TS2551: Property 'nme' does not exist. Did you mean: 'name'?"], 5],
        expected: {
          annotations: [
            { file: 'src/a.ts', line: 2, column: 3, code: 'TS2551', message: "Property 'nme' does not exist. Did you mean: 'name'?" },
          ],
          omitted: 0,
        },
      },
      {
        name: 'Keeps none with a limit of 0',
        input: [['src/a.ts(1,1): error TS1005: one', 'src/a.ts(2,1): error TS1005: two'], 0],
        expected: { annotations: [], omitted: 2 },
      },
    ],
  },
  {
    id: 'devops-failing-step',
    title: 'Name the step that failed a job',
    category: 'DevOps',
    format: 'devops',
    context:
      'A job failed and its page lists several steps, some with errors in their logs. A step allowed to fail may show errors without being the reason, and a later step that always runs may fail too. The useful answer names the one step that failed the job and the line, or the exit code, that explains it.',
    prompt:
      'Implement failingStep(steps). steps lists the steps of a CI job that ran, in order: {name, exitCode, continueOnError, log}, where log is an array of output lines. The step that failed the job is the first one whose exitCode is not 0 and whose continueOnError is false; if there is none, return null. Otherwise return {step, line, cause} for that step. Look through its log for the first line that, after trimming, starts with the word "error" or "fatal" in any letter case (not followed by a letter, digit, or underscore). If there is one, line is its position counting from 1 and cause is the trimmed line. If there is none, line is null and cause describes the exit code: "command not found" for 127, "stopped by signal N" for 129 to 255 (N is exitCode - 128), and otherwise "exit code N". Do not change steps.',
    brief: {
      summary: 'Implement failingStep(steps) and return {step, line, cause}, or null.',
      rules: [
        'The step that failed the job is the first whose exitCode is not 0 and whose continueOnError is false; with none, return null.',
        'In its log, find the first line that, trimmed, starts with the word "error" or "fatal" in any letter case (not followed by a letter, digit, or underscore).',
        'If found, line is its position from 1 and cause is the trimmed line.',
        'Otherwise line is null and cause is "command not found" for 127, "stopped by signal N" for 129 to 255 (N is exitCode - 128), or "exit code N".',
      ],
      edgeCases: ['Errors in a step allowed to fail are not the cause.', 'Do not change steps.'],
    },
    example: {
      input:
        'failingStep([{name: "Lint", exitCode: 1, continueOnError: true, log: ["error: unused total"]}, {name: "Test", exitCode: 1, continueOnError: false, log: ["PASS a.test.ts", "  Error: expected 3, received 2"]}])',
      output: '{step: "Test", line: 2, cause: "Error: expected 3, received 2"}',
    },
    note: `Step names are unique; each log has at most 2,000 lines and there are at most 100 steps. ${notRun}`,
    vocabulary: [
      { term: 'Failing step', meaning: 'the step whose failure made the whole job fail' },
      { term: 'Root cause', meaning: 'the first problem that led to the failure, rather than a later effect of it' },
    ],
    planPrompt:
      'A job has an ignored lint step with errors, a failing test step, and a cleanup step that also failed. Which step do you report, and where does its cause come from when its log has no error line?',
    starter:
      'type Step = { name: string; exitCode: number; continueOnError: boolean; log: string[] }\n\nfunction failingStep(steps: Step[]): { step: string; line: number | null; cause: string } | null {\n  return null\n}\n',
    functionName: 'failingStep',
    preserveInput: true,
    hints: [
      'Find the step first; only that step’s log matters.',
      'Test each trimmed line with a pattern such as /^(error|fatal)\\b/i.',
      'Describe the exit code only when no line matched.',
    ],
    checks: [
      {
        name: 'Names the step in the example',
        input: [
          [
            { name: 'Lint', exitCode: 1, continueOnError: true, log: ['error: unused total'] },
            { name: 'Test', exitCode: 1, continueOnError: false, log: ['PASS a.test.ts', '  Error: expected 3, received 2'] },
          ],
        ],
        expected: { step: 'Test', line: 2, cause: 'Error: expected 3, received 2' },
      },
      {
        name: 'Returns null when every step passed',
        input: [
          [
            { name: 'Install', exitCode: 0, continueOnError: false, log: ['added 312 packages'] },
            { name: 'Test', exitCode: 0, continueOnError: false, log: ['Tests: 12 passed'] },
          ],
        ],
        expected: null,
      },
      {
        name: 'Returns null when only allowed failures failed',
        input: [[{ name: 'Lint', exitCode: 2, continueOnError: true, log: ['error: unused total'] }]],
        expected: null,
      },
      {
        name: 'Reports the first failing step, not a later one',
        input: [
          [
            { name: 'Build', exitCode: 2, continueOnError: false, log: ['error TS2304: Cannot find name tax'] },
            { name: 'Cleanup', exitCode: 1, continueOnError: false, log: ['fatal: no such directory'] },
          ],
        ],
        expected: { step: 'Build', line: 1, cause: 'error TS2304: Cannot find name tax' },
      },
      {
        name: 'Describes a missing command',
        input: [[{ name: 'Test', exitCode: 127, continueOnError: false, log: ['sh: 1: jest: not found'] }]],
        expected: { step: 'Test', line: null, cause: 'command not found' },
      },
      {
        name: 'Describes a stopped process',
        input: [[{ name: 'Build', exitCode: 137, continueOnError: false, log: ['Compiling 418 modules', 'Killed'] }]],
        expected: { step: 'Build', line: null, cause: 'stopped by signal 9' },
      },
      {
        name: 'Describes other exit codes',
        input: [[{ name: 'Deploy', exitCode: 2, continueOnError: false, log: ['Uploading...'] }]],
        expected: { step: 'Deploy', line: null, cause: 'exit code 2' },
      },
      {
        name: 'Treats 128 as a plain exit code',
        input: [[{ name: 'Deploy', exitCode: 128, continueOnError: false, log: [] }]],
        expected: { step: 'Deploy', line: null, cause: 'exit code 128' },
      },
      {
        name: 'Needs the whole word',
        input: [
          [{ name: 'Fetch', exitCode: 1, continueOnError: false, log: ['errors found: 0', 'Fatality count 0', 'fatal: bad object HEAD'] }],
        ],
        expected: { step: 'Fetch', line: 3, cause: 'fatal: bad object HEAD' },
      },
      {
        name: 'Trims the line it reports',
        input: [[{ name: 'Build', exitCode: 1, continueOnError: false, log: ['', '   ERROR  Build failed  '] }]],
        expected: { step: 'Build', line: 2, cause: 'ERROR  Build failed' },
      },
      {
        name: 'Prefers a log line over the exit code',
        input: [[{ name: 'Build', exitCode: 137, continueOnError: false, log: ['error: heap out of memory'] }]],
        expected: { step: 'Build', line: 1, cause: 'error: heap out of memory' },
      },
      {
        name: 'Ignores error lines in an allowed failure',
        input: [
          [
            { name: 'Lint', exitCode: 1, continueOnError: true, log: ['error: unused total'] },
            { name: 'Test', exitCode: 1, continueOnError: false, log: ['Tests: 1 failed'] },
          ],
        ],
        expected: { step: 'Test', line: null, cause: 'exit code 1' },
      },
    ],
  },
  {
    id: 'devops-read-port',
    title: 'Read a port from the environment',
    category: 'DevOps',
    format: 'devops',
    context:
      'A service reads its settings from environment variables, so the same build can run on a laptop, in CI, and in production. Every value arrives as text, and a value that is missing, mistyped, or out of range has to be handled before the service starts.',
    prompt:
      'Implement readPort(env). env maps environment variable names to text values. If PORT is missing, or empty after trimming spaces, return {ok: true, port: 3000}. Otherwise the trimmed value must be made only of the digits 0 to 9 and name a number from 1 to 65535; leading zeros are allowed. Then return {ok: true, port} with that number. Otherwise return {ok: false, error: "PORT must be a whole number from 1 to 65535"}. Variable names are case-sensitive.',
    brief: {
      summary: 'Implement readPort(env) and return {ok: true, port} or {ok: false, error}.',
      rules: [
        'A missing PORT, or one that is empty after trimming, gives {ok: true, port: 3000}.',
        'Otherwise the trimmed value must be only the digits 0 to 9 and name a number from 1 to 65535; leading zeros are allowed.',
        'A valid value gives {ok: true, port} with that number.',
        'Anything else gives {ok: false, error: "PORT must be a whole number from 1 to 65535"}.',
      ],
      edgeCases: [
        'Variable names are case-sensitive, so "port" is not PORT.',
        'A sign, a decimal point, or letters make the value invalid.',
      ],
    },
    example: { input: 'readPort({PORT: " 8080 "})', output: '{ok: true, port: 8080}' },
    note: `env is passed in, like process.env; your function never reads the real environment. Values have at most 100 characters. ${notRun}`,
    vocabulary: [
      { term: 'Environment variable', meaning: 'a named text value that the system gives a program when it starts' },
      { term: 'Default value', meaning: 'the value used when a setting is not given' },
    ],
    planPrompt:
      'Which of "8080abc", "1e3", "0080", "65536", and "  " are valid ports under this contract, and which built-in parsing would accept the wrong ones?',
    starter:
      'function readPort(env: Record<string, string>): { ok: true; port: number } | { ok: false; error: string } {\n  // Treat a missing or blank PORT as the default, then check the text before converting it.\n  return { ok: true, port: 3000 }\n}\n',
    functionName: 'readPort',
    preserveInput: true,
    hints: [
      'Check the text with a pattern such as /^[0-9]+$/ before turning it into a number.',
      'parseInt("8080abc") is 8080 and Number("1e3") is 1000, so neither alone is enough.',
      'Compare the number with both ends of the range after converting it.',
    ],
    checks: [
      { name: 'Reads the example', input: [{ PORT: ' 8080 ' }], expected: { ok: true, port: 8080 } },
      { name: 'Uses 3000 when PORT is missing', input: [{ HOST: '0.0.0.0' }], expected: { ok: true, port: 3000 } },
      { name: 'Uses 3000 when PORT is blank', input: [{ PORT: '   ' }], expected: { ok: true, port: 3000 } },
      { name: 'Accepts the highest port', input: [{ PORT: '65535' }], expected: { ok: true, port: 65535 } },
      { name: 'Accepts the lowest port', input: [{ PORT: '1' }], expected: { ok: true, port: 1 } },
      { name: 'Refuses port 0', input: [{ PORT: '0' }], expected: { ok: false, error: 'PORT must be a whole number from 1 to 65535' } },
      {
        name: 'Refuses a port above the range',
        input: [{ PORT: '65536' }],
        expected: { ok: false, error: 'PORT must be a whole number from 1 to 65535' },
      },
      {
        name: 'Refuses trailing letters',
        input: [{ PORT: '8080abc' }],
        expected: { ok: false, error: 'PORT must be a whole number from 1 to 65535' },
      },
      {
        name: 'Refuses exponent notation',
        input: [{ PORT: '1e3' }],
        expected: { ok: false, error: 'PORT must be a whole number from 1 to 65535' },
      },
      {
        name: 'Refuses a decimal point',
        input: [{ PORT: '80.5' }],
        expected: { ok: false, error: 'PORT must be a whole number from 1 to 65535' },
      },
      { name: 'Refuses a sign', input: [{ PORT: '+80' }], expected: { ok: false, error: 'PORT must be a whole number from 1 to 65535' } },
      { name: 'Allows leading zeros', input: [{ PORT: '0080' }], expected: { ok: true, port: 80 } },
      { name: 'Matches the name exactly', input: [{ port: '9000' }], expected: { ok: true, port: 3000 } },
    ],
  },
  {
    id: 'devops-validate-env',
    title: 'Check settings against a schema',
    category: 'DevOps',
    format: 'devops',
    context:
      'A service with a dozen settings should check them all when it starts and report every problem at once, instead of failing an hour later on the first request that needs a missing value. A schema lists each setting with its type, whether it is required, and its default.',
    prompt:
      'Implement validateEnv(env, schema). env maps variable names to text values. schema is a list of {name, type, required, default?}, where type is "string", "integer", or "boolean" and default, when given, is text. Go through the schema in order. Let raw be env[name] trimmed; if it is missing or empty, use default instead, and if there is no default, add the error "NAME is required" when required is true or leave the setting out when it is false. Convert raw by type: a string is the trimmed text; an integer must be an optional "-" and one or more digits, else the error is "NAME must be an integer"; a boolean is true for "true" or "1" and false for "false" or "0", compared in lower case, else the error is "NAME must be true or false". NAME is the setting\'s name. If there are errors, return {ok: false, errors} in schema order; otherwise return {ok: true, config} mapping each included name to its converted value. Ignore variables the schema does not list. Do not change the inputs.',
    brief: {
      summary: 'Implement validateEnv(env, schema) and return {ok: true, config} or {ok: false, errors}.',
      rules: [
        'Take env[name] trimmed; if it is missing or empty, use the text default. With no default, a required setting adds "NAME is required" and an optional one is left out.',
        'string: the trimmed text. integer: an optional "-" and digits, else "NAME must be an integer".',
        'boolean: "true" or "1" is true and "false" or "0" is false, in any letter case, else "NAME must be true or false".',
        'With any errors, return {ok: false, errors} in schema order; otherwise {ok: true, config}.',
      ],
      edgeCases: [
        'A default goes through the same conversion as a value.',
        'Variables the schema does not list are ignored.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'validateEnv({PORT: "8080", DEBUG: "TRUE"}, [{name: "PORT", type: "integer", required: true}, {name: "DEBUG", type: "boolean", required: false, default: "false"}, {name: "REGION", type: "string", required: false, default: "eu-west"}])',
      output: '{ok: true, config: {PORT: 8080, DEBUG: true, REGION: "eu-west"}}',
    },
    note: `env is passed in; your function never reads the real environment. Names in schema are unique; there are at most 50 settings. ${notRun}`,
    vocabulary: [
      {
        term: 'Configuration schema',
        meaning: "a list of the settings a program accepts, with each one's type, default, and whether it is required",
      },
      { term: 'Fail fast', meaning: 'stop at startup with a clear error instead of running with a bad setting' },
    ],
    planPrompt:
      'An env is missing a required setting, has "yes" for a boolean, and "12a" for an integer. What should the result list, and in what order?',
    starter:
      "type Setting = { name: string; type: 'string' | 'integer' | 'boolean'; required: boolean; default?: string }\n\nfunction validateEnv(env: Record<string, string>, schema: Setting[]) {\n  return { ok: true, config: {} as Record<string, string | number | boolean> }\n}\n",
    functionName: 'validateEnv',
    preserveInput: true,
    hints: [
      'Collect errors in a list instead of returning at the first one.',
      'Decide which text to use first (value, default, or none), then convert it by type.',
      'Lowercase the text once before comparing a boolean.',
    ],
    checks: [
      {
        name: 'Reads the example',
        input: [
          { PORT: '8080', DEBUG: 'TRUE' },
          [
            { name: 'PORT', type: 'integer', required: true },
            { name: 'DEBUG', type: 'boolean', required: false, default: 'false' },
            { name: 'REGION', type: 'string', required: false, default: 'eu-west' },
          ],
        ],
        expected: { ok: true, config: { PORT: 8080, DEBUG: true, REGION: 'eu-west' } },
      },
      {
        name: 'Reports a missing required setting',
        input: [{}, [{ name: 'DATABASE_URL', type: 'string', required: true }]],
        expected: { ok: false, errors: ['DATABASE_URL is required'] },
      },
      {
        name: 'Uses the default for a blank value',
        input: [{ WORKERS: '  ' }, [{ name: 'WORKERS', type: 'integer', required: true, default: '4' }]],
        expected: { ok: true, config: { WORKERS: 4 } },
      },
      {
        name: 'Leaves out an optional setting with no value',
        input: [{}, [{ name: 'SENTRY_DSN', type: 'string', required: false }]],
        expected: { ok: true, config: {} },
      },
      {
        name: 'Refuses an integer with letters',
        input: [{ WORKERS: '12a' }, [{ name: 'WORKERS', type: 'integer', required: true }]],
        expected: { ok: false, errors: ['WORKERS must be an integer'] },
      },
      {
        name: 'Accepts a negative integer',
        input: [{ OFFSET: '-5' }, [{ name: 'OFFSET', type: 'integer', required: true }]],
        expected: { ok: true, config: { OFFSET: -5 } },
      },
      {
        name: 'Refuses a decimal integer',
        input: [{ OFFSET: '2.5' }, [{ name: 'OFFSET', type: 'integer', required: true }]],
        expected: { ok: false, errors: ['OFFSET must be an integer'] },
      },
      {
        name: 'Reads 1 and 0 as booleans',
        input: [
          { A: '1', B: '0' },
          [
            { name: 'A', type: 'boolean', required: true },
            { name: 'B', type: 'boolean', required: true },
          ],
        ],
        expected: { ok: true, config: { A: true, B: false } },
      },
      {
        name: 'Refuses other boolean words',
        input: [{ DEBUG: 'yes' }, [{ name: 'DEBUG', type: 'boolean', required: true }]],
        expected: { ok: false, errors: ['DEBUG must be true or false'] },
      },
      {
        name: 'Reports every problem in schema order',
        input: [
          { WORKERS: 'many', DEBUG: 'maybe' },
          [
            { name: 'DATABASE_URL', type: 'string', required: true },
            { name: 'WORKERS', type: 'integer', required: true },
            { name: 'PORT', type: 'integer', required: false, default: '3000' },
            { name: 'DEBUG', type: 'boolean', required: false },
          ],
        ],
        expected: {
          ok: false,
          errors: ['DATABASE_URL is required', 'WORKERS must be an integer', 'DEBUG must be true or false'],
        },
      },
      {
        name: 'Converts a default by its type',
        input: [{}, [{ name: 'CACHE', type: 'boolean', required: false, default: 'FALSE' }]],
        expected: { ok: true, config: { CACHE: false } },
      },
      {
        name: 'Trims a string but keeps inner spaces',
        input: [{ GREETING: '  hello there  ' }, [{ name: 'GREETING', type: 'string', required: true }]],
        expected: { ok: true, config: { GREETING: 'hello there' } },
      },
      {
        name: 'Ignores variables the schema does not list',
        input: [{ PORT: '80', PATH: '/usr/bin' }, [{ name: 'PORT', type: 'integer', required: true }]],
        expected: { ok: true, config: { PORT: 80 } },
      },
    ],
  },
  {
    id: 'devops-mask-secrets',
    title: 'Mask secret values in log lines',
    category: 'DevOps',
    format: 'devops',
    context:
      'CI logs are read by many people and kept for weeks, so a password or token printed by a script must not appear in them. CI services replace the values of known secrets in every log line before storing it.',
    prompt:
      'Implement maskLog(lines, env, sensitive). sensitive lists the names of variables whose values must never appear in a log. Take the value of each sensitive name from env, skipping names that are missing and values shorter than 4 characters. In each line, replace every occurrence of each value with "***", masking longer values before shorter ones so no part of a longer value is left. Matching is exact and case-sensitive, and a value is plain text, not a pattern. Return the masked lines in order. Do not change the inputs.',
    brief: {
      summary: 'Implement maskLog(lines, env, sensitive) and return the masked lines.',
      rules: [
        "Take each sensitive name's value from env, skipping missing names and values shorter than 4 characters.",
        'Replace every occurrence of each value in each line with "***".',
        'Mask longer values before shorter ones.',
        'Match exactly and case-sensitively; a value is plain text, not a pattern.',
      ],
      edgeCases: ['Variables not listed in sensitive are never masked.', 'Do not change the inputs.'],
    },
    example: {
      input: 'maskLog(["login with s3cr3t-token"], {API_TOKEN: "s3cr3t-token", USER: "ada"}, ["API_TOKEN"])',
      output: '["login with ***"]',
    },
    note: `Very short values are skipped because masking them would hide ordinary text; a real secret that short is a problem in its own right. Masking does not undo a secret already printed elsewhere. ${notRun}`,
    vocabulary: [
      { term: 'Secret', meaning: 'a value such as a password or token that grants access and must be kept out of code and logs' },
      { term: 'Masking', meaning: 'replacing a sensitive value with a placeholder before text is shown or stored' },
    ],
    planPrompt:
      'Two secrets are "abc123" and "token-abc123". In what order must you mask them, and what leaks if you choose the other order?',
    starter:
      'function maskLog(lines: string[], env: Record<string, string>, sensitive: string[]): string[] {\n  // Find the values to hide, then replace them in every line.\n  return lines\n}\n',
    functionName: 'maskLog',
    preserveInput: true,
    hints: [
      'Build the list of values first, then sort it by length, longest first.',
      'String.prototype.replaceAll with a string replaces every occurrence without treating it as a pattern.',
      'A regular expression built from a value breaks when the value contains characters such as ".", "*", or "+".',
    ],
    checks: [
      {
        name: 'Masks the example',
        input: [['login with s3cr3t-token'], { API_TOKEN: 's3cr3t-token', USER: 'ada' }, ['API_TOKEN']],
        expected: ['login with ***'],
      },
      {
        name: 'Masks every occurrence',
        input: [['key=k-9f2a then k-9f2a again'], { KEY: 'k-9f2a' }, ['KEY']],
        expected: ['key=*** then *** again'],
      },
      {
        name: 'Masks several secrets across lines',
        input: [['user=deploy pass=hunter22', 'token: tk_live_77'], { PASSWORD: 'hunter22', TOKEN: 'tk_live_77' }, ['PASSWORD', 'TOKEN']],
        expected: ['user=deploy pass=***', 'token: ***'],
      },
      {
        name: 'Masks a longer value before a shorter one inside it',
        input: [['sent token-abc123'], { SHORT: 'abc123', LONG: 'token-abc123' }, ['SHORT', 'LONG']],
        expected: ['sent ***'],
      },
      {
        name: 'Skips values shorter than 4 characters',
        input: [['pin is 123 and code is 4567'], { PIN: '123', CODE: '4567' }, ['PIN', 'CODE']],
        expected: ['pin is 123 and code is ***'],
      },
      {
        name: 'Skips names that are not set',
        input: [['nothing to hide'], {}, ['API_TOKEN']],
        expected: ['nothing to hide'],
      },
      {
        name: 'Matches case exactly',
        input: [['Secret-Value and secret-value'], { TOKEN: 'secret-value' }, ['TOKEN']],
        expected: ['Secret-Value and ***'],
      },
      {
        name: 'Treats a value as plain text',
        input: [['pass p@ss.w*rd+ and pXssXwXrd'], { PASSWORD: 'p@ss.w*rd+' }, ['PASSWORD']],
        expected: ['pass *** and pXssXwXrd'],
      },
      {
        name: 'Leaves variables that are not sensitive',
        input: [['region eu-west-1 token abcd1234'], { REGION: 'eu-west-1', TOKEN: 'abcd1234' }, ['TOKEN']],
        expected: ['region eu-west-1 token ***'],
      },
      { name: 'Handles no lines', input: [[], { TOKEN: 'abcd1234' }, ['TOKEN']], expected: [] },
    ],
  },
  {
    id: 'devops-parse-dotenv',
    title: 'Read a .env file',
    category: 'DevOps',
    format: 'devops',
    context:
      'For local work, many projects keep settings in a .env file: one NAME=value line per variable, with comments and quotes. A loader turns the file into variables before the program starts, and should point at the lines it could not read.',
    prompt:
      'Implement parseDotenv(text). Split text into lines at "\\n". Trim each line; skip it if it is empty or starts with "#". Remove a leading "export " if present. The line must contain "="; the name is the text before the first "=", trimmed, and must start with a letter or "_" followed by letters, digits, or "_". The value is the text after the first "=", trimmed. If the value is at least 2 characters long and starts and ends with the same quote character, either " or \', remove those two quotes and keep the inside exactly. Otherwise, remove a comment that starts with " #" (a space and "#") and everything after it, then trim again. A later line for the same name replaces the earlier value. Return {values, errors}, where errors lists the line numbers, counting from 1, of lines that have no "=" or an invalid name.',
    brief: {
      summary: 'Implement parseDotenv(text) and return {values, errors}.',
      rules: [
        'Split at "\\n" and trim each line; skip empty lines and lines starting with "#"; remove a leading "export ".',
        'The name is the trimmed text before the first "=" and must match a letter or "_" followed by letters, digits, or "_"; a line with no "=" or a bad name adds its line number (from 1) to errors.',
        'The value is the trimmed text after the first "=". A value of 2 or more characters wrapped in matching " or \' quotes keeps exactly what is inside.',
        'Otherwise remove a " #" comment and everything after it, then trim. A later line for the same name wins.',
      ],
      edgeCases: ['"#" inside quotes or without a space before it is part of the value.', 'A value may contain more "=" characters.'],
    },
    example: {
      input: 'parseDotenv("# local settings\\nPORT=8080\\nGREETING=\\"hello # world\\"\\nDEBUG=true # for now")',
      output: '{values: {PORT: "8080", GREETING: "hello # world", DEBUG: "true"}, errors: []}',
    },
    note: `Real .env loaders differ on escapes and multi-line values; this rep uses only the rules above. text has at most 500 lines. ${notRun}`,
    vocabulary: [
      { term: '.env file', meaning: 'a text file of NAME=value lines that a loader turns into environment variables for local work' },
      { term: 'Inline comment', meaning: 'a note at the end of a line, after the value, that the loader ignores' },
    ],
    planPrompt: 'What do the lines KEY=a=b, URL=http://x#top, NOTE=" spaced ", and 2FAST=yes each produce?',
    starter:
      'function parseDotenv(text: string): { values: Record<string, string>; errors: number[] } {\n  // Read one line at a time.\n  return { values: {}, errors: [] }\n}\n',
    functionName: 'parseDotenv',
    preserveInput: true,
    hints: [
      'indexOf("=") finds the first "=", so the value keeps any later ones.',
      'Check for matching quotes before looking for a comment, so a "#" inside quotes survives.',
      'Count line numbers from the split lines, including skipped ones.',
    ],
    checks: [
      {
        name: 'Reads the example',
        input: ['# local settings\nPORT=8080\nGREETING="hello # world"\nDEBUG=true # for now'],
        expected: { values: { PORT: '8080', GREETING: 'hello # world', DEBUG: 'true' }, errors: [] },
      },
      { name: 'Keeps "=" inside a value', input: ['KEY=a=b'], expected: { values: { KEY: 'a=b' }, errors: [] } },
      {
        name: 'Keeps "#" without a space before it',
        input: ['URL=http://x#top'],
        expected: { values: { URL: 'http://x#top' }, errors: [] },
      },
      { name: 'Keeps spaces inside quotes', input: ['NOTE=" spaced "'], expected: { values: { NOTE: ' spaced ' }, errors: [] } },
      { name: 'Removes single quotes', input: ["NAME='Ada Lovelace'"], expected: { values: { NAME: 'Ada Lovelace' }, errors: [] } },
      { name: 'Keeps mismatched quotes', input: ['ODD="half\''], expected: { values: { ODD: '"half\'' }, errors: [] } },
      { name: 'Removes a leading export', input: ['export TOKEN=abc'], expected: { values: { TOKEN: 'abc' }, errors: [] } },
      {
        name: 'Trims around the name and value',
        input: ['  REGION =  eu-west  '],
        expected: { values: { REGION: 'eu-west' }, errors: [] },
      },
      { name: 'Lets a later line win', input: ['MODE=dev\nMODE=prod'], expected: { values: { MODE: 'prod' }, errors: [] } },
      { name: 'Allows an empty value', input: ['EMPTY='], expected: { values: { EMPTY: '' }, errors: [] } },
      { name: 'Keeps a lone quote character', input: ['Q="'], expected: { values: { Q: '"' }, errors: [] } },
      {
        name: 'Reports bad lines by number',
        input: ['GOOD=1\n\njust text\n2FAST=yes\nmy-key=x\n_OK=2'],
        expected: { values: { GOOD: '1', _OK: '2' }, errors: [3, 4, 5] },
      },
      { name: 'Handles Windows line endings', input: ['A=1\r\nB=2\r\n'], expected: { values: { A: '1', B: '2' }, errors: [] } },
    ],
  },
  {
    id: 'devops-config-drift',
    title: 'Compare settings between two environments',
    category: 'DevOps',
    format: 'devops',
    context:
      'A change works in staging but fails in production. Often the code is the same and the settings differ: a variable set in one place and forgotten in the other, or a different value. A drift report lists those differences without printing any secret.',
    prompt:
      'Implement configDrift(staging, production, sensitive). staging and production map variable names to text values, and sensitive lists names whose values must not be shown. Look at every name that appears in either map, in the default sort order. Report {name, change: "missing in production"} for a name only in staging, and {name, change: "missing in staging"} for a name only in production. A name in both whose values differ exactly gives {name, change: "different", staging, production} with both values, each shown as "***" when the name is sensitive. A name whose values are equal is not reported. An empty value still counts as present. Return the list. Do not change the inputs.',
    brief: {
      summary: 'Implement configDrift(staging, production, sensitive) and return a list of differences.',
      rules: [
        'Look at every name in either map, in the default sort order.',
        'A name only in staging gives {name, change: "missing in production"}; only in production, {name, change: "missing in staging"}.',
        'Different values give {name, change: "different", staging, production}, each value shown as "***" when the name is sensitive.',
        'Equal values are not reported.',
      ],
      edgeCases: [
        'An empty value counts as present.',
        'Values are compared exactly, including letter case and spaces.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input: 'configDrift({PORT: "8080", DB_PASSWORD: "a1"}, {PORT: "80", DB_PASSWORD: "b2", CDN: "on"}, ["DB_PASSWORD"])',
      output:
        '[{name: "CDN", change: "missing in staging"}, {name: "DB_PASSWORD", change: "different", staging: "***", production: "***"}, {name: "PORT", change: "different", staging: "8080", production: "80"}]',
    },
    note: `There are at most 200 names in each map. ${notRun}`,
    vocabulary: [
      { term: 'Configuration drift', meaning: 'settings that slowly become different between environments that should match' },
      { term: 'Staging', meaning: 'an environment set up like production, used to try a change before real users see it' },
    ],
    planPrompt:
      'Which names must you look at, and how do you keep a secret from leaking when its values differ between the two environments?',
    starter:
      'type Drift = { name: string; change: string; staging?: string; production?: string }\n\nfunction configDrift(staging: Record<string, string>, production: Record<string, string>, sensitive: string[]): Drift[] {\n  return []\n}\n',
    functionName: 'configDrift',
    preserveInput: true,
    hints: [
      'Combine the keys of both objects without repeats, then sort them.',
      'Use Object.hasOwn or the in operator to tell a missing name from an empty value.',
      'Decide what to show for each value only after you know the values differ.',
    ],
    checks: [
      {
        name: 'Reports the example',
        input: [{ PORT: '8080', DB_PASSWORD: 'a1' }, { PORT: '80', DB_PASSWORD: 'b2', CDN: 'on' }, ['DB_PASSWORD']],
        expected: [
          { name: 'CDN', change: 'missing in staging' },
          { name: 'DB_PASSWORD', change: 'different', staging: '***', production: '***' },
          { name: 'PORT', change: 'different', staging: '8080', production: '80' },
        ],
      },
      {
        name: 'Reports a name missing in production',
        input: [{ FEATURE_X: 'on', PORT: '80' }, { PORT: '80' }, []],
        expected: [{ name: 'FEATURE_X', change: 'missing in production' }],
      },
      { name: 'Leaves equal values out', input: [{ A: '1', B: '2' }, { B: '2', A: '1' }, []], expected: [] },
      {
        name: 'Counts an empty value as present',
        input: [{ PROXY: '' }, { PROXY: 'http://proxy:3128' }, []],
        expected: [{ name: 'PROXY', change: 'different', staging: '', production: 'http://proxy:3128' }],
      },
      {
        name: 'Compares values exactly',
        input: [{ MODE: 'Prod' }, { MODE: 'prod ' }, []],
        expected: [{ name: 'MODE', change: 'different', staging: 'Prod', production: 'prod ' }],
      },
      {
        name: 'Never shows a sensitive value that is missing elsewhere',
        input: [{ API_KEY: 'k-123' }, {}, ['API_KEY']],
        expected: [{ name: 'API_KEY', change: 'missing in production' }],
      },
      {
        name: 'Hides only sensitive names',
        input: [{ TOKEN: 'aaaa', REGION: 'eu' }, { TOKEN: 'bbbb', REGION: 'us' }, ['TOKEN']],
        expected: [
          { name: 'REGION', change: 'different', staging: 'eu', production: 'us' },
          { name: 'TOKEN', change: 'different', staging: '***', production: '***' },
        ],
      },
      {
        name: 'Sorts names with the default sort',
        input: [{ b: '1', B: '1', a: '1' }, {}, []],
        expected: [
          { name: 'B', change: 'missing in production' },
          { name: 'a', change: 'missing in production' },
          { name: 'b', change: 'missing in production' },
        ],
      },
      { name: 'Handles two empty maps', input: [{}, {}, []], expected: [] },
    ],
  },
]
