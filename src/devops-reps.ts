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
]
