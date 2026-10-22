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
  {
    id: 'devops-compare-versions',
    title: 'Compare two versions',
    category: 'DevOps',
    format: 'devops',
    context:
      'Release tags and package versions are written as three numbers, such as 1.10.0. Deploy scripts compare them to find the newest release, and comparing them as text gets the order wrong as soon as a part reaches two digits.',
    prompt:
      'Implement compareVersions(a, b). Each version is written MAJOR.MINOR.PATCH, three whole numbers without leading zeros, and may start with "v", as release tags often do. Compare the major numbers, then the minor numbers, then the patch numbers, as numbers. Return -1 if a is lower, 1 if a is higher, and 0 if they are equal.',
    brief: {
      summary: 'Implement compareVersions(a, b) and return -1, 0, or 1.',
      rules: [
        'Each version is MAJOR.MINOR.PATCH, three whole numbers without leading zeros, and may start with "v".',
        'Compare major, then minor, then patch, as numbers.',
        'Return -1 if a is lower, 1 if a is higher, and 0 if they are equal.',
      ],
      edgeCases: ['"v1.2.3" and "1.2.3" are equal.', 'Return exactly -1 or 1, not the difference.'],
    },
    example: { input: 'compareVersions("1.10.0", "1.9.0")', output: '1' },
    note: `Versions here have no pre-release part such as "-rc.1"; a later rep adds it. ${notRun}`,
    vocabulary: [
      {
        term: 'Semantic version',
        meaning: 'a version written MAJOR.MINOR.PATCH, where each part says what kind of change a release contains',
      },
      { term: 'Release tag', meaning: 'a name, such as v1.4.0, attached to the commit a release was built from' },
    ],
    planPrompt: 'Why does "1.10.0" < "1.9.0" come out true when compared as text? What do you compare instead, and in what order?',
    starter: 'function compareVersions(a: string, b: string): number {\n  // Split each version into three numbers first.\n  return 0\n}\n',
    functionName: 'compareVersions',
    hints: [
      'Remove a leading "v", split at ".", and turn each part into a number.',
      'Compare the parts in order and stop at the first one that differs.',
      'Return -1 or 1 from that comparison, and 0 only when all three are equal.',
    ],
    checks: [
      { name: 'Compares the example as numbers', input: ['1.10.0', '1.9.0'], expected: 1 },
      { name: 'Finds a lower patch', input: ['1.2.3', '1.2.4'], expected: -1 },
      { name: 'Lets major outweigh the rest', input: ['2.0.0', '1.99.99'], expected: 1 },
      { name: 'Lets minor outweigh patch', input: ['1.3.0', '1.2.99'], expected: 1 },
      { name: 'Reports equal versions', input: ['3.1.4', '3.1.4'], expected: 0 },
      { name: 'Ignores a leading v', input: ['v1.2.3', '1.2.3'], expected: 0 },
      { name: 'Compares two tags', input: ['v2.0.0', 'v10.0.0'], expected: -1 },
      { name: 'Returns 1, not the difference', input: ['1.2.10', '1.2.4'], expected: 1 },
      { name: 'Returns -1, not the difference', input: ['1.0.0', '4.0.0'], expected: -1 },
      { name: 'Handles zero versions', input: ['0.0.1', '0.0.0'], expected: 1 },
    ],
  },
  {
    id: 'devops-next-version',
    title: 'Choose the next version',
    category: 'DevOps',
    format: 'devops',
    context:
      'A release tool reads the changes since the last release and picks the next version, so the number tells users what to expect: a new major version may break their code, a minor one adds features, and a patch only fixes bugs.',
    prompt:
      'Implement nextVersion(current, changes). current is MAJOR.MINOR.PATCH, three whole numbers. changes lists the kinds of change since that release, each "breaking", "feature", "fix", or "docs". The largest kind decides: with a breaking change, raise major and set minor and patch to 0, except while major is 0, when you raise minor and set patch to 0 instead; otherwise, with a feature, raise minor and set patch to 0; otherwise, with a fix, raise patch. Return {version, release: true} with the new version. With only docs changes, or none, return {version: current, release: false}. Do not change the inputs.',
    brief: {
      summary: 'Implement nextVersion(current, changes) and return {version, release}.',
      rules: [
        'The largest kind of change decides: breaking, then feature, then fix.',
        'breaking: raise major and set minor and patch to 0; while major is 0, raise minor and set patch to 0 instead.',
        'feature: raise minor and set patch to 0. fix: raise patch.',
        'Return {version, release: true}, or {version: current, release: false} when there are only docs changes or none.',
      ],
      edgeCases: [
        'The order of changes does not matter.',
        'Parts are numbers, so 1.9.9 with a feature becomes 1.10.0.',
        'Do not change the inputs.',
      ],
    },
    example: { input: 'nextVersion("1.4.2", ["fix", "feature", "docs"])', output: '{version: "1.5.0", release: true}' },
    note: `The 0.x rule is a common convention for projects that are not yet stable; teams set their own. ${notRun}`,
    vocabulary: [
      { term: 'Breaking change', meaning: 'a change that makes a client written for the old version stop working' },
      { term: 'Version bump', meaning: 'raising one part of a version number for a new release' },
    ],
    planPrompt: 'What are the next versions of 1.9.9 with a feature, 0.4.1 with a breaking change, and 2.0.0 with only docs changes?',
    starter:
      "type Change = 'breaking' | 'feature' | 'fix' | 'docs'\n\nfunction nextVersion(current: string, changes: Change[]): { version: string; release: boolean } {\n  return { version: current, release: false }\n}\n",
    functionName: 'nextVersion',
    preserveInput: true,
    hints: [
      'Find the largest kind with includes, checking breaking first.',
      'Turn the parts into numbers before adding 1, or "9" + 1 becomes "91".',
      'Every part to the right of the one you raise goes back to 0.',
    ],
    checks: [
      { name: 'Picks a feature over a fix', input: ['1.4.2', ['fix', 'feature', 'docs']], expected: { version: '1.5.0', release: true } },
      { name: 'Raises patch for a fix', input: ['1.4.2', ['fix']], expected: { version: '1.4.3', release: true } },
      { name: 'Raises major for a breaking change', input: ['1.4.2', ['fix', 'breaking']], expected: { version: '2.0.0', release: true } },
      { name: 'Raises minor for a breaking change in 0.x', input: ['0.4.1', ['breaking']], expected: { version: '0.5.0', release: true } },
      { name: 'Raises minor for a feature in 0.x', input: ['0.4.1', ['feature']], expected: { version: '0.5.0', release: true } },
      { name: 'Adds as numbers', input: ['1.9.9', ['feature']], expected: { version: '1.10.0', release: true } },
      { name: 'Adds to a two-digit patch', input: ['2.3.19', ['fix']], expected: { version: '2.3.20', release: true } },
      { name: 'Makes no release for docs only', input: ['2.0.0', ['docs', 'docs']], expected: { version: '2.0.0', release: false } },
      { name: 'Makes no release for no changes', input: ['2.0.0', []], expected: { version: '2.0.0', release: false } },
      {
        name: 'Checks every change, not only the first',
        input: ['3.1.0', ['docs', 'fix', 'breaking']],
        expected: { version: '4.0.0', release: true },
      },
      { name: 'Raises a 0.0.x patch for a fix', input: ['0.0.3', ['fix']], expected: { version: '0.0.4', release: true } },
    ],
  },
  {
    id: 'devops-sort-versions',
    title: 'Sort versions with pre-releases',
    category: 'DevOps',
    format: 'devops',
    context:
      'Before a release, teams publish test versions such as 2.0.0-beta.2 and 2.0.0-rc.1. They sort before 2.0.0 itself, and their labels have their own order, so a release page has to sort versions by the semantic versioning rules rather than as text.',
    prompt:
      'Implement sortVersions(versions). Each version is MAJOR.MINOR.PATCH (whole numbers), optionally followed by "-" and a pre-release of dot-separated identifiers, and optionally by "+" and build information. Return a new array sorted from lowest to highest. Compare major, minor, and patch as numbers. If they are equal, a version with a pre-release comes before one without. Compare two pre-releases identifier by identifier, from the left: two identifiers made only of digits compare as numbers; an identifier of only digits comes before one with other characters; any other two compare with the default string order (by character code). If one pre-release runs out first with every earlier identifier equal, it comes first. Ignore build information. Versions that are still equal keep their original order. Do not change versions.',
    brief: {
      summary: 'Implement sortVersions(versions) and return a new array sorted from lowest to highest.',
      rules: [
        'Compare major, minor, and patch as numbers; with those equal, a pre-release comes before the plain version.',
        'Compare pre-releases identifier by identifier: digits-only pairs as numbers, digits-only before other identifiers, other pairs by character code.',
        'A pre-release that runs out first, with all earlier identifiers equal, comes first.',
        'Ignore build information after "+", and keep the original order for equal versions.',
      ],
      edgeCases: [
        'beta.11 comes after beta.2.',
        'Upper-case letters come before lower-case ones by character code.',
        'Do not change versions.',
      ],
    },
    example: {
      input: 'sortVersions(["1.0.0", "1.0.0-rc.1", "1.0.0-beta.11", "1.0.0-beta.2", "1.0.0-alpha", "0.9.0"])',
      output: '["0.9.0", "1.0.0-alpha", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0"]',
    },
    note: `Identifiers use letters, digits, and "-"; there are at most 200 versions. ${notRun}`,
    vocabulary: [
      { term: 'Pre-release', meaning: 'a test version, such as 2.0.0-rc.1, that comes before the release it leads to' },
      { term: 'Build metadata', meaning: 'extra information after "+" in a version, which does not change its order' },
    ],
    planPrompt: 'Order 1.0.0-alpha, 1.0.0-alpha.1, 1.0.0-1, and 1.0.0-alpha.beta, and say which rule decides each pair.',
    starter:
      'function sortVersions(versions: string[]): string[] {\n  // Write a compare function, then sort a copy.\n  return [...versions]\n}\n',
    functionName: 'sortVersions',
    preserveInput: true,
    hints: [
      'Split off build information at "+" first, then the pre-release at the first "-".',
      'Array.prototype.sort is stable, so a compare function that returns 0 keeps equal versions in order.',
      'Test /^[0-9]+$/ on each identifier to decide whether it compares as a number.',
    ],
    checks: [
      {
        name: 'Sorts the example',
        input: [['1.0.0', '1.0.0-rc.1', '1.0.0-beta.11', '1.0.0-beta.2', '1.0.0-alpha', '0.9.0']],
        expected: ['0.9.0', '1.0.0-alpha', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0'],
      },
      {
        name: 'Compares main parts as numbers',
        input: [['1.10.0', '1.9.0', '1.2.10', '1.2.9']],
        expected: ['1.2.9', '1.2.10', '1.9.0', '1.10.0'],
      },
      { name: 'Puts a shorter pre-release first', input: [['1.0.0-alpha.1', '1.0.0-alpha']], expected: ['1.0.0-alpha', '1.0.0-alpha.1'] },
      {
        name: 'Puts number identifiers before words',
        input: [['1.0.0-alpha', '1.0.0-10a', '1.0.0-2']],
        expected: ['1.0.0-2', '1.0.0-10a', '1.0.0-alpha'],
      },
      {
        name: 'Compares later identifiers when earlier ones match',
        input: [['1.0.0-alpha.beta', '1.0.0-alpha.1']],
        expected: ['1.0.0-alpha.1', '1.0.0-alpha.beta'],
      },
      { name: 'Compares words by character code', input: [['1.0.0-beta', '1.0.0-Beta']], expected: ['1.0.0-Beta', '1.0.0-beta'] },
      { name: 'Keeps hyphens inside an identifier', input: [['1.0.0-x-y', '1.0.0-x']], expected: ['1.0.0-x', '1.0.0-x-y'] },
      {
        name: 'Ignores build information',
        input: [['1.0.0+b2', '1.0.0-rc.1+b9', '1.0.0+b1']],
        expected: ['1.0.0-rc.1+b9', '1.0.0+b2', '1.0.0+b1'],
      },
      { name: 'Places a pre-release after older releases', input: [['2.0.0-rc.1', '1.9.9']], expected: ['1.9.9', '2.0.0-rc.1'] },
      { name: 'Handles an empty list', input: [[]], expected: [] },
    ],
  },
  {
    id: 'devops-lockfile-diff',
    title: 'Summarise a lockfile change',
    category: 'DevOps',
    format: 'devops',
    context:
      'A lockfile records the exact version of every package an install used, so every machine and CI run installs the same ones. When a pull request changes it, reviewers want a short summary: what was added, removed, upgraded, or downgraded, and which upgrades are major.',
    prompt:
      'Implement lockfileDiff(before, after). Each maps a package name to a version written MAJOR.MINOR.PATCH (whole numbers). Return {added, removed, upgraded, downgraded}. added lists "name@version" for packages only in after, and removed lists "name@version" for packages only in before. For a package in both whose version went up, upgraded has {name, from, to, kind}, where kind is "major" if the major number changed, else "minor" if the minor number changed, else "patch". For one whose version went down, downgraded has {name, from, to}. Compare versions as numbers, part by part. Leave out unchanged packages, and sort every list by package name with the default sort. Do not change the inputs.',
    brief: {
      summary: 'Implement lockfileDiff(before, after) and return {added, removed, upgraded, downgraded}.',
      rules: [
        'added and removed list "name@version" for packages only in after or only in before.',
        'A version that went up gives {name, from, to, kind}: "major" if major changed, else "minor" if minor changed, else "patch".',
        'A version that went down gives {name, from, to} in downgraded.',
        'Compare versions as numbers, leave out unchanged packages, and sort each list by name with the default sort.',
      ],
      edgeCases: ['Scoped names such as @types/node keep their "@" and "/".', 'Do not change the inputs.'],
    },
    example: {
      input: 'lockfileDiff({react: "18.2.0", lodash: "4.17.20"}, {react: "19.0.0", lodash: "4.17.21", zod: "3.23.8"})',
      output:
        '{added: ["zod@3.23.8"], removed: [], upgraded: [{name: "lodash", from: "4.17.20", to: "4.17.21", kind: "patch"}, {name: "react", from: "18.2.0", to: "19.0.0", kind: "major"}], downgraded: []}',
    },
    note: `Real lockfiles also record where each package came from and which packages need it; this rep compares only names and versions. There are at most 500 packages. ${notRun}`,
    vocabulary: [
      { term: 'Lockfile', meaning: 'a file that records the exact version of every installed package, so every install is the same' },
      { term: 'Package dependency', meaning: 'a package your project uses and installs' },
    ],
    planPrompt:
      'For lodash 4.9.0 → 4.10.0 and chalk 5.3.0 → 4.1.2, what goes in each list, and what would comparing the versions as text get wrong?',
    starter:
      "type Upgrade = { name: string; from: string; to: string; kind: 'major' | 'minor' | 'patch' }\n\nfunction lockfileDiff(before: Record<string, string>, after: Record<string, string>) {\n  return { added: [] as string[], removed: [] as string[], upgraded: [] as Upgrade[], downgraded: [] as { name: string; from: string; to: string }[] }\n}\n",
    functionName: 'lockfileDiff',
    preserveInput: true,
    hints: [
      "Go through the sorted union of both maps' names once, putting each package in at most one list.",
      'Write a small function that turns a version into three numbers, and use it both to compare and to find the kind.',
      'The kind is the leftmost part that differs.',
    ],
    checks: [
      {
        name: 'Summarises the example',
        input: [
          { react: '18.2.0', lodash: '4.17.20' },
          { react: '19.0.0', lodash: '4.17.21', zod: '3.23.8' },
        ],
        expected: {
          added: ['zod@3.23.8'],
          removed: [],
          upgraded: [
            { name: 'lodash', from: '4.17.20', to: '4.17.21', kind: 'patch' },
            { name: 'react', from: '18.2.0', to: '19.0.0', kind: 'major' },
          ],
          downgraded: [],
        },
      },
      {
        name: 'Compares versions as numbers',
        input: [{ lodash: '4.9.0' }, { lodash: '4.10.0' }],
        expected: { added: [], removed: [], upgraded: [{ name: 'lodash', from: '4.9.0', to: '4.10.0', kind: 'minor' }], downgraded: [] },
      },
      {
        name: 'Reports a downgrade',
        input: [{ chalk: '5.3.0' }, { chalk: '4.1.2' }],
        expected: { added: [], removed: [], upgraded: [], downgraded: [{ name: 'chalk', from: '5.3.0', to: '4.1.2' }] },
      },
      {
        name: 'Names a major change even when minor went down',
        input: [{ vite: '5.4.9' }, { vite: '6.0.1' }],
        expected: { added: [], removed: [], upgraded: [{ name: 'vite', from: '5.4.9', to: '6.0.1', kind: 'major' }], downgraded: [] },
      },
      {
        name: 'Reports a removed package',
        input: [{ moment: '2.30.1', dayjs: '1.11.13' }, { dayjs: '1.11.13' }],
        expected: { added: [], removed: ['moment@2.30.1'], upgraded: [], downgraded: [] },
      },
      {
        name: 'Keeps scoped names',
        input: [{ '@types/node': '20.11.0' }, { '@types/node': '22.7.4', '@vitejs/plugin-react': '4.3.2' }],
        expected: {
          added: ['@vitejs/plugin-react@4.3.2'],
          removed: [],
          upgraded: [{ name: '@types/node', from: '20.11.0', to: '22.7.4', kind: 'major' }],
          downgraded: [],
        },
      },
      {
        name: 'Sorts every list by name',
        input: [
          { b: '1.0.0', a: '1.0.0', d: '2.0.0', c: '2.0.0' },
          { z: '1.0.0', y: '1.0.0', d: '1.0.0', c: '1.0.0' },
        ],
        expected: {
          added: ['y@1.0.0', 'z@1.0.0'],
          removed: ['a@1.0.0', 'b@1.0.0'],
          upgraded: [],
          downgraded: [
            { name: 'c', from: '2.0.0', to: '1.0.0' },
            { name: 'd', from: '2.0.0', to: '1.0.0' },
          ],
        },
      },
      {
        name: 'Leaves unchanged packages out',
        input: [{ react: '19.0.0' }, { react: '19.0.0' }],
        expected: { added: [], removed: [], upgraded: [], downgraded: [] },
      },
      {
        name: 'Names a patch change',
        input: [{ zod: '3.23.8' }, { zod: '3.23.10' }],
        expected: { added: [], removed: [], upgraded: [{ name: 'zod', from: '3.23.8', to: '3.23.10', kind: 'patch' }], downgraded: [] },
      },
      { name: 'Handles two empty lockfiles', input: [{}, {}], expected: { added: [], removed: [], upgraded: [], downgraded: [] } },
    ],
  },
  {
    id: 'devops-satisfies-range',
    title: 'Check a version against a range',
    category: 'DevOps',
    format: 'devops',
    context:
      'A package file usually asks for a range of versions, such as ^1.2.3, rather than one exact version, so installs pick up compatible fixes. Before upgrading, a team checks whether a new version still falls inside the ranges their packages ask for.',
    prompt:
      'Implement satisfies(version, range). version is MAJOR.MINOR.PATCH (whole numbers). range is one of four forms, each with a MAJOR.MINOR.PATCH base: "1.2.3" allows exactly that version; ">=1.2.3" allows that version or any higher one; "~1.2.3" allows versions from the base up to, but not including, the next minor version (1.3.0); and "^1.2.3" allows versions from the base up to, but not including, the next version that raises the first part of the base that is not 0, so ^1.2.3 stops before 2.0.0, ^0.2.3 before 0.3.0, and ^0.0.3 before 0.0.4. Compare versions as numbers, part by part. Return true or false.',
    brief: {
      summary: 'Implement satisfies(version, range) and return true or false.',
      rules: [
        '"1.2.3" allows exactly that version; ">=1.2.3" allows it or any higher one.',
        '"~1.2.3" allows the base up to, but not including, 1.3.0.',
        'The first part of the base that is not 0 may not rise: "^1.2.3" stops before 2.0.0, "^0.2.3" before 0.3.0, and "^0.0.3" before 0.0.4.',
        'Compare versions as numbers, part by part.',
      ],
      edgeCases: ['The base itself is always allowed.', 'The upper limit itself is never allowed.'],
    },
    example: { input: 'satisfies("1.10.0", "^1.9.0")', output: 'true' },
    note: `Versions and bases have no pre-release part, and real package managers accept many more range forms. ${notRun}`,
    vocabulary: [
      { term: 'Version range', meaning: 'a rule, such as ^1.2.3, that says which versions of a package are acceptable' },
      { term: 'Caret range', meaning: 'a range written with ^ that allows changes that should not break the base version' },
    ],
    planPrompt: 'Write the lowest and the first excluded version for ^1.2.3, ^0.2.3, ^0.0.3, and ~1.2.3, then check 1.10.0 against ^1.9.0.',
    starter: 'function satisfies(version: string, range: string): boolean {\n  return false\n}\n',
    functionName: 'satisfies',
    hints: [
      'Read the operator from the start of the range, then parse the base like any version.',
      'Turn each range into a lowest allowed version and, except for >=, a first version that is not allowed.',
      'A comparison that returns -1, 0, or 1 for two versions makes both bounds easy to test.',
    ],
    checks: [
      { name: 'Compares the example as numbers', input: ['1.10.0', '^1.9.0'], expected: true },
      { name: 'Allows the base of a caret range', input: ['1.2.3', '^1.2.3'], expected: true },
      { name: 'Refuses the next major in a caret range', input: ['2.0.0', '^1.2.3'], expected: false },
      { name: 'Refuses a version below the base', input: ['1.2.2', '^1.2.3'], expected: false },
      { name: 'Stops a 0.x caret range at the next minor', input: ['0.3.0', '^0.2.3'], expected: false },
      { name: 'Allows a patch in a 0.x caret range', input: ['0.2.9', '^0.2.3'], expected: true },
      { name: 'Stops a 0.0.x caret range at the next patch', input: ['0.0.4', '^0.0.3'], expected: false },
      { name: 'Allows the base of a 0.0.x caret range', input: ['0.0.3', '^0.0.3'], expected: true },
      { name: 'Allows patches in a tilde range', input: ['1.2.10', '~1.2.9'], expected: true },
      { name: 'Refuses the next minor in a tilde range', input: ['1.3.0', '~1.2.3'], expected: false },
      { name: 'Keeps a tilde range on 0.x to its minor', input: ['0.2.7', '~0.2.3'], expected: true },
      { name: 'Matches an exact version only', input: ['1.2.4', '1.2.3'], expected: false },
      { name: 'Accepts the exact version', input: ['1.2.3', '1.2.3'], expected: true },
      { name: 'Has no upper limit for >=', input: ['12.0.0', '>=1.2.3'], expected: true },
      { name: 'Refuses a lower version for >=', input: ['1.2.2', '>=1.2.3'], expected: false },
    ],
  },
  {
    id: 'devops-job-waves',
    title: 'Order jobs by what they need',
    category: 'DevOps',
    format: 'devops',
    context:
      'A CI pipeline lists jobs, and each job can name the jobs it needs to finish first. Jobs with nothing left to wait for run side by side, in waves. Before running anything, the pipeline has to check that every needed job exists and that no jobs wait on each other in a loop.',
    prompt:
      'Implement jobWaves(jobs). jobs lists {name, needs} in file order; names are unique and needs is a list of job names. First, if any job needs a name that is not a job, return {ok: false, error: "UNKNOWN_NEED", job, need} for the first such job in file order and the first unknown name in its needs. Otherwise, the first wave is every job with no needs, and each later wave is every job not yet placed whose needs are all in earlier waves. Keep file order within a wave. If some jobs can never be placed, return {ok: false, error: "CYCLE", jobs} with their names in file order. Otherwise return {ok: true, waves}, a list of waves, each a list of names. Do not change jobs.',
    brief: {
      summary: 'Implement jobWaves(jobs) and return {ok: true, waves} or {ok: false, error, ...}.',
      rules: [
        'A need that names no job gives {ok: false, error: "UNKNOWN_NEED", job, need}: the first such job in file order and its first unknown need.',
        'The first wave is every job with no needs; each later wave is every unplaced job whose needs are all in earlier waves.',
        'Keep file order within a wave.',
        'Jobs that can never be placed give {ok: false, error: "CYCLE", jobs} in file order.',
      ],
      edgeCases: [
        'A job is never placed in the same wave as a job it needs.',
        'A job that needs a job in a loop can never run either.',
        'Do not change jobs.',
      ],
    },
    example: {
      input:
        'jobWaves([{name: "lint", needs: []}, {name: "build", needs: []}, {name: "test", needs: ["build"]}, {name: "deploy", needs: ["lint", "test"]}])',
      output: '{ok: true, waves: [["lint", "build"], ["test"], ["deploy"]]}',
    },
    note: `There are at most 100 jobs. Real CI services also limit how many jobs run at once; this rep only orders them. ${notRun}`,
    vocabulary: [
      { term: 'CI pipeline', meaning: 'the set of jobs CI runs for one change, with the order between them' },
      { term: 'Dependency cycle', meaning: 'jobs that wait on each other in a loop, so none of them can start' },
    ],
    planPrompt: 'With jobs a needs b, b needs c, and c needs nothing, what are the waves? What changes if c also needs a?',
    starter:
      'type Job = { name: string; needs: string[] }\n\nfunction jobWaves(jobs: Job[]) {\n  // Check every need first, then place jobs one wave at a time.\n  return { ok: true, waves: [] as string[][] }\n}\n',
    functionName: 'jobWaves',
    preserveInput: true,
    hints: [
      'Keep a Set of placed names; a job is ready when every one of its needs is in that set.',
      'Find a whole wave before adding any of it to the set, so a job never joins the wave of a job it needs.',
      'If a round finds no ready job but some jobs are left, those jobs can never be placed.',
    ],
    checks: [
      {
        name: 'Orders the example',
        input: [
          [
            { name: 'lint', needs: [] },
            { name: 'build', needs: [] },
            { name: 'test', needs: ['build'] },
            { name: 'deploy', needs: ['lint', 'test'] },
          ],
        ],
        expected: { ok: true, waves: [['lint', 'build'], ['test'], ['deploy']] },
      },
      {
        name: 'Gives a chain one wave per job',
        input: [
          [
            { name: 'a', needs: ['b'] },
            { name: 'b', needs: ['c'] },
            { name: 'c', needs: [] },
          ],
        ],
        expected: { ok: true, waves: [['c'], ['b'], ['a']] },
      },
      {
        name: 'Keeps file order within a wave',
        input: [
          [
            { name: 'setup', needs: [] },
            { name: 'unit', needs: ['setup'] },
            { name: 'e2e', needs: ['setup'] },
            { name: 'docs', needs: ['setup'] },
          ],
        ],
        expected: { ok: true, waves: [['setup'], ['unit', 'e2e', 'docs']] },
      },
      {
        name: 'Waits for the slower branch of a diamond',
        input: [
          [
            { name: 'build', needs: [] },
            { name: 'test', needs: ['build'] },
            { name: 'scan', needs: ['build', 'test'] },
            { name: 'release', needs: ['test', 'scan'] },
          ],
        ],
        expected: { ok: true, waves: [['build'], ['test'], ['scan'], ['release']] },
      },
      {
        name: 'Reports a loop between two jobs',
        input: [
          [
            { name: 'build', needs: [] },
            { name: 'a', needs: ['b'] },
            { name: 'b', needs: ['a'] },
          ],
        ],
        expected: { ok: false, error: 'CYCLE', jobs: ['a', 'b'] },
      },
      {
        name: 'Reports a job that needs itself',
        input: [[{ name: 'x', needs: ['x'] }]],
        expected: { ok: false, error: 'CYCLE', jobs: ['x'] },
      },
      {
        name: 'Includes jobs that wait on a loop',
        input: [
          [
            { name: 'deploy', needs: ['a'] },
            { name: 'a', needs: ['b'] },
            { name: 'b', needs: ['a'] },
            { name: 'lint', needs: [] },
          ],
        ],
        expected: { ok: false, error: 'CYCLE', jobs: ['deploy', 'a', 'b'] },
      },
      {
        name: 'Reports the first unknown need',
        input: [
          [
            { name: 'build', needs: [] },
            { name: 'test', needs: ['build', 'biuld', 'setup'] },
            { name: 'deploy', needs: ['tests'] },
          ],
        ],
        expected: { ok: false, error: 'UNKNOWN_NEED', job: 'test', need: 'biuld' },
      },
      {
        name: 'Checks needs before loops',
        input: [
          [
            { name: 'a', needs: ['b'] },
            { name: 'b', needs: ['a', 'c'] },
          ],
        ],
        expected: { ok: false, error: 'UNKNOWN_NEED', job: 'b', need: 'c' },
      },
      { name: 'Handles no jobs', input: [[]], expected: { ok: true, waves: [] } },
    ],
  },
  {
    id: 'devops-cache-key',
    title: 'Build a cache key from inputs',
    category: 'DevOps',
    format: 'devops',
    context:
      'Installing packages is one of the slowest steps in CI, so pipelines save the installed folder in a cache and restore it next time. The cache is only safe to reuse when the files that decide its contents, such as the lockfile, are unchanged, so its key is built from those files.',
    prompt:
      'Implement cacheKey(job, os, keyFiles, files). files maps paths to their text content. Take the paths in keyFiles without repeats, sorted with the default sort. Build one text by adding, for each path, the path, "\\n", the file\'s content (or "<missing>" if files has no such path), and "\\n". Hash that text with 32-bit FNV-1a: start with hash = 2166136261; for each UTF-16 code unit c of the text (charCodeAt), set hash to hash XOR c, then multiply it by 16777619 keeping only the low 32 bits (Math.imul(hash, 16777619) >>> 0). Write the hash as 8 lowercase hexadecimal digits, padded with leading zeros. Return job + "-" + os + "-" + that hash. Do not change the inputs.',
    brief: {
      summary: 'Implement cacheKey(job, os, keyFiles, files) and return job-os-hash.',
      rules: [
        'Take keyFiles without repeats, sorted with the default sort.',
        'For each path add path, "\\n", its content (or "<missing>"), and "\\n" to one text.',
        'Hash it with 32-bit FNV-1a: hash = 2166136261, then for each code unit c: hash = Math.imul(hash ^ c, 16777619) >>> 0.',
        'Return job + "-" + os + "-" + the hash as 8 lowercase hexadecimal digits, padded with leading zeros.',
      ],
      edgeCases: [
        'A missing file and an empty file give different keys.',
        'Files that are not key files never change the key.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'cacheKey("deps", "linux", ["package-lock.json", ".nvmrc"], {"package-lock.json": "{\\"lockfileVersion\\":3}", ".nvmrc": "24", "src/app.ts": "export {}"})',
      output: '"deps-linux-5a74218d"',
    },
    note: `FNV-1a is a fast, simple hash, chosen here because it is easy to write and check; CI services use stronger hashes such as SHA-256 for cache keys. Contents are ASCII text, at most 10,000 characters each. ${notRun}`,
    vocabulary: [
      {
        term: 'Cache key',
        meaning: 'a name built from the inputs of a step, so a saved result is reused only when the inputs are the same',
      },
      { term: 'Hash', meaning: 'a short fixed-size value computed from data, which changes when the data changes' },
    ],
    planPrompt: 'Which changes must give a new key, which must not, and why does sorting keyFiles matter?',
    starter:
      "function cacheKey(job: string, os: string, keyFiles: string[], files: Record<string, string>): string {\n  // Build the text from the key files, then hash it.\n  return job + '-' + os\n}\n",
    functionName: 'cacheKey',
    preserveInput: true,
    hints: [
      'new Set removes repeats, and [...set].sort() orders the paths.',
      'Use Object.hasOwn(files, path) so an empty file is not treated as missing.',
      'toString(16) gives hexadecimal, and padStart(8, "0") adds the leading zeros.',
    ],
    checks: [
      {
        name: 'Builds the example key',
        input: [
          'deps',
          'linux',
          ['package-lock.json', '.nvmrc'],
          { 'package-lock.json': '{"lockfileVersion":3}', '.nvmrc': '24', 'src/app.ts': 'export {}' },
        ],
        expected: 'deps-linux-5a74218d',
      },
      {
        name: 'Ignores the order and repeats of key files',
        input: [
          'deps',
          'linux',
          ['.nvmrc', 'package-lock.json', '.nvmrc'],
          { 'package-lock.json': '{"lockfileVersion":3}', '.nvmrc': '24', 'src/app.ts': 'export {}' },
        ],
        expected: 'deps-linux-5a74218d',
      },
      {
        name: 'Ignores changes to other files',
        input: [
          'deps',
          'linux',
          ['package-lock.json', '.nvmrc'],
          { 'package-lock.json': '{"lockfileVersion":3}', '.nvmrc': '24', 'src/app.ts': 'changed' },
        ],
        expected: 'deps-linux-5a74218d',
      },
      {
        name: 'Changes when a key file changes',
        input: [
          'deps',
          'linux',
          ['package-lock.json', '.nvmrc'],
          { 'package-lock.json': '{"lockfileVersion":3}', '.nvmrc': '22', 'src/app.ts': 'export {}' },
        ],
        expected: 'deps-linux-eb6ffa47',
      },
      {
        name: 'Puts the operating system in the key',
        input: ['deps', 'macos', ['package-lock.json', '.nvmrc'], { 'package-lock.json': '{"lockfileVersion":3}', '.nvmrc': '24' }],
        expected: 'deps-macos-5a74218d',
      },
      { name: 'Marks a missing file', input: ['deps', 'linux', ['yarn.lock'], {}], expected: 'deps-linux-f1e81e5a' },
      {
        name: 'Tells an empty file from a missing one',
        input: ['deps', 'linux', ['yarn.lock'], { 'yarn.lock': '' }],
        expected: 'deps-linux-b9fce2f4',
      },
      {
        name: 'Includes the path in the hash',
        input: ['build', 'linux', ['b.txt'], { 'a.txt': 'same', 'b.txt': 'same' }],
        expected: 'build-linux-8f338b2d',
      },
      {
        name: 'Pads the hash with leading zeros',
        input: ['lint', 'linux', ['.eslintrc'], { '.eslintrc': 'v8' }],
        expected: 'lint-linux-04961fcd',
      },
      { name: 'Hashes an empty text for no key files', input: ['build', 'linux', [], {}], expected: 'build-linux-811c9dc5' },
    ],
  },
  {
    id: 'devops-cache-restore',
    title: 'Pick the cache to restore',
    category: 'DevOps',
    format: 'devops',
    context:
      "When no cache matches a job's exact key, an older cache for the same job is often still useful: restoring it and installing only what changed is faster than starting empty. Pipelines list fallback prefixes, from most to least specific, to find one.",
    prompt:
      'Implement restoreCache(key, restoreKeys, caches). caches lists saved caches as {key, createdAt}, where createdAt is a whole number of seconds. If a cache\'s key equals key exactly, return {hit: "exact", key}. Otherwise go through restoreKeys in order; for the first prefix that at least one cache key starts with, return {hit: "partial", key} for the newest of those caches (the largest createdAt, and the earlier one in caches on a tie). If no prefix matches, return {hit: "miss", key: null}. Do not change the inputs.',
    brief: {
      summary: 'Implement restoreCache(key, restoreKeys, caches) and return {hit, key}.',
      rules: [
        'An exact key match gives {hit: "exact", key}.',
        'Otherwise use the first prefix in restoreKeys that some cache key starts with.',
        'Return {hit: "partial", key} for the newest such cache, the earlier one in caches on a tie.',
        'With no match, return {hit: "miss", key: null}.',
      ],
      edgeCases: [
        'An exact match wins even when a newer partial match exists.',
        'A later prefix is used only when every earlier prefix matches nothing.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'restoreCache("deps-linux-9a1", ["deps-linux-", "deps-"], [{key: "deps-linux-5f2", createdAt: 100}, {key: "deps-linux-77c", createdAt: 250}, {key: "deps-macos-77c", createdAt: 300}])',
      output: '{hit: "partial", key: "deps-linux-77c"}',
    },
    note: `Prefixes are not empty; there are at most 200 caches. Real CI services also limit caches by branch and size. ${notRun}`,
    vocabulary: [
      { term: 'Restore key', meaning: 'a key prefix used to find an older, similar cache when the exact one is missing' },
      { term: 'Cache hit', meaning: 'finding a saved result that can be reused instead of doing the work again' },
    ],
    planPrompt:
      'With an exact match from yesterday and a partial match from today, which do you restore? Which prefix wins when both prefixes match?',
    starter:
      "type SavedCache = { key: string; createdAt: number }\n\nfunction restoreCache(key: string, restoreKeys: string[], caches: SavedCache[]): { hit: 'exact' | 'partial' | 'miss'; key: string | null } {\n  return { hit: 'miss', key: null }\n}\n",
    functionName: 'restoreCache',
    preserveInput: true,
    hints: [
      'Check for an exact key before looking at any prefix.',
      'For each prefix, filter the caches whose key startsWith it, and stop at the first prefix with a match.',
      'Keep the newest by comparing createdAt with >, so an equal later cache does not replace the earlier one.',
    ],
    checks: [
      {
        name: 'Restores the newest partial match in the example',
        input: [
          'deps-linux-9a1',
          ['deps-linux-', 'deps-'],
          [
            { key: 'deps-linux-5f2', createdAt: 100 },
            { key: 'deps-linux-77c', createdAt: 250 },
            { key: 'deps-macos-77c', createdAt: 300 },
          ],
        ],
        expected: { hit: 'partial', key: 'deps-linux-77c' },
      },
      {
        name: 'Prefers an exact match',
        input: [
          'deps-linux-9a1',
          ['deps-linux-'],
          [
            { key: 'deps-linux-9a1', createdAt: 10 },
            { key: 'deps-linux-77c', createdAt: 900 },
          ],
        ],
        expected: { hit: 'exact', key: 'deps-linux-9a1' },
      },
      {
        name: 'Uses the first prefix that matches',
        input: [
          'deps-linux-9a1',
          ['deps-linux-', 'deps-'],
          [
            { key: 'deps-linux-5f2', createdAt: 100 },
            { key: 'deps-macos-77c', createdAt: 900 },
          ],
        ],
        expected: { hit: 'partial', key: 'deps-linux-5f2' },
      },
      {
        name: 'Falls back to a later prefix',
        input: ['deps-linux-9a1', ['deps-linux-', 'deps-'], [{ key: 'deps-macos-77c', createdAt: 900 }]],
        expected: { hit: 'partial', key: 'deps-macos-77c' },
      },
      {
        name: 'Keeps the earlier cache on a tie',
        input: [
          'deps-linux-9a1',
          ['deps-linux-'],
          [
            { key: 'deps-linux-aaa', createdAt: 500 },
            { key: 'deps-linux-bbb', createdAt: 500 },
          ],
        ],
        expected: { hit: 'partial', key: 'deps-linux-aaa' },
      },
      {
        name: 'Matches prefixes from the start only',
        input: ['deps-linux-9a1', ['linux-'], [{ key: 'deps-linux-77c', createdAt: 900 }]],
        expected: { hit: 'miss', key: null },
      },
      {
        name: 'Misses with no fallback prefixes',
        input: ['deps-linux-9a1', [], [{ key: 'deps-linux-77c', createdAt: 900 }]],
        expected: { hit: 'miss', key: null },
      },
      { name: 'Misses with no caches', input: ['deps-linux-9a1', ['deps-'], []], expected: { hit: 'miss', key: null } },
    ],
  },
  {
    id: 'devops-pipeline-duration',
    title: 'Find how long a pipeline takes',
    category: 'DevOps',
    format: 'devops',
    context:
      'A pipeline with parallel jobs finishes when its slowest chain of jobs finishes. Making a job on that chain faster shortens the whole pipeline; making any other job faster changes nothing. That chain is the critical path.',
    prompt:
      'Implement pipelineTimes(jobs). Each job is {name, minutes, needs}; jobs may be listed in any order, every need names a job, and there are no loops. A job starts when the last job it needs finishes, or at 0 if it needs nothing, and finishes minutes later. Return {finish, total, criticalPath}: finish maps each name to its finish time, total is the largest finish time (0 with no jobs), and criticalPath is built backwards: start from the job with the largest finish (the first in jobs on a tie), then repeatedly move to the job it needs with the largest finish (the first in its needs on a tie), until a job needs nothing; return those names from first to last. Do not change jobs.',
    brief: {
      summary: 'Implement pipelineTimes(jobs) and return {finish, total, criticalPath}.',
      rules: [
        'A job starts when the last job it needs finishes (0 with no needs) and finishes minutes later; jobs may be listed in any order.',
        'total is the largest finish time, or 0 with no jobs.',
        'Build criticalPath backwards from the job with the largest finish (first in jobs on a tie), moving each time to the needed job with the largest finish (first in needs on a tie).',
        'Return criticalPath from first job to last.',
      ],
      edgeCases: ['A job listed before the jobs it needs still waits for them.', 'Do not change jobs.'],
    },
    example: {
      input:
        'pipelineTimes([{name: "deploy", minutes: 2, needs: ["test", "lint"]}, {name: "build", minutes: 5, needs: []}, {name: "test", minutes: 8, needs: ["build"]}, {name: "lint", minutes: 3, needs: []}])',
      output: '{finish: {deploy: 15, build: 5, test: 13, lint: 3}, total: 15, criticalPath: ["build", "test", "deploy"]}',
    },
    note: `minutes are whole numbers of at least 1; there are at most 100 jobs. The times are planned durations passed in, not measured runs. ${notRun}`,
    vocabulary: [
      {
        term: 'Critical path',
        meaning: 'the longest chain of jobs that wait for each other, which sets how long the whole pipeline takes',
      },
      { term: 'Parallel jobs', meaning: 'jobs that run at the same time because neither needs the other' },
    ],
    planPrompt:
      "In the example, which job could you make faster to shorten the pipeline, and which would change nothing? How do you find a job's finish time when its needs are listed after it?",
    starter:
      'type Job = { name: string; minutes: number; needs: string[] }\n\nfunction pipelineTimes(jobs: Job[]) {\n  return { finish: {} as Record<string, number>, total: 0, criticalPath: [] as string[] }\n}\n',
    functionName: 'pipelineTimes',
    preserveInput: true,
    hints: [
      "A job's finish time depends only on its needs, so a function that works it out and remembers the answer handles any order.",
      'Its start time is the largest finish among its needs, or 0.',
      'Walk the critical path backwards first, then reverse it.',
    ],
    checks: [
      {
        name: 'Times the example',
        input: [
          [
            { name: 'deploy', minutes: 2, needs: ['test', 'lint'] },
            { name: 'build', minutes: 5, needs: [] },
            { name: 'test', minutes: 8, needs: ['build'] },
            { name: 'lint', minutes: 3, needs: [] },
          ],
        ],
        expected: { finish: { deploy: 15, build: 5, test: 13, lint: 3 }, total: 15, criticalPath: ['build', 'test', 'deploy'] },
      },
      {
        name: 'Waits for the slowest need',
        input: [
          [
            { name: 'a', minutes: 4, needs: [] },
            { name: 'b', minutes: 9, needs: [] },
            { name: 'c', minutes: 1, needs: ['a', 'b'] },
          ],
        ],
        expected: { finish: { a: 4, b: 9, c: 10 }, total: 10, criticalPath: ['b', 'c'] },
      },
      {
        name: 'Ends at the job that finishes last',
        input: [
          [
            { name: 'build', minutes: 5, needs: [] },
            { name: 'docs', minutes: 20, needs: [] },
            { name: 'test', minutes: 3, needs: ['build'] },
          ],
        ],
        expected: { finish: { build: 5, docs: 20, test: 8 }, total: 20, criticalPath: ['docs'] },
      },
      {
        name: 'Breaks a tie between last jobs by list order',
        input: [
          [
            { name: 'x', minutes: 6, needs: [] },
            { name: 'y', minutes: 6, needs: [] },
          ],
        ],
        expected: { finish: { x: 6, y: 6 }, total: 6, criticalPath: ['x'] },
      },
      {
        name: 'Breaks a tie between needs by needs order',
        input: [
          [
            { name: 'p', minutes: 2, needs: [] },
            { name: 'q', minutes: 2, needs: [] },
            { name: 'r', minutes: 1, needs: ['q', 'p'] },
          ],
        ],
        expected: { finish: { p: 2, q: 2, r: 3 }, total: 3, criticalPath: ['q', 'r'] },
      },
      {
        name: 'Follows a long chain listed backwards',
        input: [
          [
            { name: 'd', minutes: 1, needs: ['c'] },
            { name: 'c', minutes: 1, needs: ['b'] },
            { name: 'b', minutes: 1, needs: ['a'] },
            { name: 'a', minutes: 1, needs: [] },
          ],
        ],
        expected: { finish: { d: 4, c: 3, b: 2, a: 1 }, total: 4, criticalPath: ['a', 'b', 'c', 'd'] },
      },
      { name: 'Handles no jobs', input: [[]], expected: { finish: {}, total: 0, criticalPath: [] } },
    ],
  },
  {
    id: 'devops-skip-unchanged',
    title: 'Skip jobs whose inputs did not change',
    category: 'DevOps',
    format: 'devops',
    context:
      "In a repository with several parts, a change to the docs should not rebuild and redeploy the API. Each job names the paths it reads, and a job whose inputs did not change can be skipped. But a job that needs another job's output must run again whenever that job runs, even if its own files are untouched.",
    prompt:
      'Implement jobsToRun(jobs, changed). jobs lists {name, needs, paths} in any order; every need names a job and there are no loops. changed lists the paths of changed files. A path in a job\'s paths that ends with "/" matches every changed file whose path starts with it; any other path matches only that exact file. A job runs if a changed file matches one of its paths, or if any job it needs runs. Return {run, skip}, each a list of job names in the order of jobs. Do not change the inputs.',
    brief: {
      summary: 'Implement jobsToRun(jobs, changed) and return {run, skip}.',
      rules: [
        'A path ending with "/" matches every changed file that starts with it; any other path matches only that exact file.',
        'A job runs if a changed file matches one of its paths, or if any job it needs runs.',
        'Jobs may be listed in any order; there are no loops.',
        'Return {run, skip}, each in the order of jobs.',
      ],
      edgeCases: ['"api/" matches "api/server.ts" but not "api-docs/index.md".', 'Do not change the inputs.'],
    },
    example: {
      input:
        'jobsToRun([{name: "deploy-api", needs: ["test-api"], paths: ["deploy/"]}, {name: "test-api", needs: [], paths: ["api/", "package-lock.json"]}, {name: "docs", needs: [], paths: ["docs/"]}], ["api/server.ts"])',
      output: '{run: ["deploy-api", "test-api"], skip: ["docs"]}',
    },
    note: `Paths use "/" and are compared exactly, including letter case. There are at most 100 jobs and 1,000 changed files. ${notRun}`,
    vocabulary: [
      { term: 'Path filter', meaning: 'a list of files or folders a job reads, used to decide whether a change affects it' },
      { term: 'Monorepo', meaning: 'one repository that holds several projects or services' },
    ],
    planPrompt: 'Only api/server.ts changed. Which jobs run, and why does a job with no changed files of its own sometimes still run?',
    starter:
      'type Job = { name: string; needs: string[]; paths: string[] }\n\nfunction jobsToRun(jobs: Job[], changed: string[]): { run: string[]; skip: string[] } {\n  return { run: [], skip: jobs.map(job => job.name) }\n}\n',
    functionName: 'jobsToRun',
    preserveInput: true,
    hints: [
      'Write the match rule for one path and one changed file first.',
      'Whether a job runs depends on the jobs it needs, so decide those first, remembering each answer.',
      'Build both lists in one pass over jobs once every decision is made.',
    ],
    checks: [
      {
        name: 'Runs the example',
        input: [
          [
            { name: 'deploy-api', needs: ['test-api'], paths: ['deploy/'] },
            { name: 'test-api', needs: [], paths: ['api/', 'package-lock.json'] },
            { name: 'docs', needs: [], paths: ['docs/'] },
          ],
          ['api/server.ts'],
        ],
        expected: { run: ['deploy-api', 'test-api'], skip: ['docs'] },
      },
      {
        name: 'Skips everything a docs change does not touch',
        input: [
          [
            { name: 'test-api', needs: [], paths: ['api/'] },
            { name: 'deploy-api', needs: ['test-api'], paths: ['deploy/'] },
            { name: 'docs', needs: [], paths: ['docs/'] },
          ],
          ['docs/setup.md'],
        ],
        expected: { run: ['docs'], skip: ['test-api', 'deploy-api'] },
      },
      {
        name: 'Matches a folder only at the start',
        input: [[{ name: 'api', needs: [], paths: ['api/'] }], ['src/api/index.ts', 'api-docs/index.md']],
        expected: { run: [], skip: ['api'] },
      },
      {
        name: 'Matches a file path exactly',
        input: [[{ name: 'deps', needs: [], paths: ['package-lock.json'] }], ['web/package-lock.json', 'package-lock.json.orig']],
        expected: { run: [], skip: ['deps'] },
      },
      {
        name: 'Runs a job for its own changed file',
        input: [
          [
            { name: 'build', needs: [], paths: ['src/'] },
            { name: 'deploy', needs: ['build'], paths: ['deploy/config.yml'] },
          ],
          ['deploy/config.yml'],
        ],
        expected: { run: ['deploy'], skip: ['build'] },
      },
      {
        name: 'Passes a run through a chain listed backwards',
        input: [
          [
            { name: 'release', needs: ['package'], paths: ['release/'] },
            { name: 'package', needs: ['build'], paths: ['package/'] },
            { name: 'build', needs: [], paths: ['src/'] },
          ],
          ['src/main.ts'],
        ],
        expected: { run: ['release', 'package', 'build'], skip: [] },
      },
      {
        name: 'Runs a job when any one of its needs runs',
        input: [
          [
            { name: 'web', needs: [], paths: ['web/'] },
            { name: 'api', needs: [], paths: ['api/'] },
            { name: 'e2e', needs: ['web', 'api'], paths: ['e2e/'] },
          ],
          ['api/routes.ts'],
        ],
        expected: { run: ['api', 'e2e'], skip: ['web'] },
      },
      {
        name: 'Compares letter case exactly',
        input: [[{ name: 'docs', needs: [], paths: ['docs/'] }], ['Docs/intro.md']],
        expected: { run: [], skip: ['docs'] },
      },
      {
        name: 'Skips every job when nothing changed',
        input: [[{ name: 'build', needs: [], paths: ['src/'] }], []],
        expected: { run: [], skip: ['build'] },
      },
    ],
  },
  {
    id: 'devops-layer-rebuild',
    title: 'Predict which image layers rebuild',
    category: 'DevOps',
    format: 'devops',
    context:
      'A container image is built from a list of steps, and each step saves its result as a layer. On the next build, a step whose inputs are unchanged reuses its saved layer. Once one step has to run again, every step after it runs again too, because it was built on top of the old result.',
    prompt:
      'Implement layerRebuilds(steps, changed). steps lists the build steps in order as {instruction, copies}, where copies lists the sources a step copies from the build folder (empty for steps that copy nothing). changed lists the paths of files that changed since the last build; the step list itself is unchanged. Go through the steps in order. A step is "rebuilt" if an earlier step was rebuilt, or if one of its sources matches a changed file: the source "." matches every file, a source ending with "/" matches every file whose path starts with it, and any other source matches only the file with exactly that path. Otherwise it is "cached". Return one status per step, in order. Do not change the inputs.',
    brief: {
      summary: 'Implement layerRebuilds(steps, changed) and return "rebuilt" or "cached" for each step.',
      rules: [
        'A step is "rebuilt" if an earlier step was rebuilt, or if one of its copies matches a changed file; otherwise it is "cached".',
        '"." matches every file; a source ending with "/" matches files whose path starts with it; any other source matches only that exact path.',
        'The step list itself is unchanged, so a step that copies nothing rebuilds only after an earlier rebuild.',
      ],
      edgeCases: ['"src/" matches "src/app.ts" but not "tests/src/a.ts".', 'Do not change the inputs.'],
    },
    example: {
      input:
        'layerRebuilds([{instruction: "FROM node:24", copies: []}, {instruction: "COPY package.json package-lock.json ./", copies: ["package.json", "package-lock.json"]}, {instruction: "RUN npm ci", copies: []}, {instruction: "COPY src/ ./src/", copies: ["src/"]}, {instruction: "RUN npm run build", copies: []}], ["src/app.ts"])',
      output: '["cached", "cached", "cached", "rebuilt", "rebuilt"]',
    },
    note: `Real image builders also rebuild a step when its instruction text or its base image changes, and they compare file contents rather than a list of changed paths. ${notRun}`,
    vocabulary: [
      { term: 'Image layer', meaning: 'the saved result of one build step, reused by later builds when its inputs are unchanged' },
      { term: 'Build cache', meaning: 'the saved layers an image builder reuses instead of running steps again' },
    ],
    planPrompt:
      'In the example, what rebuilds when only package-lock.json changes? Why do builds copy the lockfile and install before copying the source code?',
    starter:
      "type Step = { instruction: string; copies: string[] }\n\nfunction layerRebuilds(steps: Step[], changed: string[]): string[] {\n  // Once a step rebuilds, every later step does too.\n  return steps.map(() => 'cached')\n}\n",
    functionName: 'layerRebuilds',
    preserveInput: true,
    hints: [
      'Write the rule for one source and one changed file as a small function.',
      'Keep a boolean that turns true at the first rebuilt step and stays true.',
      'A step with no copies can only rebuild because an earlier one did.',
    ],
    checks: [
      {
        name: 'Rebuilds from the copied source in the example',
        input: [
          [
            { instruction: 'FROM node:24', copies: [] },
            { instruction: 'COPY package.json package-lock.json ./', copies: ['package.json', 'package-lock.json'] },
            { instruction: 'RUN npm ci', copies: [] },
            { instruction: 'COPY src/ ./src/', copies: ['src/'] },
            { instruction: 'RUN npm run build', copies: [] },
          ],
          ['src/app.ts'],
        ],
        expected: ['cached', 'cached', 'cached', 'rebuilt', 'rebuilt'],
      },
      {
        name: 'Rebuilds the install after a lockfile change',
        input: [
          [
            { instruction: 'FROM node:24', copies: [] },
            { instruction: 'COPY package.json package-lock.json ./', copies: ['package.json', 'package-lock.json'] },
            { instruction: 'RUN npm ci', copies: [] },
            { instruction: 'COPY src/ ./src/', copies: ['src/'] },
          ],
          ['package-lock.json'],
        ],
        expected: ['cached', 'rebuilt', 'rebuilt', 'rebuilt'],
      },
      {
        name: 'Copies everything with "."',
        input: [
          [
            { instruction: 'FROM node:24', copies: [] },
            { instruction: 'COPY . .', copies: ['.'] },
            { instruction: 'RUN npm ci', copies: [] },
          ],
          ['README.md'],
        ],
        expected: ['cached', 'rebuilt', 'rebuilt'],
      },
      {
        name: 'Keeps everything cached when nothing it copies changed',
        input: [
          [
            { instruction: 'FROM node:24', copies: [] },
            { instruction: 'COPY src/ ./src/', copies: ['src/'] },
            { instruction: 'RUN npm run build', copies: [] },
          ],
          ['docs/intro.md', 'README.md'],
        ],
        expected: ['cached', 'cached', 'cached'],
      },
      {
        name: 'Matches a folder only from the start of a path',
        input: [[{ instruction: 'COPY src/ ./src/', copies: ['src/'] }], ['tests/src/a.ts', 'src-old/b.ts']],
        expected: ['cached'],
      },
      {
        name: 'Matches a file exactly',
        input: [[{ instruction: 'COPY package.json ./', copies: ['package.json'] }], ['web/package.json', 'package.json.bak']],
        expected: ['cached'],
      },
      {
        name: 'Rebuilds every later step, whatever it copies',
        input: [
          [
            { instruction: 'COPY config/ ./config/', copies: ['config/'] },
            { instruction: 'COPY assets/ ./assets/', copies: ['assets/'] },
            { instruction: 'RUN echo done', copies: [] },
          ],
          ['config/app.json'],
        ],
        expected: ['rebuilt', 'rebuilt', 'rebuilt'],
      },
      {
        name: 'Checks every source of a step',
        input: [[{ instruction: 'COPY a.txt b.txt ./', copies: ['a.txt', 'b.txt'] }], ['b.txt']],
        expected: ['rebuilt'],
      },
      { name: 'Handles nothing changed', input: [[{ instruction: 'COPY . .', copies: ['.'] }], []], expected: ['cached'] },
    ],
  },
  {
    id: 'devops-image-tags',
    title: 'Tag an image from a branch or release',
    category: 'DevOps',
    format: 'devops',
    context:
      'Every build pushes an image, and its tags tell people which one to run: a release version, the newest build of the main branch, or a build of one feature branch. Tags have a limited character set, so branch names have to be converted, and every image also gets a tag from its commit, so any build can be traced back.',
    prompt:
      'Implement imageTags(ref, sha). ref is "refs/heads/" followed by a branch name, or "refs/tags/" followed by a tag name; sha is the commit\'s 40-character lowercase hexadecimal ID. To convert a name: lowercase it, replace every character other than a-z, 0-9, ".", "_", and "-" with "-", remove "." and "-" characters from the start, and keep at most the first 40 characters. For the branch "main", the name tags are "main" and "edge". For any other branch, the name tag is the converted branch name, or none if it is empty. For a tag of the form MAJOR.MINOR.PATCH (whole numbers), optionally starting with "v", the name tags are "MAJOR.MINOR.PATCH", "MAJOR.MINOR", "MAJOR", and "latest". For such a version followed by "-" and a pre-release, the only name tag is the version without "v", such as "2.0.0-rc.1". Any other tag is converted like a branch name. Return the name tags in that order, followed by "sha-" and the first 7 characters of sha.',
    brief: {
      summary: 'Implement imageTags(ref, sha) and return the list of image tags.',
      rules: [
        'Convert a name: lowercase; replace characters other than a-z, 0-9, ".", "_", "-" with "-"; remove leading "." and "-"; keep at most 40 characters.',
        'Branch "main" gives "main" and "edge"; another branch gives its converted name, or nothing if that is empty.',
        'A tag MAJOR.MINOR.PATCH, optionally with "v", gives "MAJOR.MINOR.PATCH", "MAJOR.MINOR", "MAJOR", and "latest"; with a "-" pre-release, only the version without "v", such as "2.0.0-rc.1".',
        'Any other tag is converted like a branch name. Always end with "sha-" and the first 7 characters of sha.',
      ],
      edgeCases: ['A pre-release never gets "latest".', 'A branch name of only invalid characters gives only the sha tag.'],
    },
    example: {
      input: 'imageTags("refs/tags/v1.4.2", "3f9a1c27b0e4d5a6c7b8e9f0a1b2c3d4e5f6a7b8")',
      output: '["1.4.2", "1.4", "1", "latest", "sha-3f9a1c2"]',
    },
    note: `This tag policy keeps names to 40 characters for readability; image registries allow up to 128. ${notRun}`,
    vocabulary: [
      { term: 'Image tag', meaning: 'a name attached to a container image, such as 1.4.2 or latest, used to choose which image to run' },
      { term: 'Commit SHA', meaning: 'the unique ID of a commit, written in hexadecimal' },
    ],
    planPrompt:
      'Which tags do refs/heads/feature/Login-Page, refs/tags/v2.0.0-rc.1, and refs/heads/main get? Why does a pre-release not move "latest"?',
    starter: "function imageTags(ref: string, sha: string): string[] {\n  return ['sha-' + sha.slice(0, 7)]\n}\n",
    functionName: 'imageTags',
    hints: [
      'Split the ref into its kind (heads or tags) and the name after the second "/" of the prefix.',
      'One conversion function serves branches and non-version tags: lowercase, replace, trim the start, cut.',
      'Match versions with a pattern such as /^v?(\\d+)\\.(\\d+)\\.(\\d+)(-.+)?$/.',
    ],
    checks: [
      {
        name: 'Tags the release in the example',
        input: ['refs/tags/v1.4.2', '3f9a1c27b0e4d5a6c7b8e9f0a1b2c3d4e5f6a7b8'],
        expected: ['1.4.2', '1.4', '1', 'latest', 'sha-3f9a1c2'],
      },
      {
        name: 'Tags main as edge',
        input: ['refs/heads/main', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['main', 'edge', 'sha-abcdef0'],
      },
      {
        name: 'Converts a feature branch',
        input: ['refs/heads/feature/Login-Page', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['feature-login-page', 'sha-abcdef0'],
      },
      {
        name: 'Gives a pre-release only its version',
        input: ['refs/tags/v2.0.0-rc.1', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['2.0.0-rc.1', 'sha-abcdef0'],
      },
      {
        name: 'Accepts a version without v',
        input: ['refs/tags/3.0.10', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['3.0.10', '3.0', '3', 'latest', 'sha-abcdef0'],
      },
      {
        name: 'Converts a tag that is not a version',
        input: ['refs/tags/Nightly Build', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['nightly-build', 'sha-abcdef0'],
      },
      {
        name: 'Keeps dots and underscores',
        input: ['refs/heads/release/1.x_fix', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['release-1.x_fix', 'sha-abcdef0'],
      },
      {
        name: 'Removes leading dots and dashes',
        input: ['refs/heads/-.wip', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['wip', 'sha-abcdef0'],
      },
      {
        name: 'Removes leading characters after replacing',
        input: ['refs/heads/@@hotfix', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['hotfix', 'sha-abcdef0'],
      },
      {
        name: 'Keeps at most 40 characters',
        input: ['refs/heads/feature/a-very-long-branch-name-that-keeps-going-and-going', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['feature-a-very-long-branch-name-that-kee', 'sha-abcdef0'],
      },
      {
        name: 'Gives only the sha tag for an empty name',
        input: ['refs/heads/!!!', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['sha-abcdef0'],
      },
      {
        name: 'Treats a branch named like a version as a branch',
        input: ['refs/heads/1.2.3', 'abcdef0123456789abcdef0123456789abcdef01'],
        expected: ['1.2.3', 'sha-abcdef0'],
      },
    ],
  },
  {
    id: 'devops-dockerignore',
    title: 'Leave ignored files out of the build',
    category: 'DevOps',
    format: 'devops',
    context:
      'Everything in the build folder is sent to the image builder and can end up in the image unless an ignore file leaves it out. Leaving out folders such as node_modules and files such as .env keeps builds fast and keeps local secrets out of images.',
    prompt:
      'Implement buildContext(files, ignore). files lists the paths in the build folder; ignore is the lines of an ignore file. Trim each line and skip empty lines and lines starting with "#". A line starting with "!" is an exception, and its pattern is the rest of the line. A pattern ending with "/" matches every path that starts with it. A pattern starting with "*." matches every path whose last part (after the last "/") ends with the text after "*". Any other pattern matches the path equal to it and every path that starts with it followed by "/". For each file, the last line whose pattern matches decides: an ordinary line leaves the file out and an exception keeps it. A file no line matches is kept. Return the kept paths in order. Do not change the inputs.',
    brief: {
      summary: 'Implement buildContext(files, ignore) and return the paths that are kept.',
      rules: [
        'Trim lines; skip empty ones and "#" comments; a line starting with "!" is an exception for the rest of the line.',
        'A pattern ending with "/" matches paths that start with it; "*.ext" matches paths whose last part ends with ".ext".',
        'Any other pattern matches the path equal to it and every path under it as a folder.',
        'The last matching line decides: an ordinary line leaves the file out, an exception keeps it; with no match the file is kept.',
      ],
      edgeCases: [
        '"build" matches "build/app.js" but not "builder.ts".',
        'An exception before the line it should override has no effect.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'buildContext(["src/app.ts", "node_modules/a/index.js", "debug.log", "logs/keep.log", ".env"], ["node_modules", "*.log", "!logs/keep.log", ".env"])',
      output: '["src/app.ts", "logs/keep.log"]',
    },
    note: `Real ignore files also support "?", "*" in the middle of a path, and "**"; this rep uses only the forms above. ${notRun}`,
    vocabulary: [
      { term: 'Build context', meaning: 'the files sent to the image builder, which steps can copy from' },
      { term: 'Ignore file', meaning: 'a list of patterns for files a tool should leave out, such as .dockerignore or .gitignore' },
    ],
    planPrompt:
      'With the lines "*.log" and "!logs/keep.log", which of debug.log and logs/keep.log are kept? What changes if the two lines swap places?',
    starter: 'function buildContext(files: string[], ignore: string[]): string[] {\n  return files\n}\n',
    functionName: 'buildContext',
    preserveInput: true,
    hints: [
      'Parse the lines once into {pattern, exception} pairs.',
      'Write one function that says whether a pattern matches a path, with a branch for each of the three forms.',
      'Walk the lines in order for each file and remember the decision of the last one that matched.',
    ],
    checks: [
      {
        name: 'Filters the example',
        input: [
          ['src/app.ts', 'node_modules/a/index.js', 'debug.log', 'logs/keep.log', '.env'],
          ['node_modules', '*.log', '!logs/keep.log', '.env'],
        ],
        expected: ['src/app.ts', 'logs/keep.log'],
      },
      {
        name: 'Lets the last matching line decide',
        input: [
          ['debug.log', 'logs/keep.log'],
          ['!logs/keep.log', '*.log'],
        ],
        expected: [],
      },
      {
        name: 'Matches *.ext in any folder',
        input: [['a.log', 'logs/b.log', 'deep/er/c.log', 'log.txt', 'catalog'], ['*.log']],
        expected: ['log.txt', 'catalog'],
      },
      {
        name: 'Matches a name as a folder but not as a prefix',
        input: [['build/app.js', 'build', 'builder.ts', 'src/build/x.js'], ['build']],
        expected: ['builder.ts', 'src/build/x.js'],
      },
      {
        name: 'Matches a folder pattern from the start',
        input: [['dist/a.js', 'src/dist/b.js', 'dist'], ['dist/']],
        expected: ['src/dist/b.js', 'dist'],
      },
      {
        name: 'Skips comments and blank lines',
        input: [
          ['notes.md', '#notes.md'],
          ['#notes.md', '', '   '],
        ],
        expected: ['notes.md', '#notes.md'],
      },
      {
        name: 'Trims lines',
        input: [['.env', 'src/a.ts'], ['  .env  ']],
        expected: ['src/a.ts'],
      },
      {
        name: 'Re-includes a whole folder',
        input: [
          ['docs/a.md', 'docs/b.md', 'readme.md'],
          ['*.md', '!docs/'],
        ],
        expected: ['docs/a.md', 'docs/b.md'],
      },
      { name: 'Keeps everything with no lines', input: [['a', 'b/c'], []], expected: ['a', 'b/c'] },
    ],
  },
  {
    id: 'devops-tag-cleanup',
    title: 'Choose old image tags to delete',
    category: 'DevOps',
    format: 'devops',
    context:
      'An image registry fills up with a tag for every build of every branch. A cleanup policy keeps the newest few per branch and deletes the rest, but must never delete an image that is running somewhere or a release someone may need to roll back to.',
    prompt:
      "Implement tagsToDelete(tags, keepPerBranch, deployed). tags lists {name, branch, pushedAt}, where pushedAt is a whole number of seconds; deployed lists tag names that are running now. A tag is protected if its name is in deployed or has the form MAJOR.MINOR.PATCH (whole numbers). Protected tags are never deleted and do not use up a branch's allowance. For each branch, keep its keepPerBranch newest unprotected tags (largest pushedAt; on a tie, the one earlier in tags counts as newer) and delete its other unprotected tags. Return the names to delete in the order of tags. Do not change the inputs.",
    brief: {
      summary: 'Implement tagsToDelete(tags, keepPerBranch, deployed) and return the names to delete.',
      rules: [
        'A tag is protected if its name is in deployed or has the form MAJOR.MINOR.PATCH; protected tags are never deleted.',
        'Per branch, keep the keepPerBranch newest unprotected tags by pushedAt, the earlier one in tags counting as newer on a tie.',
        "Delete the branch's other unprotected tags; protected tags do not use up the allowance.",
        'Return the names to delete in the order of tags.',
      ],
      edgeCases: ['keepPerBranch can be 0.', '"1.2" or "v1.2.3" is not of the protected form.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'tagsToDelete([{name: "main-101", branch: "main", pushedAt: 100}, {name: "main-102", branch: "main", pushedAt: 200}, {name: "main-103", branch: "main", pushedAt: 300}, {name: "1.4.0", branch: "main", pushedAt: 50}], 2, [])',
      output: '["main-101"]',
    },
    note: `There are at most 1,000 tags. Real registries delete images by digest, and two tags can point at the same image. ${notRun}`,
    vocabulary: [
      { term: 'Image registry', meaning: 'a server that stores container images and their tags' },
      { term: 'Retention policy', meaning: 'a rule for how long or how many old items to keep before deleting them' },
    ],
    planPrompt:
      'A branch has five tags and you keep two. One of the old ones is deployed. Which tags are deleted, and does the deployed one change how many others you keep?',
    starter:
      'type Tag = { name: string; branch: string; pushedAt: number }\n\nfunction tagsToDelete(tags: Tag[], keepPerBranch: number, deployed: string[]): string[] {\n  return []\n}\n',
    functionName: 'tagsToDelete',
    preserveInput: true,
    hints: [
      'Decide protection first, then group the unprotected tags by branch.',
      'Sort each group newest first with a stable sort, so equal times keep their order.',
      'Everything after the first keepPerBranch in a sorted group is deleted; collect names in a Set and filter tags by it to keep the original order.',
    ],
    checks: [
      {
        name: 'Deletes the oldest tag in the example',
        input: [
          [
            { name: 'main-101', branch: 'main', pushedAt: 100 },
            { name: 'main-102', branch: 'main', pushedAt: 200 },
            { name: 'main-103', branch: 'main', pushedAt: 300 },
            { name: '1.4.0', branch: 'main', pushedAt: 50 },
          ],
          2,
          [],
        ],
        expected: ['main-101'],
      },
      {
        name: 'Never deletes a deployed tag',
        input: [
          [
            { name: 'main-101', branch: 'main', pushedAt: 100 },
            { name: 'main-102', branch: 'main', pushedAt: 200 },
            { name: 'main-103', branch: 'main', pushedAt: 300 },
          ],
          1,
          ['main-101'],
        ],
        expected: ['main-102'],
      },
      {
        name: 'Keeps the allowance for unprotected tags',
        input: [
          [
            { name: 'a-1', branch: 'a', pushedAt: 10 },
            { name: 'a-2', branch: 'a', pushedAt: 20 },
            { name: 'a-3', branch: 'a', pushedAt: 30 },
          ],
          2,
          ['a-3'],
        ],
        expected: [],
      },
      {
        name: 'Counts branches separately',
        input: [
          [
            { name: 'x-1', branch: 'x', pushedAt: 10 },
            { name: 'y-1', branch: 'y', pushedAt: 15 },
            { name: 'x-2', branch: 'x', pushedAt: 20 },
            { name: 'y-2', branch: 'y', pushedAt: 25 },
          ],
          1,
          [],
        ],
        expected: ['x-1', 'y-1'],
      },
      {
        name: 'Uses push time, not list order',
        input: [
          [
            { name: 'new', branch: 'b', pushedAt: 900 },
            { name: 'old', branch: 'b', pushedAt: 100 },
            { name: 'mid', branch: 'b', pushedAt: 500 },
          ],
          1,
          [],
        ],
        expected: ['old', 'mid'],
      },
      {
        name: 'Treats the earlier tag as newer on a tie',
        input: [
          [
            { name: 'first', branch: 'b', pushedAt: 100 },
            { name: 'second', branch: 'b', pushedAt: 100 },
          ],
          1,
          [],
        ],
        expected: ['second'],
      },
      {
        name: 'Protects only the exact version form',
        input: [
          [
            { name: '2.0.0', branch: 'main', pushedAt: 1 },
            { name: 'v2.0.1', branch: 'main', pushedAt: 2 },
            { name: '2.1', branch: 'main', pushedAt: 3 },
          ],
          0,
          [],
        ],
        expected: ['v2.0.1', '2.1'],
      },
      { name: 'Handles no tags', input: [[], 3, []], expected: [] },
    ],
  },
  {
    id: 'devops-multistage-rebuild',
    title: 'Predict rebuilds in a multi-stage build',
    category: 'DevOps',
    format: 'devops',
    context:
      'A multi-stage build uses one stage to install tools and compile, and a small final stage that copies only the compiled output. A change can rebuild some stages and leave others cached, and a stage that copies from another stage rebuilds whenever that stage produced something new.',
    prompt:
      'Implement stageRebuilds(stages, changed). stages lists {name, from, steps} in order; from is an image name or the name of an earlier stage. Each step is {copies, fromStage?}: copies lists sources, taken from the build folder, or from the earlier stage named by fromStage when it is given. changed lists changed file paths in the build folder; the stage and step lists are unchanged. Within a stage, a step is "rebuilt" if an earlier step in the same stage was rebuilt, if the stage starts from an earlier stage that changed, if it copies from a stage that changed, or if it copies from the build folder and one of its sources matches a changed file: "." matches every file, a source ending with "/" matches paths that start with it, and any other source matches only that exact path. Otherwise it is "cached". A stage changed if any of its steps was rebuilt, or if it starts from an earlier stage that changed. Return an object mapping each stage name to its list of step statuses. Do not change the inputs.',
    brief: {
      summary: "Implement stageRebuilds(stages, changed) and return each stage's step statuses.",
      rules: [
        'A step is "rebuilt" after an earlier rebuilt step in its stage, when its stage starts from a changed stage, when it copies from a changed stage, or when a source it copies from the build folder matches a changed file.',
        '"." matches every file; a source ending with "/" matches paths that start with it; others match only that exact path.',
        'A stage changed if any of its steps was rebuilt, or if it starts from a stage that changed.',
        'Return {stageName: statuses} for every stage.',
      ],
      edgeCases: [
        'A stage that starts from an image name is not affected by that image here.',
        'A stage with no steps still changes when its starting stage changed.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'stageRebuilds([{name: "deps", from: "node:24", steps: [{copies: ["package-lock.json"]}, {copies: []}]}, {name: "build", from: "deps", steps: [{copies: ["src/"]}, {copies: []}]}, {name: "final", from: "nginx:1.27", steps: [{copies: ["dist/"], fromStage: "build"}]}], ["src/app.ts"])',
      output: '{deps: ["cached", "cached"], build: ["rebuilt", "rebuilt"], final: ["rebuilt"]}',
    },
    note: `Stage names are unique and every stage named in from or fromStage comes earlier. A real builder may skip stages the final image never uses; this rep works out every stage. ${notRun}`,
    vocabulary: [
      {
        term: 'Multi-stage build',
        meaning: 'an image build with several stages, where later stages copy only what they need from earlier ones',
      },
      { term: 'Build stage', meaning: 'one named part of a multi-stage build, starting from an image or an earlier stage' },
    ],
    planPrompt: 'In the example, what rebuilds when only package-lock.json changes, and what when only README.md changes?',
    starter:
      'type Step = { copies: string[]; fromStage?: string }\ntype Stage = { name: string; from: string; steps: Step[] }\n\nfunction stageRebuilds(stages: Stage[], changed: string[]): Record<string, string[]> {\n  return {}\n}\n',
    functionName: 'stageRebuilds',
    preserveInput: true,
    hints: [
      'Keep a Set of the names of stages that changed; stages come in order, so earlier answers are ready when you need them.',
      'Inside a stage, start rebuilding as soon as any reason applies, and keep rebuilding to the end of the stage.',
      'A source copied from another stage depends on that stage, not on changed files.',
    ],
    checks: [
      {
        name: 'Rebuilds from the source change in the example',
        input: [
          [
            { name: 'deps', from: 'node:24', steps: [{ copies: ['package-lock.json'] }, { copies: [] }] },
            { name: 'build', from: 'deps', steps: [{ copies: ['src/'] }, { copies: [] }] },
            { name: 'final', from: 'nginx:1.27', steps: [{ copies: ['dist/'], fromStage: 'build' }] },
          ],
          ['src/app.ts'],
        ],
        expected: { deps: ['cached', 'cached'], build: ['rebuilt', 'rebuilt'], final: ['rebuilt'] },
      },
      {
        name: 'Rebuilds a stage that starts from a changed stage',
        input: [
          [
            { name: 'deps', from: 'node:24', steps: [{ copies: ['package-lock.json'] }, { copies: [] }] },
            { name: 'build', from: 'deps', steps: [{ copies: ['src/'] }, { copies: [] }] },
            { name: 'final', from: 'nginx:1.27', steps: [{ copies: ['dist/'], fromStage: 'build' }] },
          ],
          ['package-lock.json'],
        ],
        expected: { deps: ['rebuilt', 'rebuilt'], build: ['rebuilt', 'rebuilt'], final: ['rebuilt'] },
      },
      {
        name: 'Keeps every stage cached for a file nothing copies',
        input: [
          [
            { name: 'deps', from: 'node:24', steps: [{ copies: ['package-lock.json'] }, { copies: [] }] },
            { name: 'build', from: 'deps', steps: [{ copies: ['src/'] }, { copies: [] }] },
            { name: 'final', from: 'nginx:1.27', steps: [{ copies: ['dist/'], fromStage: 'build' }] },
          ],
          ['README.md'],
        ],
        expected: { deps: ['cached', 'cached'], build: ['cached', 'cached'], final: ['cached'] },
      },
      {
        name: 'Ignores changed files for a copy from a stage',
        input: [
          [
            { name: 'build', from: 'node:24', steps: [{ copies: ['src/'] }] },
            { name: 'final', from: 'nginx:1.27', steps: [{ copies: ['dist/'], fromStage: 'build' }] },
          ],
          ['dist/old.js'],
        ],
        expected: { build: ['cached'], final: ['cached'] },
      },
      {
        name: 'Rebuilds only from the step that copies the change',
        input: [
          [
            {
              name: 'app',
              from: 'node:24',
              steps: [{ copies: [] }, { copies: ['package.json'] }, { copies: ['src/'] }, { copies: [] }],
            },
          ],
          ['src/index.ts'],
        ],
        expected: { app: ['cached', 'cached', 'rebuilt', 'rebuilt'] },
      },
      {
        name: 'Passes a change through a stage with no steps',
        input: [
          [
            { name: 'base', from: 'node:24', steps: [{ copies: ['.'] }] },
            { name: 'alias', from: 'base', steps: [] },
            { name: 'final', from: 'node:24', steps: [{ copies: [] }, { copies: ['out/'], fromStage: 'alias' }] },
          ],
          ['anything.txt'],
        ],
        expected: { base: ['rebuilt'], alias: [], final: ['cached', 'rebuilt'] },
      },
      {
        name: 'Keeps a stage cached when the stage it copies from did not change',
        input: [
          [
            { name: 'docs', from: 'python:3.13', steps: [{ copies: ['docs/'] }] },
            { name: 'api', from: 'node:24', steps: [{ copies: ['api/'] }] },
            {
              name: 'final',
              from: 'nginx:1.27',
              steps: [
                { copies: ['site/'], fromStage: 'docs' },
                { copies: ['bin/'], fromStage: 'api' },
              ],
            },
          ],
          ['api/server.ts'],
        ],
        expected: { docs: ['cached'], api: ['rebuilt'], final: ['cached', 'rebuilt'] },
      },
    ],
  },
  {
    id: 'devops-rolling-batches',
    title: 'Plan a rolling update',
    category: 'DevOps',
    format: 'devops',
    context:
      "A rolling update replaces a service's instances a few at a time, so most of them keep serving while the new version starts. The deploy setting says what share of instances may be out of service at once; that share has to become a whole number of instances.",
    prompt:
      'Implement rollingBatches(instances, maxUnavailablePercent). instances lists instance names in update order, with at least one. maxUnavailablePercent is a whole number from 0 to 100. The batch size is the number of instances times maxUnavailablePercent divided by 100, rounded down, but at least 1. Split instances, in order, into batches of that size; the last batch may be smaller. Return {batchSize, minAvailable, batches}, where minAvailable is the number of instances minus batchSize. Do not change instances.',
    brief: {
      summary: 'Implement rollingBatches(instances, maxUnavailablePercent), where the percent is a whole number from 0 to 100.',
      rules: [
        'batchSize is instances × maxUnavailablePercent / 100, rounded down, but at least 1.',
        'Split instances in order into batches of batchSize; the last batch may be smaller.',
        'minAvailable is the number of instances minus batchSize.',
      ],
      edgeCases: [
        'A percent that rounds down to 0 still updates one instance at a time.',
        '100 percent updates every instance at once.',
        'Do not change instances.',
      ],
    },
    example: {
      input: 'rollingBatches(["web-1", "web-2", "web-3", "web-4", "web-5", "web-6", "web-7"], 30)',
      output: '{batchSize: 2, minAvailable: 5, batches: [["web-1", "web-2"], ["web-3", "web-4"], ["web-5", "web-6"], ["web-7"]]}',
    },
    note: `instances has at most 200 names. Real orchestrators also start extra instances during an update and wait for each one to report ready; this rep plans only the batches. ${notRun}`,
    vocabulary: [
      { term: 'Rolling update', meaning: 'a deploy that replaces instances a few at a time, so the service keeps running' },
      { term: 'Instance', meaning: 'one running copy of a service' },
    ],
    planPrompt:
      'What batch size do 7 instances at 30%, 5 instances at 10%, and 3 instances at 100% give, and how many instances are always serving?',
    starter:
      'function rollingBatches(instances: string[], maxUnavailablePercent: number) {\n  return { batchSize: 1, minAvailable: instances.length - 1, batches: [instances] }\n}\n',
    functionName: 'rollingBatches',
    preserveInput: true,
    hints: [
      'Math.floor rounds down and Math.max(1, ...) keeps the size at least 1.',
      'slice(start, start + batchSize) takes one batch without changing the input.',
      'Step start forward by batchSize until it passes the end.',
    ],
    checks: [
      {
        name: 'Plans the example',
        input: [['web-1', 'web-2', 'web-3', 'web-4', 'web-5', 'web-6', 'web-7'], 30],
        expected: { batchSize: 2, minAvailable: 5, batches: [['web-1', 'web-2'], ['web-3', 'web-4'], ['web-5', 'web-6'], ['web-7']] },
      },
      {
        name: 'Rounds the batch down',
        input: [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], 33],
        expected: { batchSize: 2, minAvailable: 7, batches: [['a', 'b'], ['c', 'd'], ['e', 'f'], ['g', 'h'], ['i']] },
      },
      {
        name: 'Updates at least one at a time',
        input: [['a', 'b', 'c', 'd', 'e'], 10],
        expected: { batchSize: 1, minAvailable: 4, batches: [['a'], ['b'], ['c'], ['d'], ['e']] },
      },
      {
        name: 'Treats 0 percent as one at a time',
        input: [['a', 'b'], 0],
        expected: { batchSize: 1, minAvailable: 1, batches: [['a'], ['b']] },
      },
      {
        name: 'Updates everything at 100 percent',
        input: [['a', 'b', 'c'], 100],
        expected: { batchSize: 3, minAvailable: 0, batches: [['a', 'b', 'c']] },
      },
      {
        name: 'Splits evenly when it can',
        input: [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 25],
        expected: {
          batchSize: 2,
          minAvailable: 6,
          batches: [
            ['a', 'b'],
            ['c', 'd'],
            ['e', 'f'],
            ['g', 'h'],
          ],
        },
      },
      { name: 'Handles one instance', input: [['solo'], 50], expected: { batchSize: 1, minAvailable: 0, batches: [['solo']] } },
      {
        name: 'Keeps the given order',
        input: [['z-3', 'a-1', 'm-2'], 67],
        expected: { batchSize: 2, minAvailable: 1, batches: [['z-3', 'a-1'], ['m-2']] },
      },
    ],
  },
  {
    id: 'devops-percent-rollout',
    title: 'Roll out a feature to a stable share of users',
    category: 'DevOps',
    format: 'devops',
    context:
      'A new feature is turned on for 10% of users first, then more. Each user must get the same answer on every request, and someone who has the feature at 10% must keep it at 50%, so the choice cannot be random per request. Hashing the user ID gives every user a fixed bucket from 0 to 99.',
    prompt:
      'Implement inRollout(userId, percent, flag). Hash the text flag + ":" + userId with 32-bit FNV-1a: start with hash = 2166136261; for each UTF-16 code unit c of the text (charCodeAt), set hash to Math.imul(hash ^ c, 16777619) >>> 0. The bucket is hash modulo 100, a whole number from 0 to 99. The user is enabled when bucket is less than percent, a whole number from 0 to 100. Return {bucket, enabled}.',
    brief: {
      summary: 'Implement inRollout(userId, percent, flag) and return {bucket, enabled}.',
      rules: [
        'Hash flag + ":" + userId with 32-bit FNV-1a: hash = 2166136261, then for each code unit c, hash = Math.imul(hash ^ c, 16777619) >>> 0.',
        'bucket is hash modulo 100, a whole number from 0 to 99.',
        'enabled is bucket < percent, where percent is a whole number from 0 to 100.',
      ],
      edgeCases: ['A bucket equal to percent is not enabled.', 'User IDs are compared exactly, including letter case.'],
    },
    example: { input: 'inRollout("u-1004", 10, "new-checkout")', output: '{bucket: 9, enabled: true}' },
    note: `Including the flag name in the hash gives each feature its own order of users, so the same 10% do not get every new feature first. FNV-1a is used because it is short and easy to check; it is not suitable for anything secret. ${notRun}`,
    vocabulary: [
      { term: 'Feature flag', meaning: 'a setting that turns a feature on or off for some users without a new deploy' },
      { term: 'Percentage rollout', meaning: 'turning a feature on for a growing share of users, chosen the same way every time' },
    ],
    planPrompt: 'Why must a user enabled at 10% still be enabled at 50%, and why does the flag name belong in the hashed text?',
    starter:
      'function inRollout(userId: string, percent: number, flag: string): { bucket: number; enabled: boolean } {\n  return { bucket: 0, enabled: false }\n}\n',
    functionName: 'inRollout',
    hints: [
      'Build the text once: flag, then ":", then the user ID.',
      'Math.imul keeps the multiplication in 32 bits, and >>> 0 keeps the result as a positive whole number.',
      'The comparison is strict: bucket < percent.',
    ],
    checks: [
      { name: 'Enables the user in the example', input: ['u-1004', 10, 'new-checkout'], expected: { bucket: 9, enabled: true } },
      { name: 'Leaves out a user above the percent', input: ['u-1001', 50, 'new-checkout'], expected: { bucket: 66, enabled: false } },
      { name: 'Leaves out a bucket equal to the percent', input: ['u-1004', 9, 'new-checkout'], expected: { bucket: 9, enabled: false } },
      { name: 'Keeps a user enabled as the percent grows', input: ['u-1004', 50, 'new-checkout'], expected: { bucket: 9, enabled: true } },
      { name: 'Gives each flag its own buckets', input: ['u-1002', 20, 'dark-mode'], expected: { bucket: 18, enabled: true } },
      { name: 'Joins the flag and user with ":"', input: ['u-1005', 50, 'new-checkout'], expected: { bucket: 90, enabled: false } },
      { name: 'Compares user IDs exactly', input: ['U-1001', 60, 'new-checkout'], expected: { bucket: 58, enabled: true } },
      { name: 'Enables nobody at 0', input: ['grace', 0, 'new-checkout'], expected: { bucket: 14, enabled: false } },
      { name: 'Enables everybody at 100', input: ['u-1005', 100, 'new-checkout'], expected: { bucket: 90, enabled: true } },
    ],
  },
  {
    id: 'devops-blue-green',
    title: 'Switch between blue and green',
    category: 'DevOps',
    format: 'devops',
    context:
      'A blue/green deploy keeps two complete environments. One, the live one, serves all traffic; the new version goes to the other, idle one, is checked there, and only then does traffic switch over. Switching back is instant, because the previous version is still running.',
    prompt:
      'Implement blueGreen(events). Start with blue live on "v1", green empty, and no rollback target. Process events in order. {type: "deploy", version}: put version on the idle color, mark it unchecked, and clear the rollback target. {type: "check", passed}: refused if the idle color is empty; otherwise mark it healthy if passed, or failed if not. {type: "switch"}: refused unless the idle color is healthy; otherwise the idle color becomes live, the previous live color becomes idle and healthy, and it becomes the rollback target. {type: "rollback"}: refused unless there is a rollback target; otherwise the target becomes live, the color that was live becomes idle and failed, and the target is cleared. Return {live, versions: {blue, green}, refused}, where refused lists the positions (from 0) of refused events. Do not change events.',
    brief: {
      summary: 'Implement blueGreen(events) and return {live, versions, refused}, with refused positions counted from 0.',
      rules: [
        'Start: blue live on "v1", green empty, no rollback target.',
        'deploy puts the version on the idle color, marks it unchecked, and clears the rollback target; check marks a non-empty idle color healthy or failed.',
        'switch needs a healthy idle color: it goes live, and the old live color becomes idle, healthy, and the rollback target.',
        'rollback needs a rollback target: it goes live, the color that was live becomes idle and failed, and the target is cleared.',
      ],
      edgeCases: ['A refused event changes nothing.', 'Empty colors are null in versions.', 'Do not change events.'],
    },
    example: {
      input: 'blueGreen([{type: "deploy", version: "v2"}, {type: "check", passed: true}, {type: "switch"}])',
      output: '{live: "green", versions: {blue: "v1", green: "v2"}, refused: []}',
    },
    note: `Real blue/green deploys also drain connections and switch DNS or a load balancer; here the switch is a state change. ${notRun}`,
    vocabulary: [
      {
        term: 'Blue/green deploy',
        meaning: 'a deploy with two full environments, where traffic switches to the new one only after it is checked',
      },
      { term: 'Deploy rollback', meaning: 'returning a service to the version it ran before a bad change' },
    ],
    planPrompt: 'Why is switch refused right after a deploy, and why does a deploy clear the rollback target?',
    starter:
      "type DeployEvent = { type: 'deploy'; version: string } | { type: 'check'; passed: boolean } | { type: 'switch' } | { type: 'rollback' }\n\nfunction blueGreen(events: DeployEvent[]) {\n  return { live: 'blue', versions: { blue: 'v1' as string | null, green: null as string | null }, refused: [] as number[] }\n}\n",
    functionName: 'blueGreen',
    preserveInput: true,
    hints: [
      "Keep live, versions, the idle color's health, and the rollback target as variables.",
      'The idle color is always the one that is not live.',
      'Check whether an event is allowed before changing anything, and record its position if not.',
    ],
    checks: [
      {
        name: 'Switches after a passing check',
        input: [[{ type: 'deploy', version: 'v2' }, { type: 'check', passed: true }, { type: 'switch' }]],
        expected: { live: 'green', versions: { blue: 'v1', green: 'v2' }, refused: [] },
      },
      {
        name: 'Refuses to switch before a check',
        input: [[{ type: 'deploy', version: 'v2' }, { type: 'switch' }]],
        expected: { live: 'blue', versions: { blue: 'v1', green: 'v2' }, refused: [1] },
      },
      {
        name: 'Refuses to switch after a failing check',
        input: [[{ type: 'deploy', version: 'v2' }, { type: 'check', passed: false }, { type: 'switch' }]],
        expected: { live: 'blue', versions: { blue: 'v1', green: 'v2' }, refused: [2] },
      },
      {
        name: 'Rolls back to the previous live color',
        input: [[{ type: 'deploy', version: 'v2' }, { type: 'check', passed: true }, { type: 'switch' }, { type: 'rollback' }]],
        expected: { live: 'blue', versions: { blue: 'v1', green: 'v2' }, refused: [] },
      },
      {
        name: 'Refuses to switch back to a rolled-back color',
        input: [
          [
            { type: 'deploy', version: 'v2' },
            { type: 'check', passed: true },
            { type: 'switch' },
            { type: 'rollback' },
            { type: 'switch' },
          ],
        ],
        expected: { live: 'blue', versions: { blue: 'v1', green: 'v2' }, refused: [4] },
      },
      {
        name: 'Refuses a rollback with no target',
        input: [[{ type: 'rollback' }]],
        expected: { live: 'blue', versions: { blue: 'v1', green: null }, refused: [0] },
      },
      {
        name: 'Clears the rollback target on a new deploy',
        input: [
          [
            { type: 'deploy', version: 'v2' },
            { type: 'check', passed: true },
            { type: 'switch' },
            { type: 'deploy', version: 'v3' },
            { type: 'rollback' },
          ],
        ],
        expected: { live: 'green', versions: { blue: 'v3', green: 'v2' }, refused: [4] },
      },
      {
        name: 'Refuses a check with nothing deployed',
        input: [[{ type: 'check', passed: true }, { type: 'switch' }]],
        expected: { live: 'blue', versions: { blue: 'v1', green: null }, refused: [0, 1] },
      },
      {
        name: 'Deploys to whichever color is idle',
        input: [
          [
            { type: 'deploy', version: 'v2' },
            { type: 'check', passed: true },
            { type: 'switch' },
            { type: 'deploy', version: 'v3' },
            { type: 'check', passed: true },
            { type: 'switch' },
          ],
        ],
        expected: { live: 'blue', versions: { blue: 'v3', green: 'v2' }, refused: [] },
      },
      { name: 'Starts with blue live', input: [[]], expected: { live: 'blue', versions: { blue: 'v1', green: null }, refused: [] } },
    ],
  },
  {
    id: 'devops-canary-schedule',
    title: 'Find where a canary rollout stands',
    category: 'DevOps',
    format: 'devops',
    context:
      'A canary rollout sends a small share of traffic to the new version, holds it there for a while, then moves to the next share. When someone pauses the rollout to investigate, the hold timer stops, so paused time does not count toward a step.',
    prompt:
      'Implement canaryStep(steps, minutesSinceStart, pauses). steps lists {percent, holdMinutes} in order; the rollout starts the first step at minute 0, and each later step starts once the hold times of all earlier steps have passed. pauses lists {from, to} minute ranges, which do not overlap, during which the rollout was paused. Count only active time: minutesSinceStart minus the part of each pause between minute 0 and minutesSinceStart. The current step is the last one whose start is at or before that active time. Return {step, percent}, where step counts from 0. Do not change the inputs.',
    brief: {
      summary: 'Implement canaryStep(steps, minutesSinceStart, pauses) and return {step, percent}.',
      rules: [
        'Step 0 starts at minute 0; each later step starts once the hold times of all earlier steps have passed.',
        'Active time is minutesSinceStart minus the part of each pause between minute 0 and minutesSinceStart.',
        'The current step is the last one whose start is at or before the active time; step counts from 0.',
      ],
      edgeCases: [
        'A step starts exactly when the earlier holds add up to the active time.',
        'A pause that has not ended yet counts only up to minutesSinceStart.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'canaryStep([{percent: 5, holdMinutes: 10}, {percent: 25, holdMinutes: 10}, {percent: 50, holdMinutes: 20}, {percent: 100, holdMinutes: 0}], 25, [{from: 12, to: 18}])',
      output: '{step: 1, percent: 25}',
    },
    note: `Minutes are whole numbers; minutesSinceStart is passed in, so your function never reads a clock. steps has at least one entry. ${notRun}`,
    vocabulary: [
      {
        term: 'Canary release',
        meaning: 'sending a small share of traffic to a new version first, to catch problems before everyone sees them',
      },
      { term: 'Hold time', meaning: 'how long a rollout stays at one step before moving on' },
    ],
    planPrompt:
      'In the example, when does each step start without pauses? How many minutes does the pause from 12 to 18 take away by minute 25?',
    starter:
      'type Step = { percent: number; holdMinutes: number }\n\nfunction canaryStep(steps: Step[], minutesSinceStart: number, pauses: { from: number; to: number }[]) {\n  return { step: 0, percent: steps[0].percent }\n}\n',
    functionName: 'canaryStep',
    preserveInput: true,
    hints: [
      'The paused part of one pause is the overlap of {from, to} with {0, minutesSinceStart}: Math.max(0, Math.min(to, now) - Math.max(from, 0)).',
      "Keep a running start time, adding each step's hold as you go.",
      'Stop at the first step that starts after the active time; the one before it is current.',
    ],
    checks: [
      {
        name: 'Places the example after its pause',
        input: [
          [
            { percent: 5, holdMinutes: 10 },
            { percent: 25, holdMinutes: 10 },
            { percent: 50, holdMinutes: 20 },
            { percent: 100, holdMinutes: 0 },
          ],
          25,
          [{ from: 12, to: 18 }],
        ],
        expected: { step: 1, percent: 25 },
      },
      {
        name: 'Moves on without pauses',
        input: [
          [
            { percent: 5, holdMinutes: 10 },
            { percent: 25, holdMinutes: 10 },
            { percent: 50, holdMinutes: 20 },
            { percent: 100, holdMinutes: 0 },
          ],
          25,
          [],
        ],
        expected: { step: 2, percent: 50 },
      },
      {
        name: 'Starts a step exactly when the holds are over',
        input: [
          [
            { percent: 5, holdMinutes: 10 },
            { percent: 25, holdMinutes: 10 },
          ],
          10,
          [],
        ],
        expected: { step: 1, percent: 25 },
      },
      {
        name: 'Stays on a step one minute before it ends',
        input: [
          [
            { percent: 5, holdMinutes: 10 },
            { percent: 25, holdMinutes: 10 },
          ],
          9,
          [],
        ],
        expected: { step: 0, percent: 5 },
      },
      {
        name: 'Counts an unfinished pause only up to now',
        input: [
          [
            { percent: 5, holdMinutes: 10 },
            { percent: 25, holdMinutes: 10 },
            { percent: 50, holdMinutes: 10 },
          ],
          25,
          [{ from: 20, to: 40 }],
        ],
        expected: { step: 2, percent: 50 },
      },
      {
        name: 'Ignores a pause that has not started',
        input: [
          [
            { percent: 5, holdMinutes: 10 },
            { percent: 25, holdMinutes: 10 },
          ],
          12,
          [{ from: 30, to: 45 }],
        ],
        expected: { step: 1, percent: 25 },
      },
      {
        name: 'Adds up several pauses',
        input: [
          [
            { percent: 10, holdMinutes: 5 },
            { percent: 50, holdMinutes: 5 },
            { percent: 100, holdMinutes: 0 },
          ],
          16,
          [
            { from: 2, to: 4 },
            { from: 6, to: 9 },
          ],
        ],
        expected: { step: 2, percent: 100 },
      },
      {
        name: 'Stays on the last step',
        input: [
          [
            { percent: 20, holdMinutes: 5 },
            { percent: 100, holdMinutes: 0 },
          ],
          500,
          [],
        ],
        expected: { step: 1, percent: 100 },
      },
      {
        name: 'Skips a step with no hold time',
        input: [
          [
            { percent: 1, holdMinutes: 0 },
            { percent: 10, holdMinutes: 30 },
          ],
          0,
          [],
        ],
        expected: { step: 1, percent: 10 },
      },
    ],
  },
  {
    id: 'devops-canary-verdict',
    title: 'Decide whether to promote or roll back a canary',
    category: 'DevOps',
    format: 'devops',
    context:
      'While a canary runs, its error rate is checked every minute. One bad minute can be noise, so the decision waits for a run of bad minutes before rolling back, and for a run of good ones before promoting. A minute with very little traffic says almost nothing, so it is not counted at all.',
    prompt:
      'Implement canaryVerdict(samples, policy). samples lists {requests, errors} for the canary, one per minute, in order. policy is {maxErrorPercent, minRequests, healthyNeeded, unhealthyNeeded}, all whole numbers. Go through the samples in order. A sample with fewer than minRequests requests is skipped: it neither counts nor breaks a run. Otherwise the sample is unhealthy when errors × 100 is greater than maxErrorPercent × requests, and healthy otherwise. Keep the number of healthy samples in a row and unhealthy samples in a row; each kind resets the other. At the first sample where the unhealthy run reaches unhealthyNeeded, return {decision: "rollback", at} with that sample\'s position (from 0); at the first where the healthy run reaches healthyNeeded, return {decision: "promote", at}. If neither happens, return {decision: "continue", at: null}. Do not change the inputs.',
    brief: {
      summary: 'Implement canaryVerdict(samples, policy) and return {decision, at}.',
      rules: [
        'Skip a sample with fewer than minRequests requests; it neither counts nor breaks a run.',
        'A counted sample is unhealthy when errors × 100 > maxErrorPercent × requests, and healthy otherwise.',
        'Count healthy and unhealthy samples in a row; each kind resets the other.',
        'Return "rollback" or "promote" with the position (from 0) of the first sample that completes a run, or {decision: "continue", at: null}.',
      ],
      edgeCases: ['An error rate exactly at maxErrorPercent is healthy.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'canaryVerdict([{requests: 400, errors: 2}, {requests: 380, errors: 30}, {requests: 410, errors: 25}], {maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 2})',
      output: '{decision: "rollback", at: 2}',
    },
    note: `Comparing errors × 100 with maxErrorPercent × requests keeps the arithmetic in whole numbers, so no rounding decides a boundary. The samples are passed in, not measured. ${notRun}`,
    vocabulary: [
      { term: 'Error rate', meaning: 'the share of requests that failed in a period' },
      { term: 'Promote', meaning: 'move a canary to full traffic after it has proved healthy' },
    ],
    planPrompt:
      'With healthyNeeded 3 and unhealthyNeeded 2, trace good, bad, quiet (too few requests), bad. What is decided, and at which sample?',
    starter:
      "type Sample = { requests: number; errors: number }\ntype Policy = { maxErrorPercent: number; minRequests: number; healthyNeeded: number; unhealthyNeeded: number }\n\nfunction canaryVerdict(samples: Sample[], policy: Policy): { decision: string; at: number | null } {\n  return { decision: 'continue', at: null }\n}\n",
    functionName: 'canaryVerdict',
    preserveInput: true,
    hints: [
      'Keep two counters and reset one whenever the other grows.',
      'Use continue for a skipped sample, so it changes neither counter.',
      'Return as soon as a counter reaches its target.',
    ],
    checks: [
      {
        name: 'Rolls back in the example',
        input: [
          [
            { requests: 400, errors: 2 },
            { requests: 380, errors: 30 },
            { requests: 410, errors: 25 },
          ],
          { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 2 },
        ],
        expected: { decision: 'rollback', at: 2 },
      },
      {
        name: 'Promotes after enough healthy minutes',
        input: [
          [
            { requests: 200, errors: 1 },
            { requests: 220, errors: 0 },
            { requests: 210, errors: 3 },
            { requests: 230, errors: 90 },
          ],
          { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 2 },
        ],
        expected: { decision: 'promote', at: 2 },
      },
      {
        name: 'Counts a rate at the limit as healthy',
        input: [[{ requests: 100, errors: 2 }], { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 1, unhealthyNeeded: 1 }],
        expected: { decision: 'promote', at: 0 },
      },
      {
        name: 'Counts one error over the limit as unhealthy',
        input: [[{ requests: 100, errors: 3 }], { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 1, unhealthyNeeded: 1 }],
        expected: { decision: 'rollback', at: 0 },
      },
      {
        name: 'Skips quiet minutes without breaking a run',
        input: [
          [
            { requests: 300, errors: 40 },
            { requests: 20, errors: 0 },
            { requests: 310, errors: 35 },
          ],
          { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 2 },
        ],
        expected: { decision: 'rollback', at: 2 },
      },
      {
        name: 'Does not judge a quiet minute full of errors',
        input: [
          [
            { requests: 10, errors: 9 },
            { requests: 12, errors: 12 },
          ],
          { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 1 },
        ],
        expected: { decision: 'continue', at: null },
      },
      {
        name: 'Resets a run when the other kind appears',
        input: [
          [
            { requests: 300, errors: 40 },
            { requests: 300, errors: 1 },
            { requests: 300, errors: 40 },
            { requests: 300, errors: 1 },
          ],
          { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 2 },
        ],
        expected: { decision: 'continue', at: null },
      },
      {
        name: 'Restarts the healthy run after an unhealthy minute',
        input: [
          [
            { requests: 300, errors: 1 },
            { requests: 300, errors: 40 },
            { requests: 300, errors: 1 },
            { requests: 300, errors: 1 },
          ],
          { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 2 },
        ],
        expected: { decision: 'continue', at: null },
      },
      {
        name: 'Uses whole-number arithmetic at the boundary',
        input: [[{ requests: 100, errors: 7 }], { maxErrorPercent: 7, minRequests: 1, healthyNeeded: 1, unhealthyNeeded: 1 }],
        expected: { decision: 'promote', at: 0 },
      },
      {
        name: 'Uses the supplied limits',
        input: [
          [
            { requests: 150, errors: 6 },
            { requests: 150, errors: 7 },
          ],
          { maxErrorPercent: 5, minRequests: 150, healthyNeeded: 2, unhealthyNeeded: 2 },
        ],
        expected: { decision: 'promote', at: 1 },
      },
      {
        name: 'Continues with no samples',
        input: [[], { maxErrorPercent: 2, minRequests: 100, healthyNeeded: 3, unhealthyNeeded: 2 }],
        expected: { decision: 'continue', at: null },
      },
    ],
  },
  {
    id: 'devops-health-endpoints',
    title: 'Answer liveness and readiness checks',
    category: 'DevOps',
    format: 'devops',
    context:
      'An orchestrator asks each instance two questions. Liveness asks whether the process is stuck and should be restarted. Readiness asks whether it should get traffic right now. Mixing them up is costly: if liveness fails whenever the database is down, every instance restarts at once and the outage gets worse.',
    prompt:
      'Implement healthEndpoints(state). state is {started, shuttingDown, stalled, dependencies}, where dependencies lists {name, required, up}. Liveness looks only at stalled: return {status: 503} if stalled is true and {status: 200} otherwise. Readiness collects reasons in this order: "starting" if started is false, "shutting down" if shuttingDown is true, then "NAME is down" for each required dependency that is not up, in list order, where NAME is its name. Readiness is {status: 200, reasons: []} with no reasons, and {status: 503, reasons} otherwise. Dependencies that are not required never affect readiness. Return {live, ready}. Do not change state.',
    brief: {
      summary: 'Implement healthEndpoints(state) and return {live, ready}.',
      rules: [
        'Liveness looks only at stalled: {status: 503} if stalled, else {status: 200}.',
        'Readiness reasons, in order: "starting" if not started, "shutting down" if shuttingDown, then "NAME is down" for each required dependency that is not up.',
        'Readiness is {status: 200, reasons: []} with no reasons, and {status: 503, reasons} otherwise.',
      ],
      edgeCases: [
        'A dependency that is not required never affects readiness.',
        'A down database makes the instance not ready, but still live.',
        'Do not change state.',
      ],
    },
    example: {
      input:
        'healthEndpoints({started: true, shuttingDown: false, stalled: false, dependencies: [{name: "database", required: true, up: false}, {name: "cache", required: false, up: false}]})',
      output: '{live: {status: 200}, ready: {status: 503, reasons: ["database is down"]}}',
    },
    note: `Real health endpoints return these as HTTP responses; here they are values your function returns. ${notRun}`,
    vocabulary: [
      { term: 'Liveness check', meaning: 'a check that asks whether a process is stuck and should be restarted' },
      { term: 'Readiness check', meaning: 'a check that asks whether an instance should receive traffic right now' },
    ],
    planPrompt:
      'The database goes down for every instance at once. What should liveness and readiness each answer, and what would happen if liveness failed too?',
    starter:
      'type Dependency = { name: string; required: boolean; up: boolean }\ntype State = { started: boolean; shuttingDown: boolean; stalled: boolean; dependencies: Dependency[] }\n\nfunction healthEndpoints(state: State) {\n  return { live: { status: 200 }, ready: { status: 200, reasons: [] as string[] } }\n}\n',
    functionName: 'healthEndpoints',
    preserveInput: true,
    hints: [
      'Work out liveness first; it needs only one field.',
      'Build the readiness reasons in a list, in the stated order.',
      'The status follows from whether the list is empty.',
    ],
    checks: [
      {
        name: 'Stays live while the database is down',
        input: [
          {
            started: true,
            shuttingDown: false,
            stalled: false,
            dependencies: [
              { name: 'database', required: true, up: false },
              { name: 'cache', required: false, up: false },
            ],
          },
        ],
        expected: { live: { status: 200 }, ready: { status: 503, reasons: ['database is down'] } },
      },
      {
        name: 'Is ready when every required dependency is up',
        input: [
          {
            started: true,
            shuttingDown: false,
            stalled: false,
            dependencies: [
              { name: 'database', required: true, up: true },
              { name: 'cache', required: false, up: false },
            ],
          },
        ],
        expected: { live: { status: 200 }, ready: { status: 200, reasons: [] } },
      },
      {
        name: 'Is not ready while starting',
        input: [{ started: false, shuttingDown: false, stalled: false, dependencies: [] }],
        expected: { live: { status: 200 }, ready: { status: 503, reasons: ['starting'] } },
      },
      {
        name: 'Is not ready while shutting down',
        input: [{ started: true, shuttingDown: true, stalled: false, dependencies: [{ name: 'database', required: true, up: true }] }],
        expected: { live: { status: 200 }, ready: { status: 503, reasons: ['shutting down'] } },
      },
      {
        name: 'Fails liveness only when stalled',
        input: [{ started: true, shuttingDown: false, stalled: true, dependencies: [{ name: 'database', required: true, up: true }] }],
        expected: { live: { status: 503 }, ready: { status: 200, reasons: [] } },
      },
      {
        name: 'Lists every reason in order',
        input: [
          {
            started: false,
            shuttingDown: true,
            stalled: false,
            dependencies: [
              { name: 'queue', required: true, up: false },
              { name: 'cache', required: false, up: false },
              { name: 'database', required: true, up: false },
            ],
          },
        ],
        expected: {
          live: { status: 200 },
          ready: { status: 503, reasons: ['starting', 'shutting down', 'queue is down', 'database is down'] },
        },
      },
      {
        name: 'Is ready with no dependencies',
        input: [{ started: true, shuttingDown: false, stalled: false, dependencies: [] }],
        expected: { live: { status: 200 }, ready: { status: 200, reasons: [] } },
      },
    ],
  },
  {
    id: 'devops-probe-thresholds',
    title: 'Put an instance in and out of service',
    category: 'DevOps',
    format: 'devops',
    context:
      'A load balancer checks each instance every few seconds. A single failed check could be a blip, so it takes several failures in a row to remove an instance and several passes in a row to add it back. A new instance starts out of service until it has passed enough checks.',
    prompt:
      'Implement serviceTimeline(results, healthyThreshold, unhealthyThreshold). results lists check results in time order, true for a pass. The instance starts out of service. Count passes in a row and failures in a row; a pass resets the failure count and a failure resets the pass count. When the instance is out of service and the passes in a row reach healthyThreshold, it goes into service. When it is in service and the failures in a row reach unhealthyThreshold, it goes out of service. Return a list with one entry per result: true if the instance is in service after that check, false otherwise. Do not change results.',
    brief: {
      summary:
        'Implement serviceTimeline(results, healthyThreshold, unhealthyThreshold) and return whether the instance is in service after each check.',
      rules: [
        'The instance starts out of service.',
        'Count passes and failures in a row; each kind resets the other.',
        'Out of service, it goes in when the passes in a row reach healthyThreshold; in service, it goes out when the failures in a row reach unhealthyThreshold.',
      ],
      edgeCases: ['Thresholds of 1 change state on a single check.', 'Do not change results.'],
    },
    example: {
      input: 'serviceTimeline([true, true, false, true, true, true, false, false], 3, 2)',
      output: '[false, false, false, false, false, true, true, false]',
    },
    note: `Thresholds are whole numbers of at least 1; there are at most 1,000 results. ${notRun}`,
    vocabulary: [
      { term: 'Load balancer', meaning: 'a service that spreads incoming requests across several instances' },
      { term: 'Health threshold', meaning: 'how many checks in a row must pass or fail before an instance changes state' },
    ],
    planPrompt:
      'With thresholds of 3 to go in and 2 to go out, trace pass, pass, fail, pass, pass, pass, fail, fail. When does the instance enter and leave service?',
    starter:
      'function serviceTimeline(results: boolean[], healthyThreshold: number, unhealthyThreshold: number): boolean[] {\n  return results.map(() => false)\n}\n',
    functionName: 'serviceTimeline',
    preserveInput: true,
    hints: [
      'Keep three variables: in service, passes in a row, and failures in a row.',
      'Update the counts first, then check the threshold that matters for the current state.',
      'Push the state after each check.',
    ],
    checks: [
      {
        name: 'Follows the example',
        input: [[true, true, false, true, true, true, false, false], 3, 2],
        expected: [false, false, false, false, false, true, true, false],
      },
      { name: 'Starts out of service', input: [[true], 2, 2], expected: [false] },
      { name: 'Enters service at the threshold', input: [[true, true], 2, 2], expected: [false, true] },
      {
        name: 'Stays in service through a short failure',
        input: [[true, true, false, true, false, true], 2, 2],
        expected: [false, true, true, true, true, true],
      },
      { name: 'Leaves service at the threshold', input: [[true, false, false, false], 1, 3], expected: [true, true, true, false] },
      {
        name: 'Needs a fresh run of passes to come back',
        input: [[true, false, true, false, true, true], 1, 1],
        expected: [true, false, true, false, true, true],
      },
      {
        name: 'Ignores failures while out of service',
        input: [[false, false, false, true, true], 2, 1],
        expected: [false, false, false, false, true],
      },
      { name: 'Handles no checks', input: [[], 2, 2], expected: [] },
    ],
  },
  {
    id: 'devops-restart-backoff',
    title: 'Back off between restarts',
    category: 'DevOps',
    format: 'devops',
    context:
      'When a container keeps crashing, restarting it immediately every time wastes resources and floods the logs. Orchestrators wait longer after each crash, up to a limit, and start counting again once the container has stayed up for a while.',
    prompt:
      'Implement restartDelays(runs, policy). runs lists how many seconds each run of a container lasted before it crashed, in order. policy is {baseSeconds, maxSeconds, resetAfterSeconds}. Return the delay before each restart, one per run. The delay after a crash is baseSeconds × 2 to the power of the number of earlier crashes in the current series, but at most maxSeconds. A run that lasted at least resetAfterSeconds starts a new series, so the delay after its crash is baseSeconds. Do not change the inputs.',
    brief: {
      summary: 'Implement restartDelays(runs, policy) and return the delay before each restart.',
      rules: [
        'The delay is baseSeconds × 2 to the power of the earlier crashes in the current series, at most maxSeconds.',
        'A run that lasted at least resetAfterSeconds starts a new series, so its delay is baseSeconds.',
        'Return one delay per run, in order.',
      ],
      edgeCases: ['A run exactly resetAfterSeconds long starts a new series.', 'Do not change the inputs.'],
    },
    example: {
      input: 'restartDelays([5, 5, 5, 700, 5], {baseSeconds: 10, maxSeconds: 300, resetAfterSeconds: 600})',
      output: '[10, 20, 40, 10, 20]',
    },
    note: `Times are whole seconds and are passed in; your function never reads a clock. Real orchestrators add other limits, such as how many restarts are allowed in total. ${notRun}`,
    vocabulary: [
      { term: 'Crash loop', meaning: 'a container that keeps crashing soon after every restart' },
      { term: 'Backoff', meaning: 'waiting longer after each failure before trying again' },
    ],
    planPrompt:
      'With base 10, max 300, and reset 600, what are the delays for ten 1-second runs in a row? What changes if the sixth run lasts 600 seconds?',
    starter:
      'type Policy = { baseSeconds: number; maxSeconds: number; resetAfterSeconds: number }\n\nfunction restartDelays(runs: number[], policy: Policy): number[] {\n  return runs.map(() => policy.baseSeconds)\n}\n',
    functionName: 'restartDelays',
    preserveInput: true,
    hints: [
      'Keep a count of crashes in the current series.',
      'Reset the count to 0 before working out the delay when a run was long enough.',
      'Math.min applies the limit after doubling.',
    ],
    checks: [
      {
        name: 'Doubles and resets as in the example',
        input: [[5, 5, 5, 700, 5], { baseSeconds: 10, maxSeconds: 300, resetAfterSeconds: 600 }],
        expected: [10, 20, 40, 10, 20],
      },
      {
        name: 'Stops at the limit',
        input: [[1, 1, 1, 1, 1, 1, 1], { baseSeconds: 10, maxSeconds: 300, resetAfterSeconds: 600 }],
        expected: [10, 20, 40, 80, 160, 300, 300],
      },
      {
        name: 'Resets at exactly the reset time',
        input: [[1, 1, 600], { baseSeconds: 10, maxSeconds: 300, resetAfterSeconds: 600 }],
        expected: [10, 20, 10],
      },
      {
        name: 'Keeps the series one second short of it',
        input: [[1, 1, 599], { baseSeconds: 10, maxSeconds: 300, resetAfterSeconds: 600 }],
        expected: [10, 20, 40],
      },
      {
        name: 'Uses the supplied policy',
        input: [[2, 2, 2], { baseSeconds: 5, maxSeconds: 12, resetAfterSeconds: 60 }],
        expected: [5, 10, 12],
      },
      {
        name: 'Starts a series with a long first run',
        input: [[900, 1], { baseSeconds: 10, maxSeconds: 300, resetAfterSeconds: 600 }],
        expected: [10, 20],
      },
      { name: 'Handles no crashes', input: [[], { baseSeconds: 10, maxSeconds: 300, resetAfterSeconds: 600 }], expected: [] },
    ],
  },
  {
    id: 'devops-liveness-restart',
    title: 'Find when a liveness check restarts a container',
    category: 'DevOps',
    format: 'devops',
    context:
      'A liveness check that starts too soon, or gives up too quickly, restarts a container that was only slow to start, and the restart starts the slow startup over again. Working out when the check would fire shows whether its settings fit how the service behaves.',
    prompt:
      'Implement livenessRestart(probe, stalls, horizon). probe is {initialDelay, period, failureThreshold}: checks run at second initialDelay, then every period seconds, while the time is at most horizon. stalls lists {from, to} ranges during which the container does not answer; a check at time t fails if from <= t < to for some stall, and passes otherwise. Count failures in a row; a pass resets the count. Return the time of the check at which the failures in a row reach failureThreshold, which is when the container is restarted, or null if that never happens by horizon. Do not change the inputs.',
    brief: {
      summary: 'Implement livenessRestart(probe, stalls, horizon) and return the restart time or null.',
      rules: [
        'Checks run at initialDelay, then every period seconds, while the time is at most horizon.',
        'A check at time t fails if from <= t < to for some stall, and passes otherwise.',
        'Count failures in a row, reset by a pass; return the time of the check that reaches failureThreshold, or null.',
      ],
      edgeCases: ["A check exactly at a stall's to passes.", 'Do not change the inputs.'],
    },
    example: {
      input: 'livenessRestart({initialDelay: 10, period: 10, failureThreshold: 3}, [{from: 0, to: 45}], 300)',
      output: '30',
    },
    note: `Times are whole seconds passed in; the example's stall from 0 to 45 is a container that needs 45 seconds to start. ${notRun}`,
    vocabulary: [
      { term: 'Initial delay', meaning: 'how long a check waits after a container starts before the first check' },
      { term: 'Failure threshold', meaning: 'how many checks in a row must fail before action is taken' },
    ],
    planPrompt:
      'A service takes 45 seconds to start. Which settings of initialDelay, period, and failureThreshold stop the check from restarting it during startup?',
    starter:
      'type Probe = { initialDelay: number; period: number; failureThreshold: number }\n\nfunction livenessRestart(probe: Probe, stalls: { from: number; to: number }[], horizon: number): number | null {\n  return null\n}\n',
    functionName: 'livenessRestart',
    preserveInput: true,
    hints: [
      'Loop with t from initialDelay while t <= horizon, adding period each time.',
      'A stall includes its from time and excludes its to time.',
      'Return as soon as the count reaches the threshold.',
    ],
    checks: [
      {
        name: 'Restarts a slow start in the example',
        input: [{ initialDelay: 10, period: 10, failureThreshold: 3 }, [{ from: 0, to: 45 }], 300],
        expected: 30,
      },
      {
        name: 'Waits long enough for the start',
        input: [{ initialDelay: 50, period: 10, failureThreshold: 3 }, [{ from: 0, to: 45 }], 300],
        expected: null,
      },
      {
        name: 'Tolerates enough failures to cover the start',
        input: [{ initialDelay: 10, period: 10, failureThreshold: 5 }, [{ from: 0, to: 45 }], 300],
        expected: null,
      },
      {
        name: 'Passes a check exactly at the end of a stall',
        input: [{ initialDelay: 10, period: 10, failureThreshold: 3 }, [{ from: 0, to: 30 }], 300],
        expected: null,
      },
      {
        name: 'Fails a check exactly at the start of a stall',
        input: [{ initialDelay: 10, period: 10, failureThreshold: 2 }, [{ from: 60, to: 80 }], 300],
        expected: 70,
      },
      {
        name: 'Resets the count after a pass',
        input: [
          { initialDelay: 5, period: 5, failureThreshold: 3 },
          [
            { from: 5, to: 15 },
            { from: 20, to: 30 },
          ],
          300,
        ],
        expected: null,
      },
      {
        name: 'Stops checking after the horizon',
        input: [{ initialDelay: 10, period: 10, failureThreshold: 3 }, [{ from: 100, to: 200 }], 110],
        expected: null,
      },
      {
        name: 'Counts a check at the horizon',
        input: [{ initialDelay: 10, period: 10, failureThreshold: 2 }, [{ from: 100, to: 200 }], 110],
        expected: 110,
      },
    ],
  },
  {
    id: 'devops-graceful-drain',
    title: 'Drain requests before shutting down',
    category: 'DevOps',
    format: 'devops',
    context:
      'When an instance is told to stop, cutting it off at once fails the requests it is still working on. A graceful shutdown keeps accepting briefly while the load balancer stops sending traffic, then refuses new requests, lets the ones in progress finish, and gives up on any that are still running when the grace period ends.',
    prompt:
      'Implement gracefulDrain(requests, shutdownAt, policy). requests lists {id, arrives, finishes} in seconds, where finishes is when the request would complete if allowed. policy is {acceptForSeconds, graceSeconds}. The instance accepts requests that arrive before shutdownAt + acceptForSeconds, and rejects the rest. The deadline is shutdownAt + graceSeconds. An accepted request is "completed" if it finishes at or before the deadline, and "cut off" otherwise. The instance exits at the latest of shutdownAt + acceptForSeconds and the finish times of every accepted request, but no later than the deadline. Return {completed, rejected, cutOff, exitAt}, with ids in the order of requests. Do not change the inputs.',
    brief: {
      summary: 'Implement gracefulDrain(requests, shutdownAt, policy) and return {completed, rejected, cutOff, exitAt}.',
      rules: [
        'Accept requests that arrive before shutdownAt + acceptForSeconds; reject the rest.',
        'The deadline is shutdownAt + graceSeconds; an accepted request is completed if it finishes at or before it, and cut off otherwise.',
        'exitAt is the latest of shutdownAt + acceptForSeconds and the finish times of every accepted request, but no later than the deadline.',
        'List ids in the order of requests.',
      ],
      edgeCases: [
        'A request arriving exactly when accepting stops is rejected.',
        'A request finishing exactly at the deadline completes.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'gracefulDrain([{id: "a", arrives: 95, finishes: 98}, {id: "b", arrives: 99, finishes: 112}, {id: "c", arrives: 104, finishes: 106}, {id: "d", arrives: 101, finishes: 140}], 100, {acceptForSeconds: 5, graceSeconds: 30})',
      output: '{completed: ["a", "b", "c"], rejected: [], cutOff: ["d"], exitAt: 130}',
    },
    note: `Times are whole seconds passed in. acceptForSeconds is at most graceSeconds. Real shutdowns also close idle connections and stop background work, which this rep leaves out. ${notRun}`,
    vocabulary: [
      { term: 'Graceful shutdown', meaning: 'stopping a service by finishing the work in progress instead of cutting it off' },
      { term: 'Shutdown grace period', meaning: 'the time a stopping process gets to finish before it is forced to stop' },
    ],
    planPrompt:
      'In the example, why is c accepted although it arrives after shutdownAt, and why does the instance exit at 130 rather than when b finishes?',
    starter:
      'type InFlightRequest = { id: string; arrives: number; finishes: number }\n\nfunction gracefulDrain(requests: InFlightRequest[], shutdownAt: number, policy: { acceptForSeconds: number; graceSeconds: number }) {\n  return { completed: [] as string[], rejected: [] as string[], cutOff: [] as string[], exitAt: shutdownAt }\n}\n',
    functionName: 'gracefulDrain',
    preserveInput: true,
    hints: [
      'Work out two times first: when accepting stops and the deadline.',
      'Each request lands in exactly one of the three lists.',
      'A cut-off request keeps the instance busy until the deadline, so it counts toward exitAt too.',
    ],
    checks: [
      {
        name: 'Drains the example',
        input: [
          [
            { id: 'a', arrives: 95, finishes: 98 },
            { id: 'b', arrives: 99, finishes: 112 },
            { id: 'c', arrives: 104, finishes: 106 },
            { id: 'd', arrives: 101, finishes: 140 },
          ],
          100,
          { acceptForSeconds: 5, graceSeconds: 30 },
        ],
        expected: { completed: ['a', 'b', 'c'], rejected: [], cutOff: ['d'], exitAt: 130 },
      },
      {
        name: 'Rejects a request when accepting has stopped',
        input: [
          [
            { id: 'a', arrives: 104, finishes: 106 },
            { id: 'b', arrives: 105, finishes: 107 },
          ],
          100,
          { acceptForSeconds: 5, graceSeconds: 30 },
        ],
        expected: { completed: ['a'], rejected: ['b'], cutOff: [], exitAt: 106 },
      },
      {
        name: 'Completes a request that finishes at the deadline',
        input: [[{ id: 'a', arrives: 99, finishes: 130 }], 100, { acceptForSeconds: 5, graceSeconds: 30 }],
        expected: { completed: ['a'], rejected: [], cutOff: [], exitAt: 130 },
      },
      {
        name: 'Waits until accepting stops even when idle',
        input: [[{ id: 'a', arrives: 90, finishes: 95 }], 100, { acceptForSeconds: 5, graceSeconds: 30 }],
        expected: { completed: ['a'], rejected: [], cutOff: [], exitAt: 105 },
      },
      {
        name: 'Exits when the last request finishes',
        input: [
          [
            { id: 'a', arrives: 98, finishes: 117 },
            { id: 'b', arrives: 102, finishes: 109 },
          ],
          100,
          { acceptForSeconds: 5, graceSeconds: 30 },
        ],
        expected: { completed: ['a', 'b'], rejected: [], cutOff: [], exitAt: 117 },
      },
      {
        name: 'Stops accepting at once with no accept time',
        input: [
          [
            { id: 'a', arrives: 100, finishes: 101 },
            { id: 'b', arrives: 99, finishes: 103 },
          ],
          100,
          { acceptForSeconds: 0, graceSeconds: 10 },
        ],
        expected: { completed: ['b'], rejected: ['a'], cutOff: [], exitAt: 103 },
      },
      {
        name: 'Sorts each id into one list in request order',
        input: [
          [
            { id: 'r3', arrives: 120, finishes: 121 },
            { id: 'r1', arrives: 90, finishes: 200 },
            { id: 'r2', arrives: 100, finishes: 101 },
          ],
          100,
          { acceptForSeconds: 2, graceSeconds: 20 },
        ],
        expected: { completed: ['r2'], rejected: ['r3'], cutOff: ['r1'], exitAt: 120 },
      },
      {
        name: 'Exits when accepting stops with no requests',
        input: [[], 100, { acceptForSeconds: 5, graceSeconds: 30 }],
        expected: { completed: [], rejected: [], cutOff: [], exitAt: 105 },
      },
    ],
  },
  {
    id: 'devops-cron-field',
    title: 'Expand one cron field',
    category: 'DevOps',
    format: 'devops',
    context:
      'A cron schedule such as "*/15 9-17 * * 1-5" packs a lot into five short fields. Each field is a small language of its own: lists, ranges, and steps. Turning one field into the plain list of values it allows is the first step to reading or checking any schedule.',
    prompt:
      'Implement expandField(field, min, max). field is a list of parts separated by commas, with no spaces. Each part is "*" (every value from min to max), a number, a range "a-b" (a to b inclusive, with a not greater than b), or "*" or a range followed by "/s", which keeps every s-th value starting from the first one, such as "*/15" or "10-30/10". Numbers are written with digits only and must be from min to max, and s must be at least 1. Return the values the field allows, sorted from lowest to highest without repeats, or null if any part is not one of these forms or breaks a limit.',
    brief: {
      summary: 'Implement expandField(field, min, max) and return the sorted values, or null.',
      rules: [
        'Parts are separated by commas: "*", a number, a range "a-b" with a not greater than b, or "*" or a range followed by "/s".',
        '"/s" keeps every s-th value starting from the first one in its range, as in "*/15" or "10-30/10".',
        'Numbers are digits only and from min to max; s is at least 1.',
        'Return the values sorted without repeats, or null for any invalid part.',
      ],
      edgeCases: ['A single number with a step, such as "7/2", is invalid.', 'An empty part, as in "1,,2", is invalid.'],
    },
    example: { input: 'expandField("*/15", 0, 59)', output: '[0, 15, 30, 45]' },
    note: `Real cron tools accept more forms, such as names like MON and JAN; this rep uses only the forms above. ${notRun}`,
    vocabulary: [
      { term: 'Cron expression', meaning: 'five fields that say at which minutes, hours, days, months, and weekdays a job runs' },
      { term: 'Step value', meaning: 'the /s part of a cron field, which keeps every s-th value of a range' },
    ],
    planPrompt: 'What do "1-3,2-4", "30,5", "*/100" for minutes, and "5-1" each give? Which of them are invalid, and why?',
    starter:
      'function expandField(field: string, min: number, max: number): number[] | null {\n  // Handle one part at a time, collecting values in a Set.\n  return []\n}\n',
    functionName: 'expandField',
    hints: [
      'A regular expression such as /^(\\*|(\\d+)(-(\\d+))?)(\\/(\\d+))?$/ splits a part into its pieces.',
      'Work out a start, an end, and a step for every valid part, then loop.',
      'A step is allowed after "*" or a range, but not after a single number.',
    ],
    checks: [
      { name: 'Expands the example', input: ['*/15', 0, 59], expected: [0, 15, 30, 45] },
      { name: 'Expands "*"', input: ['*', 0, 6], expected: [0, 1, 2, 3, 4, 5, 6] },
      { name: 'Reads a single number', input: ['5', 0, 59], expected: [5] },
      { name: 'Reads a range', input: ['9-17', 0, 23], expected: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
      { name: 'Steps through a range', input: ['10-30/10', 0, 59], expected: [10, 20, 30] },
      { name: 'Sorts a list and removes repeats', input: ['30,5,1-3,2-4', 0, 59], expected: [1, 2, 3, 4, 5, 30] },
      { name: 'Starts a step from min', input: ['*/5', 1, 12], expected: [1, 6, 11] },
      { name: 'Allows a step larger than the range', input: ['*/100', 0, 59], expected: [0] },
      { name: 'Refuses a number out of range', input: ['60', 0, 59], expected: null },
      { name: 'Refuses a backwards range', input: ['5-1', 0, 59], expected: null },
      { name: 'Refuses a step of 0', input: ['*/0', 0, 59], expected: null },
      { name: 'Refuses a step after a single number', input: ['7/2', 0, 59], expected: null },
      { name: 'Refuses an empty part', input: ['1,,2', 0, 59], expected: null },
      { name: 'Refuses words and signs', input: ['MON', 0, 6], expected: null },
      { name: 'Refuses a range that ends out of range', input: ['1-32', 1, 31], expected: null },
    ],
  },
  {
    id: 'devops-cron-matches',
    title: 'Check whether a cron schedule matches a time',
    category: 'DevOps',
    format: 'devops',
    context:
      'A cron schedule runs a job at every minute that matches all five of its fields. The day fields have a surprising rule: when both the day of the month and the day of the week are restricted, a day matches if either one does, which catches people out when they write "the 13th, if it is a Friday".',
    prompt:
      'Implement cronMatches(expression, time). expression is five fields separated by single spaces: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-7, where 0 and 7 both mean Sunday). Each field is a comma-separated list of parts: "*", a number, a range "a-b", or "*" or a range followed by "/s" for every s-th value from the start of its range. time is {minute, hour, day, month, weekday}, with weekday 0 for Sunday. The minute, hour, and month must each be allowed by their field. For the day: if neither day field starts with "*", the day matches when the day of month or the weekday is allowed; otherwise both must be allowed. Return true or false. Expressions are valid.',
    brief: {
      summary: 'Implement cronMatches(expression, time) and return true or false.',
      rules: [
        'Fields: minute 0-59, hour 0-23, day of month 1-31, month 1-12, day of week 0-7 (0 and 7 are Sunday).',
        'Parts: "*", a number, "a-b", or "*" or a range followed by "/s"; separated by commas.',
        'Minute, hour, and month must each be allowed.',
        'If neither day field starts with "*", either day field may match; otherwise both must be allowed.',
      ],
      edgeCases: ['"*/2" starts with "*", so it does not switch on the either-day rule.', 'A day-of-week field of 7 matches Sunday.'],
    },
    example: {
      input: 'cronMatches("30 9 * * 1-5", {minute: 30, hour: 9, day: 19, month: 10, weekday: 1})',
      output: 'true',
    },
    note: `This follows the classic cron rule for the two day fields; some schedulers differ. time is passed in, so no clock or time zone is involved. ${notRun}`,
    vocabulary: [
      { term: 'Day of week', meaning: 'the fifth cron field, where 0 is Sunday and 6 is Saturday' },
      { term: 'Day of month', meaning: 'the third cron field, the date within the month from 1 to 31' },
    ],
    planPrompt:
      'Does "0 12 13 * 5" run on Friday the 6th, Monday the 13th, and Tuesday the 14th? Why might the person who wrote it be surprised?',
    starter:
      'type Time = { minute: number; hour: number; day: number; month: number; weekday: number }\n\nfunction cronMatches(expression: string, time: Time): boolean {\n  return false\n}\n',
    functionName: 'cronMatches',
    hints: [
      'Expand each field into its allowed values first, as you would for one field.',
      'Turn 7 into 0 in the day-of-week values before comparing.',
      'Decide the day rule from whether each day field starts with "*", not from its values.',
    ],
    checks: [
      { name: 'Matches a weekday time', input: ['30 9 * * 1-5', { minute: 30, hour: 9, day: 19, month: 10, weekday: 1 }], expected: true },
      { name: 'Refuses a weekend day', input: ['30 9 * * 1-5', { minute: 30, hour: 9, day: 24, month: 10, weekday: 6 }], expected: false },
      {
        name: 'Refuses the wrong minute',
        input: ['30 9 * * 1-5', { minute: 31, hour: 9, day: 19, month: 10, weekday: 1 }],
        expected: false,
      },
      {
        name: 'Matches either day when both are restricted',
        input: ['0 12 13 * 5', { minute: 0, hour: 12, day: 6, month: 11, weekday: 5 }],
        expected: true,
      },
      {
        name: 'Matches the date alone when both are restricted',
        input: ['0 12 13 * 5', { minute: 0, hour: 12, day: 13, month: 10, weekday: 2 }],
        expected: true,
      },
      {
        name: 'Refuses a day neither field allows',
        input: ['0 12 13 * 5', { minute: 0, hour: 12, day: 14, month: 10, weekday: 3 }],
        expected: false,
      },
      {
        name: 'Needs both days when one starts with "*"',
        input: ['0 12 */2 * 1', { minute: 0, hour: 12, day: 4, month: 10, weekday: 1 }],
        expected: false,
      },
      {
        name: 'Accepts both days when one starts with "*"',
        input: ['0 12 */2 * 1', { minute: 0, hour: 12, day: 3, month: 10, weekday: 1 }],
        expected: true,
      },
      { name: 'Treats 7 as Sunday', input: ['0 0 * * 7', { minute: 0, hour: 0, day: 25, month: 10, weekday: 0 }], expected: true },
      { name: 'Checks the month', input: ['0 0 1 1,7 *', { minute: 0, hour: 0, day: 1, month: 6, weekday: 1 }], expected: false },
      {
        name: 'Uses steps in the minute field',
        input: ['*/20 * * * *', { minute: 40, hour: 3, day: 2, month: 2, weekday: 1 }],
        expected: true,
      },
      {
        name: 'Refuses a minute between steps',
        input: ['*/20 * * * *', { minute: 50, hour: 3, day: 2, month: 2, weekday: 1 }],
        expected: false,
      },
      {
        name: 'Uses lists in the hour field',
        input: ['0 8,12,18 * * *', { minute: 0, hour: 13, day: 2, month: 2, weekday: 1 }],
        expected: false,
      },
    ],
  },
  {
    id: 'devops-local-to-utc',
    title: 'Turn a local time into an instant',
    category: 'DevOps',
    format: 'devops',
    context:
      'A schedule written as "02:30 in New York" is a wall-clock time, not one moment. When clocks spring forward, 02:30 does not happen at all that day; when they fall back, 01:30 happens twice, an hour apart. A scheduler has to know which case it is in before it can run anything.',
    prompt:
      'Implement localToUtc(local, zone). local is a wall-clock time "YYYY-MM-DDTHH:MM" and zone is an IANA time zone name such as "America/New_York". Find every instant, on a whole minute, whose local date and time in zone equal local. If there is none, return {status: "gap"}; if there is one, return {status: "ok", instant}; if there are two, return {status: "overlap", instants: [earlier, later]}. Write instants as Date.prototype.toISOString does, such as "2026-07-15T13:00:00.000Z". Read local times with Intl.DateTimeFormat and its timeZone option; never use the machine\'s own time zone.',
    brief: {
      summary: 'Implement localToUtc(local, zone) and return {status: "ok", instant}, {status: "gap"}, or {status: "overlap", instants}.',
      rules: [
        'Find every whole-minute instant whose local date and time in zone equal local ("YYYY-MM-DDTHH:MM").',
        'None gives {status: "gap"}, one gives {status: "ok", instant}, and two give {status: "overlap", instants: [earlier, later]}.',
        'Write instants with toISOString, such as "2026-07-15T13:00:00.000Z".',
        "Read local times with Intl.DateTimeFormat and its timeZone option, never the machine's time zone.",
      ],
      edgeCases: ['Some zones are offset by half an hour or shift by half an hour.', 'The local date can differ from the UTC date.'],
    },
    example: {
      input: 'localToUtc("2026-11-01T01:30", "America/New_York")',
      output: '{status: "overlap", instants: ["2026-11-01T05:30:00.000Z", "2026-11-01T06:30:00.000Z"]}',
    },
    note: `In these checks a zone changes its offset at most once within any two days. The answers use the time zone rules built into the JavaScript engine, which are the same in Node and Chromium for these dates. ${notRun}`,
    vocabulary: [
      {
        term: 'IANA time zone',
        meaning: 'a named set of clock rules, such as America/New_York, including when daylight saving time starts and ends',
      },
      {
        term: 'Daylight saving time',
        meaning: 'moving clocks forward in summer and back in winter, which skips an hour and repeats an hour each year',
      },
    ],
    planPrompt:
      "If you guess an instant by treating the local time as UTC, how far off can the guess be, and how can you correct it using the zone's offset near that time?",
    starter:
      "type Result = { status: 'ok'; instant: string } | { status: 'gap' } | { status: 'overlap'; instants: [string, string] }\n\nfunction localToUtc(local: string, zone: string): Result {\n  return { status: 'gap' }\n}\n",
    functionName: 'localToUtc',
    hints: [
      'Write a helper that takes an instant and returns its local year, month, day, hour, and minute in zone using formatToParts with hourCycle "h23".',
      'The offset at an instant is that local time read as if it were UTC, minus the instant. Each possible offset gives one candidate instant.',
      'Collect the offsets a day before, at, and a day after a first guess, and keep the candidates whose local time really equals local.',
    ],
    checks: [
      {
        name: 'Converts a summer time',
        input: ['2026-07-15T09:00', 'America/New_York'],
        expected: { status: 'ok', instant: '2026-07-15T13:00:00.000Z' },
      },
      {
        name: 'Converts a winter time',
        input: ['2026-01-15T09:00', 'America/New_York'],
        expected: { status: 'ok', instant: '2026-01-15T14:00:00.000Z' },
      },
      { name: 'Reports a time skipped in spring', input: ['2026-03-08T02:30', 'America/New_York'], expected: { status: 'gap' } },
      {
        name: 'Converts the first time after the jump',
        input: ['2026-03-08T03:00', 'America/New_York'],
        expected: { status: 'ok', instant: '2026-03-08T07:00:00.000Z' },
      },
      {
        name: 'Reports a time repeated in autumn',
        input: ['2026-11-01T01:30', 'America/New_York'],
        expected: { status: 'overlap', instants: ['2026-11-01T05:30:00.000Z', '2026-11-01T06:30:00.000Z'] },
      },
      {
        name: 'Converts the time just after the repeat',
        input: ['2026-11-01T02:00', 'America/New_York'],
        expected: { status: 'ok', instant: '2026-11-01T07:00:00.000Z' },
      },
      {
        name: 'Handles a half-hour offset',
        input: ['2026-10-19T09:00', 'Asia/Kolkata'],
        expected: { status: 'ok', instant: '2026-10-19T03:30:00.000Z' },
      },
      { name: 'Converts UTC itself', input: ['2026-10-19T09:00', 'UTC'], expected: { status: 'ok', instant: '2026-10-19T09:00:00.000Z' } },
      {
        name: 'Repeats an hour in the southern autumn',
        input: ['2026-04-05T02:30', 'Australia/Sydney'],
        expected: { status: 'overlap', instants: ['2026-04-04T15:30:00.000Z', '2026-04-04T16:30:00.000Z'] },
      },
      { name: 'Skips an hour in the southern spring', input: ['2026-10-04T02:30', 'Australia/Sydney'], expected: { status: 'gap' } },
      {
        name: 'Repeats half an hour where clocks move by 30 minutes',
        input: ['2026-04-05T01:45', 'Australia/Lord_Howe'],
        expected: { status: 'overlap', instants: ['2026-04-04T14:45:00.000Z', '2026-04-04T15:15:00.000Z'] },
      },
      {
        name: 'Crosses the date line',
        input: ['2026-12-31T23:30', 'Pacific/Kiritimati'],
        expected: { status: 'ok', instant: '2026-12-31T09:30:00.000Z' },
      },
    ],
  },
  {
    id: 'devops-cron-next-utc',
    title: 'Find the next run of a cron schedule',
    category: 'DevOps',
    format: 'devops',
    context:
      'Before a scheduled job is saved, a good tool shows when it will next run, so a mistake such as "every minute of 9 a.m." instead of "9:00" is caught at once. In UTC every minute exists exactly once, so the next run is the first minute after now that matches.',
    prompt:
      'Implement nextRunUtc(expression, after). expression is five fields separated by single spaces: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-7, where 0 and 7 both mean Sunday). Each field is a comma-separated list of parts: "*", a number, a range "a-b", or "*" or a range followed by "/s" for every s-th value from the start of its range. A minute matches when its minute, hour, and month are allowed and its day matches: if neither day field starts with "*", the day of month or the weekday must be allowed; otherwise both must be. after is an ISO 8601 time ending in "Z". Return the first whole minute strictly after after that matches, read in UTC, written as Date.prototype.toISOString does. Look at most 366 days after after; return null if no minute in that time matches. Expressions are valid.',
    brief: {
      summary: 'Implement nextRunUtc(expression, after) and return the next matching minute in UTC, or null.',
      rules: [
        'Fields: minute 0-59, hour 0-23, day of month 1-31, month 1-12, day of week 0-7 (0 and 7 are Sunday); parts are "*", a number, "a-b", or "*" or a range with "/s".',
        'If neither day field starts with "*", either day field may match; otherwise both must be allowed.',
        'after is an ISO 8601 time ending in "Z"; return the first whole minute strictly after it that matches, read in UTC, written with toISOString.',
        'Look at most 366 days ahead; return null if nothing matches.',
      ],
      edgeCases: ['A time exactly on a matching minute is not "after" itself.', 'Seconds in after round up to the next whole minute.'],
    },
    example: { input: 'nextRunUtc("30 9 * * 1-5", "2026-10-23T10:00:00Z")', output: '"2026-10-26T09:30:00.000Z"' },
    note: `after is passed in, so your function never reads a clock, and everything is in UTC. A schedule such as February 29 can be more than 366 days away, which gives null here. ${notRun}`,
    vocabulary: [
      { term: 'Scheduled job', meaning: 'work that runs automatically at set times, such as a nightly backup' },
      { term: 'UTC', meaning: 'Coordinated Universal Time, the reference time with no time zone offset and no daylight saving' },
    ],
    planPrompt:
      'Starting from 2026-10-23T10:00:00Z, a Friday, when is the next run of "30 9 * * 1-5"? Which search is simpler: minute by minute, or day by day?',
    starter: 'function nextRunUtc(expression: string, after: string): string | null {\n  return null\n}\n',
    functionName: 'nextRunUtc',
    hints: [
      'Expand the five fields into sets once, before searching.',
      'Start from the next whole minute: Math.floor(ms / 60000) * 60000 + 60000.',
      'Skipping a whole day when the day or month does not match keeps a 366-day search fast.',
    ],
    checks: [
      { name: 'Skips the weekend in the example', input: ['30 9 * * 1-5', '2026-10-23T10:00:00Z'], expected: '2026-10-26T09:30:00.000Z' },
      { name: 'Finds a run later the same day', input: ['30 9 * * 1-5', '2026-10-19T08:00:00Z'], expected: '2026-10-19T09:30:00.000Z' },
      { name: 'Never returns after itself', input: ['30 9 * * *', '2026-10-19T09:30:00Z'], expected: '2026-10-20T09:30:00.000Z' },
      {
        name: 'Rounds seconds up to the next minute',
        input: ['59 23 31 12 *', '2026-12-31T23:58:30Z'],
        expected: '2026-12-31T23:59:00.000Z',
      },
      { name: 'Moves into the next month', input: ['0 0 1 * *', '2026-10-19T08:00:00Z'], expected: '2026-11-01T00:00:00.000Z' },
      {
        name: 'Uses either day field when both are set',
        input: ['0 12 13 * 5', '2026-10-19T08:00:00Z'],
        expected: '2026-10-23T12:00:00.000Z',
      },
      { name: 'Steps through minutes', input: ['*/20 * * * *', '2026-10-19T08:41:10Z'], expected: '2026-10-19T09:00:00.000Z' },
      { name: 'Treats 7 as Sunday', input: ['0 6 * * 7', '2026-10-19T08:00:00Z'], expected: '2026-10-25T06:00:00.000Z' },
      { name: 'Crosses into a new year', input: ['0 0 1 1 *', '2026-10-19T08:00:00Z'], expected: '2027-01-01T00:00:00.000Z' },
      { name: 'Returns null beyond 366 days', input: ['0 0 29 2 *', '2026-10-19T08:00:00Z'], expected: null },
    ],
  },
  {
    id: 'devops-cron-next-zone',
    title: 'Find the next run in a time zone',
    category: 'DevOps',
    format: 'devops',
    context:
      'A team schedules a report for 01:30 New York time. Twice a year the clocks change: one night 02:30 never happens, and another night 01:30 happens twice. The scheduler has to state what it does in both cases, and then find the next run from any moment.',
    prompt:
      'Implement nextRun(expression, after, zone). expression is five fields separated by single spaces: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-7, where 0 and 7 both mean Sunday). Each field is a comma-separated list of parts: "*", a number, a range "a-b", or "*" or a range followed by "/s" for every s-th value from the start of its range. A local time matches when its minute, hour, and month are allowed and its day matches: if neither day field starts with "*", the day of month or the weekday must be allowed; otherwise both must be. Times are local wall-clock times in the IANA time zone zone. A local time that does not exist, because clocks jumped over it, never runs. A local time that happens twice, because clocks were set back, runs only at the earlier of its two instants, even if that instant is before after. after is an ISO 8601 time ending in "Z". Return the first run strictly after after, on a whole minute, written as Date.prototype.toISOString does; look at most 8 days after after and return null if there is none. Read local times with Intl.DateTimeFormat and its timeZone option, never the machine\'s own time zone.',
    brief: {
      summary: 'Implement nextRun(expression, after, zone) and return the next run as an instant, or null.',
      rules: [
        'Fields: minute 0-59, hour 0-23, day of month 1-31, month 1-12, day of week 0-7 (0 and 7 are Sunday); parts are "*", a number, "a-b", or "*" or a range with "/s"; either day field may match only if neither starts with "*".',
        'Match local wall-clock times in zone, read with Intl.DateTimeFormat and its timeZone option.',
        'A local time skipped by a clock change never runs; a local time that happens twice runs only at the earlier instant, even if that is before after.',
        'after is an ISO 8601 time ending in "Z"; return the first run strictly after it, within 8 days, written with toISOString, or null.',
      ],
      edgeCases: [
        'On the night clocks go back, an hourly job skips the repeated hour.',
        'Zones with half-hour offsets still run on whole local minutes.',
      ],
    },
    example: { input: 'nextRun("30 2 * * *", "2026-03-07T12:00:00Z", "America/New_York")', output: '"2026-03-09T06:30:00.000Z"' },
    note: `In these checks a zone changes its offset at most once within any two days, and the answers use the time zone rules built into the JavaScript engine. after and zone are passed in, so your function never reads the clock or the machine's time zone. ${notRun}`,
    vocabulary: [
      { term: 'Wall-clock time', meaning: 'the time shown on a local clock, which can skip or repeat when daylight saving time changes' },
      { term: 'Instant', meaning: 'one exact moment, the same everywhere, usually written in UTC' },
    ],
    planPrompt:
      'For "30 1 * * *" in New York, what are the next runs after 2026-10-31T12:00:00Z and after 2026-11-01T06:20:00Z, and why is 2026-11-01T06:30:00Z never a run?',
    starter: 'function nextRun(expression: string, after: string, zone: string): string | null {\n  return null\n}\n',
    functionName: 'nextRun',
    hints: [
      'Create one Intl.DateTimeFormat for the zone, with hourCycle "h23", and reuse it; reading parts with formatToParts gives the local fields.',
      'Stepping one minute at a time works: a skipped local time is never produced, and a local time no later than one you have already seen is a repeat.',
      'To know which local times already happened before after, start following the local clock a day before after, but only return instants after it.',
    ],
    checks: [
      {
        name: 'Skips a time clocks jump over',
        input: ['30 2 * * *', '2026-03-07T12:00:00Z', 'America/New_York'],
        expected: '2026-03-09T06:30:00.000Z',
      },
      {
        name: 'Runs at the first of two repeated times',
        input: ['30 1 * * *', '2026-10-31T12:00:00Z', 'America/New_York'],
        expected: '2026-11-01T05:30:00.000Z',
      },
      {
        name: 'Does not run the repeat later that night',
        input: ['30 1 * * *', '2026-11-01T05:45:00Z', 'America/New_York'],
        expected: '2026-11-02T06:30:00.000Z',
      },
      {
        name: 'Knows the repeat already ran before after',
        input: ['30 1 * * *', '2026-11-01T06:20:00Z', 'America/New_York'],
        expected: '2026-11-02T06:30:00.000Z',
      },
      {
        name: 'Skips the repeated hour for an hourly job',
        input: ['0 * * * *', '2026-11-01T05:30:00Z', 'America/New_York'],
        expected: '2026-11-01T07:00:00.000Z',
      },
      {
        name: 'Reads weekdays in the zone',
        input: ['30 9 * * 1-5', '2026-10-23T14:00:00Z', 'America/New_York'],
        expected: '2026-10-26T13:30:00.000Z',
      },
      {
        name: 'Runs on a half-hour offset',
        input: ['0 9 * * *', '2026-10-19T08:00:00Z', 'Asia/Kolkata'],
        expected: '2026-10-20T03:30:00.000Z',
      },
      {
        name: 'Skips a southern spring gap',
        input: ['30 2 * * *', '2026-10-03T12:00:00Z', 'Australia/Sydney'],
        expected: '2026-10-04T15:30:00.000Z',
      },
      {
        name: 'Uses the local date for the day of week',
        input: ['0 0 * * 0', '2026-10-24T23:30:00Z', 'Asia/Tokyo'],
        expected: '2026-10-31T15:00:00.000Z',
      },
      {
        name: 'Starts from the local date of after',
        input: ['30 23 * * *', '2026-10-20T02:00:00Z', 'America/New_York'],
        expected: '2026-10-20T03:30:00.000Z',
      },
      {
        name: 'Never returns after itself',
        input: ['30 9 * * 1-5', '2026-10-19T13:30:00Z', 'America/New_York'],
        expected: '2026-10-20T13:30:00.000Z',
      },
      { name: 'Returns null beyond 8 days', input: ['0 0 1 * *', '2026-10-19T08:00:00Z', 'America/New_York'], expected: null },
    ],
  },
  {
    id: 'devops-percentile',
    title: 'Find the 95th percentile of response times',
    category: 'DevOps',
    format: 'devops',
    context:
      'An average hides the slow requests that users notice: 99 fast requests and one 10-second request still average under a second. Teams watch percentiles instead. The 95th percentile, p95, is the time that 95% of requests were at or under, and there are several ways to compute it, so the method has to be stated.',
    prompt:
      'Implement percentile(values, p) with the nearest-rank method. values is a list of response times in milliseconds and p is a whole number from 1 to 100. Sort a copy of values from smallest to largest as numbers. The rank is p × n / 100 rounded up, where n is the number of values, and the answer is the value at that rank, counting from 1. Return null when values is empty. Do not change values.',
    brief: {
      summary: 'Implement percentile(values, p) with the nearest-rank method, where p is a whole number from 1 to 100.',
      rules: [
        'Sort a copy of values from smallest to largest as numbers.',
        'The rank is p × n / 100 rounded up, where n is the number of values.',
        'Return the value at that rank, counting from 1.',
        'Return null when values is empty.',
      ],
      edgeCases: ['The answer is always one of the values; it never falls between two.', 'Do not change values.'],
    },
    example: { input: 'percentile([100, 120, 130, 150, 200, 900, 110], 95)', output: '900' },
    note: `Other tools interpolate between two values, so their p95 can differ from this one; always say which method a number uses. values has at most 100,000 entries. ${notRun}`,
    vocabulary: [
      { term: 'Percentile', meaning: 'the value that a given share of measurements are at or under, such as p95 for 95%' },
      { term: 'Latency', meaning: 'how long a request takes from start to finish' },
    ],
    planPrompt: 'What is p50 of [10, 20, 30, 40] by nearest rank, and why is it not 25? What is p95 of seven values?',
    starter: 'function percentile(values: number[], p: number): number | null {\n  return null\n}\n',
    functionName: 'percentile',
    preserveInput: true,
    hints: [
      'Sort a copy with a compare function, (a, b) => a - b; the default sort compares text.',
      'Math.ceil rounds the rank up.',
      'The rank counts from 1, so the index is rank - 1.',
    ],
    checks: [
      { name: 'Finds p95 in the example', input: [[100, 120, 130, 150, 200, 900, 110], 95], expected: 900 },
      { name: 'Picks a value rather than averaging two', input: [[10, 20, 30, 40], 50], expected: 20 },
      {
        name: 'Finds p95 of twenty values',
        input: [[7, 3, 19, 1, 15, 11, 20, 2, 9, 13, 5, 17, 4, 8, 6, 10, 12, 14, 16, 18], 95],
        expected: 19,
      },
      { name: 'Finds p90 of ten values', input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90], expected: 9 },
      { name: 'Returns the largest value for p100', input: [[5, 3, 9], 100], expected: 9 },
      { name: 'Returns the smallest value for p1', input: [[5, 3, 9], 1], expected: 3 },
      { name: 'Sorts as numbers', input: [[9, 10, 100, 2], 25], expected: 2 },
      { name: 'Counts repeated values', input: [[5, 5, 5, 1], 50], expected: 5 },
      { name: 'Handles one value', input: [[42], 95], expected: 42 },
      { name: 'Returns null with no values', input: [[], 95], expected: null },
    ],
  },
  {
    id: 'devops-error-budget',
    title: 'Measure an error budget',
    category: 'DevOps',
    format: 'devops',
    context:
      'A service level objective (SLO) of 99.9% success means 0.1% of requests may fail: that share is the error budget. Spending it slowly is fine; spending it fast means the budget will run out early. The burn rate says how fast: 1 spends it exactly over the SLO period, and 10 spends it ten times as fast.',
    prompt:
      'Implement errorBudget(requests, errors, targetBasisPoints). requests and errors are whole numbers for a period; targetBasisPoints is the SLO target in hundredths of a percent, so 9990 means 99.90%. The budget share is 10000 - targetBasisPoints basis points. allowedErrors is requests × (10000 - targetBasisPoints) / 10000, rounded down. remainingErrors is allowedErrors - errors, which can be negative. burnRate is errors × 10000 / (requests × (10000 - targetBasisPoints)), rounded down to two decimal places; compute it in whole numbers as Math.floor(errors × 1000000 / (requests × (10000 - targetBasisPoints))) / 100. With no requests, every value is 0. Return {allowedErrors, remainingErrors, burnRate}.',
    brief: {
      summary: 'Implement errorBudget(requests, errors, targetBasisPoints) and return {allowedErrors, remainingErrors, burnRate}.',
      rules: [
        'targetBasisPoints is the target in hundredths of a percent: 9990 means 99.90%, so the budget is 10000 - targetBasisPoints basis points.',
        'allowedErrors is requests × (10000 - targetBasisPoints) / 10000, rounded down; remainingErrors is allowedErrors - errors and can be negative.',
        'burnRate is Math.floor(errors × 1000000 / (requests × (10000 - targetBasisPoints))) / 100.',
        'With no requests, every value is 0.',
      ],
      edgeCases: ['Spending the budget exactly gives a burn rate of 1.', 'targetBasisPoints is below 10000.'],
    },
    example: { input: 'errorBudget(1000000, 2000, 9990)', output: '{allowedErrors: 1000, remainingErrors: -1000, burnRate: 2}' },
    note: `Basis points keep the target a whole number, so 99.9% never becomes 99.90000000000001 in the arithmetic. requests is at most 1,000,000,000. ${notRun}`,
    vocabulary: [
      { term: 'Service level objective', meaning: 'a target for how often a service must succeed, such as 99.9% of requests over 30 days' },
      { term: 'Error budget', meaning: 'the share of requests an SLO allows to fail, which a team may spend on risk' },
    ],
    planPrompt:
      'With a 99.9% target and 1,000,000 requests, how many errors are allowed, and what burn rate do 500, 1,000, and 2,000 errors give?',
    starter:
      'function errorBudget(requests: number, errors: number, targetBasisPoints: number) {\n  return { allowedErrors: 0, remainingErrors: 0, burnRate: 0 }\n}\n',
    functionName: 'errorBudget',
    hints: [
      'Work out the budget share in basis points first: 10000 - targetBasisPoints.',
      'Multiply before dividing, and round down with Math.floor.',
      'Return early for zero requests, so you never divide by zero.',
    ],
    checks: [
      {
        name: 'Measures the example',
        input: [1000000, 2000, 9990],
        expected: { allowedErrors: 1000, remainingErrors: -1000, burnRate: 2 },
      },
      {
        name: 'Burns slowly under budget',
        input: [1000000, 500, 9990],
        expected: { allowedErrors: 1000, remainingErrors: 500, burnRate: 0.5 },
      },
      {
        name: 'Burns at exactly 1 on budget',
        input: [1000000, 1000, 9990],
        expected: { allowedErrors: 1000, remainingErrors: 0, burnRate: 1 },
      },
      { name: 'Rounds the burn rate down', input: [3, 2, 9900], expected: { allowedErrors: 0, remainingErrors: -2, burnRate: 66.66 } },
      { name: 'Rounds allowed errors down', input: [1999, 0, 9990], expected: { allowedErrors: 1, remainingErrors: 1, burnRate: 0 } },
      { name: 'Uses the supplied target', input: [20000, 300, 9950], expected: { allowedErrors: 100, remainingErrors: -200, burnRate: 3 } },
      {
        name: 'Keeps the target exact',
        input: [100000, 144, 9990],
        expected: { allowedErrors: 100, remainingErrors: -44, burnRate: 1.44 },
      },
      { name: 'Returns zeros with no requests', input: [0, 0, 9990], expected: { allowedErrors: 0, remainingErrors: 0, burnRate: 0 } },
    ],
  },
  {
    id: 'devops-route-latency',
    title: 'Find routes over their latency target',
    category: 'DevOps',
    format: 'devops',
    context:
      'Each API route has its own latency target: a search can be slower than a health check. A daily report lists the routes whose p95 went over their target, so the team knows where to look first.',
    prompt:
      'Implement slowRoutes(samples, targets). samples lists {route, ms} measurements; targets maps a route to its p95 target in milliseconds. For each route in targets that has at least one sample, compute its p95 with the nearest-rank method: sort its times from smallest to largest, take the rank 95 × n / 100 rounded up, and use the time at that rank counting from 1. Report {route, p95, target} for every route whose p95 is greater than its target, sorted by route with the default sort. Ignore samples for routes with no target, and routes with no samples. Do not change the inputs.',
    brief: {
      summary: 'Implement slowRoutes(samples, targets) and return the routes whose p95 is over target.',
      rules: [
        'For each route in targets with samples, compute p95 by nearest rank: sort, take rank 95 × n / 100 rounded up, counting from 1.',
        'Report {route, p95, target} when p95 is greater than the target.',
        'Sort the report by route with the default sort; ignore routes without a target or without samples.',
      ],
      edgeCases: ['A p95 equal to the target is not over it.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'slowRoutes([{route: "/search", ms: 300}, {route: "/search", ms: 900}, {route: "/health", ms: 5}], {"/search": 500, "/health": 50})',
      output: '[{route: "/search", p95: 900, target: 500}]',
    },
    note: `There are at most 100,000 samples. Percentiles from different routes cannot be combined into one overall percentile; each route is computed from its own samples. ${notRun}`,
    vocabulary: [
      { term: 'Latency target', meaning: 'the response time a route is expected to stay under, often stated for p95 or p99' },
      { term: 'API route', meaning: 'one kind of request an API answers, such as GET /search' },
    ],
    planPrompt: "Why can you not average each route's p95 to get the whole service's p95? How will you group the samples by route?",
    starter:
      'function slowRoutes(samples: { route: string; ms: number }[], targets: Record<string, number>): { route: string; p95: number; target: number }[] {\n  return []\n}\n',
    functionName: 'slowRoutes',
    preserveInput: true,
    hints: [
      'Group the times in a Map from route to a list.',
      'Go through the routes of targets in sorted order, so the report comes out sorted.',
      'Use the same nearest-rank steps for every route.',
    ],
    checks: [
      {
        name: 'Reports the slow route in the example',
        input: [
          [
            { route: '/search', ms: 300 },
            { route: '/search', ms: 900 },
            { route: '/health', ms: 5 },
          ],
          { '/search': 500, '/health': 50 },
        ],
        expected: [{ route: '/search', p95: 900, target: 500 }],
      },
      {
        name: 'Uses the nearest rank for each route',
        input: [
          [
            { route: '/a', ms: 40 },
            { route: '/a', ms: 10 },
            { route: '/a', ms: 500 },
            { route: '/a', ms: 30 },
            { route: '/a', ms: 60 },
            { route: '/a', ms: 20 },
            { route: '/a', ms: 50 },
          ],
          { '/a': 100 },
        ],
        expected: [{ route: '/a', p95: 500, target: 100 }],
      },
      {
        name: 'Leaves out a route exactly at its target',
        input: [[{ route: '/a', ms: 200 }], { '/a': 200 }],
        expected: [],
      },
      {
        name: 'Sorts the report by route',
        input: [
          [
            { route: '/z', ms: 900 },
            { route: '/b', ms: 900 },
            { route: '/m', ms: 900 },
          ],
          { '/z': 100, '/b': 100, '/m': 100 },
        ],
        expected: [
          { route: '/b', p95: 900, target: 100 },
          { route: '/m', p95: 900, target: 100 },
          { route: '/z', p95: 900, target: 100 },
        ],
      },
      {
        name: 'Ignores routes without a target',
        input: [[{ route: '/admin', ms: 5000 }], { '/a': 100 }],
        expected: [],
      },
      {
        name: 'Ignores targets without samples',
        input: [[{ route: '/a', ms: 50 }], { '/a': 100, '/b': 1 }],
        expected: [],
      },
      {
        name: "Keeps each route's samples apart",
        input: [
          [
            { route: '/fast', ms: 10 },
            { route: '/slow', ms: 800 },
            { route: '/fast', ms: 12 },
          ],
          { '/fast': 20, '/slow': 1000 },
        ],
        expected: [],
      },
    ],
  },
  {
    id: 'devops-burn-alert',
    title: 'Page on a fast error-budget burn',
    category: 'DevOps',
    format: 'devops',
    context:
      'An alert on the error rate of the last few minutes pages people for every blip; an alert on the last hour pages long after a problem started and keeps paging after it has ended. A common rule needs both: the budget must be burning fast over a long window and over a short one.',
    prompt:
      "Implement burnAlert(minutes, policy). minutes lists {requests, errors} for each minute, oldest first. policy is {targetBasisPoints, longMinutes, shortMinutes, threshold}. The long window is the last longMinutes entries (or all of them if there are fewer), and the short window the last shortMinutes. A window's burn rate is Math.floor(errors × 1000000 / (requests × (10000 - targetBasisPoints))) / 100 over its summed requests and errors, or 0 if it has no requests. Return {longBurn, shortBurn, page}, where page is true when both burn rates are at least threshold. Do not change the inputs.",
    brief: {
      summary: 'Implement burnAlert(minutes, policy) and return {longBurn, shortBurn, page}.',
      rules: [
        'The long window is the last longMinutes entries (all of them if fewer); the short window is the last shortMinutes.',
        "A window's burn rate is Math.floor(errors × 1000000 / (requests × (10000 - targetBasisPoints))) / 100 over its sums, or 0 with no requests.",
        'page is true when both burn rates are at least threshold.',
      ],
      edgeCases: ['A burn rate equal to threshold pages.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'burnAlert([{requests: 1000, errors: 0}, {requests: 1000, errors: 30}, {requests: 1000, errors: 20}], {targetBasisPoints: 9990, longMinutes: 3, shortMinutes: 1, threshold: 14.4})',
      output: '{longBurn: 16.66, shortBurn: 20, page: true}',
    },
    note: `The windows here count entries, one per minute, so a missing minute is simply absent. threshold may have two decimal places. ${notRun}`,
    vocabulary: [
      { term: 'Burn rate', meaning: 'how fast an error budget is being spent; 1 spends it exactly over the SLO period' },
      { term: 'On-call page', meaning: 'an alert that wakes someone up because it needs action now' },
    ],
    planPrompt: 'A 2-minute spike of errors ended 20 minutes ago. Which window still shows it, and why should that not page anyone now?',
    starter:
      'type Minute = { requests: number; errors: number }\ntype Policy = { targetBasisPoints: number; longMinutes: number; shortMinutes: number; threshold: number }\n\nfunction burnAlert(minutes: Minute[], policy: Policy) {\n  return { longBurn: 0, shortBurn: 0, page: false }\n}\n',
    functionName: 'burnAlert',
    preserveInput: true,
    hints: [
      'slice(-count) takes the last entries of a list, or all of them when there are fewer.',
      'Sum requests and errors over a window before working out its burn rate.',
      'Both windows must be at or over the threshold.',
    ],
    checks: [
      {
        name: 'Pages in the example',
        input: [
          [
            { requests: 1000, errors: 0 },
            { requests: 1000, errors: 30 },
            { requests: 1000, errors: 20 },
          ],
          { targetBasisPoints: 9990, longMinutes: 3, shortMinutes: 1, threshold: 14.4 },
        ],
        expected: { longBurn: 16.66, shortBurn: 20, page: true },
      },
      {
        name: 'Does not page for a problem that has ended',
        input: [
          [
            { requests: 1000, errors: 60 },
            { requests: 1000, errors: 60 },
            { requests: 1000, errors: 0 },
          ],
          { targetBasisPoints: 9990, longMinutes: 3, shortMinutes: 1, threshold: 14.4 },
        ],
        expected: { longBurn: 40, shortBurn: 0, page: false },
      },
      {
        name: 'Does not page for a short blip',
        input: [
          [
            { requests: 1000, errors: 0 },
            { requests: 1000, errors: 0 },
            { requests: 1000, errors: 0 },
            { requests: 1000, errors: 30 },
          ],
          { targetBasisPoints: 9990, longMinutes: 4, shortMinutes: 1, threshold: 14.4 },
        ],
        expected: { longBurn: 7.5, shortBurn: 30, page: false },
      },
      {
        name: 'Pages at exactly the threshold',
        input: [[{ requests: 10000, errors: 144 }], { targetBasisPoints: 9990, longMinutes: 60, shortMinutes: 5, threshold: 14.4 }],
        expected: { longBurn: 14.4, shortBurn: 14.4, page: true },
      },
      {
        name: 'Uses every minute when there are fewer than the long window',
        input: [
          [
            { requests: 500, errors: 10 },
            { requests: 500, errors: 0 },
          ],
          { targetBasisPoints: 9990, longMinutes: 60, shortMinutes: 1, threshold: 1 },
        ],
        expected: { longBurn: 10, shortBurn: 0, page: false },
      },
      {
        name: 'Sums a window before dividing',
        input: [
          [
            { requests: 100, errors: 10 },
            { requests: 9900, errors: 0 },
          ],
          { targetBasisPoints: 9900, longMinutes: 2, shortMinutes: 2, threshold: 2 },
        ],
        expected: { longBurn: 0.1, shortBurn: 0.1, page: false },
      },
      {
        name: 'Treats a window with no requests as 0',
        input: [[{ requests: 0, errors: 0 }], { targetBasisPoints: 9990, longMinutes: 5, shortMinutes: 1, threshold: 1 }],
        expected: { longBurn: 0, shortBurn: 0, page: false },
      },
    ],
  },
  {
    id: 'devops-alert-hysteresis',
    title: 'Keep an alert from flapping',
    category: 'DevOps',
    format: 'devops',
    context:
      'A value that hovers around an alert limit makes a simple alert fire and resolve again and again, and people learn to ignore it. Two fixes work together: require the value to stay bad for several samples before firing, and require it to fall clearly below a lower limit for several samples before resolving.',
    prompt:
      'Implement alertEvents(values, policy). values lists one measurement per minute, in order. policy is {fireAt, resolveBelow, fireAfter, resolveAfter}, with resolveBelow less than fireAt. The alert starts resolved. While resolved, count values in a row that are at least fireAt; any other value resets the count; when the count reaches fireAfter, the alert fires at that position. While firing, count values in a row that are below resolveBelow; any other value resets the count; when the count reaches resolveAfter, the alert resolves at that position. Each change starts its count from 0 again. Return the changes as {at, state}, with at counting from 0 and state "firing" or "resolved", in order. Do not change the inputs.',
    brief: {
      summary: 'Implement alertEvents(values, policy) and return each change as {at, state}.',
      rules: [
        'Start resolved. While resolved, fire when fireAfter values in a row are at least fireAt.',
        'While firing, resolve when resolveAfter values in a row are below resolveBelow.',
        'A value that breaks a run resets its count, and every change starts the counts again.',
        'Return {at, state} for each change, with at counting from 0.',
      ],
      edgeCases: [
        'A value equal to resolveBelow is not below it.',
        'A value between the two limits keeps a firing alert firing.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input: 'alertEvents([92, 95, 96, 91, 85, 70, 72, 95], {fireAt: 90, resolveBelow: 80, fireAfter: 3, resolveAfter: 2})',
      output: '[{at: 2, state: "firing"}, {at: 6, state: "resolved"}]',
    },
    note: `Values are whole numbers, such as a CPU percentage; the limits and counts are whole numbers of at least 1. ${notRun}`,
    vocabulary: [
      { term: 'Flapping alert', meaning: 'an alert that fires and resolves over and over because a value hovers around its limit' },
      { term: 'Hysteresis', meaning: 'using a lower limit to turn something off than to turn it on, so it does not switch back and forth' },
    ],
    planPrompt:
      'With fire at 90 and resolve below 80, what does a value of 85 do to a firing alert, and what does it do to a resolved one?',
    starter:
      'type Policy = { fireAt: number; resolveBelow: number; fireAfter: number; resolveAfter: number }\n\nfunction alertEvents(values: number[], policy: Policy): { at: number; state: string }[] {\n  return []\n}\n',
    functionName: 'alertEvents',
    preserveInput: true,
    hints: [
      'Keep the state and one count; what the count means depends on the state.',
      'Reset the count whenever the state changes.',
      'Compare with >= for firing and < for resolving.',
    ],
    checks: [
      {
        name: 'Fires and resolves in the example',
        input: [[92, 95, 96, 91, 85, 70, 72, 95], { fireAt: 90, resolveBelow: 80, fireAfter: 3, resolveAfter: 2 }],
        expected: [
          { at: 2, state: 'firing' },
          { at: 6, state: 'resolved' },
        ],
      },
      {
        name: 'Ignores a short spike',
        input: [[95, 95, 50, 95, 95], { fireAt: 90, resolveBelow: 80, fireAfter: 3, resolveAfter: 2 }],
        expected: [],
      },
      {
        name: 'Stays firing between the limits',
        input: [[95, 95, 85, 88, 82, 89, 84], { fireAt: 90, resolveBelow: 80, fireAfter: 2, resolveAfter: 1 }],
        expected: [{ at: 1, state: 'firing' }],
      },
      {
        name: 'Restarts the resolve count on a value between the limits',
        input: [[95, 70, 85, 70, 70], { fireAt: 90, resolveBelow: 80, fireAfter: 1, resolveAfter: 2 }],
        expected: [
          { at: 0, state: 'firing' },
          { at: 4, state: 'resolved' },
        ],
      },
      {
        name: 'Counts a value exactly at fireAt',
        input: [[90, 90], { fireAt: 90, resolveBelow: 80, fireAfter: 2, resolveAfter: 1 }],
        expected: [{ at: 1, state: 'firing' }],
      },
      {
        name: 'Does not count a value exactly at resolveBelow',
        input: [[95, 80, 79], { fireAt: 90, resolveBelow: 80, fireAfter: 1, resolveAfter: 1 }],
        expected: [
          { at: 0, state: 'firing' },
          { at: 2, state: 'resolved' },
        ],
      },
      {
        name: 'Fires again after resolving',
        input: [[95, 50, 95], { fireAt: 90, resolveBelow: 80, fireAfter: 1, resolveAfter: 1 }],
        expected: [
          { at: 0, state: 'firing' },
          { at: 1, state: 'resolved' },
          { at: 2, state: 'firing' },
        ],
      },
      {
        name: 'Starts counting again after a change',
        input: [[95, 95, 95, 60, 60, 95, 95], { fireAt: 90, resolveBelow: 80, fireAfter: 2, resolveAfter: 2 }],
        expected: [
          { at: 1, state: 'firing' },
          { at: 4, state: 'resolved' },
          { at: 6, state: 'firing' },
        ],
      },
      { name: 'Handles no values', input: [[], { fireAt: 90, resolveBelow: 80, fireAfter: 1, resolveAfter: 1 }], expected: [] },
    ],
  },
  {
    id: 'devops-incident-timeline',
    title: 'Build an incident timeline',
    category: 'DevOps',
    format: 'devops',
    context:
      "After an incident, events come from many places: application logs in UTC, a load balancer in another offset, and the team's chat in local time. Some log lines were shipped twice. Before anyone can say what happened, the events have to be put on one clock and in one order.",
    prompt:
      'Implement incidentTimeline(sources). sources lists {source, events}, where events lists {at, message} and at is an ISO 8601 time ending in "Z" or a ±HH:MM offset. Combine every event into {at, source, message}, with at rewritten as Date.prototype.toISOString does. Drop an event if an earlier one in the input has the same instant, source, and message. Sort by instant; break ties by source name with the default sort, then by the order the events had in the input. Return the list. Do not change sources.',
    brief: {
      summary: 'Implement incidentTimeline(sources) and return every event as {at, source, message} in order.',
      rules: [
        'Read each at, an ISO 8601 time with "Z" or a ±HH:MM offset, as an instant, and write it back with toISOString.',
        "Drop an event that repeats an earlier one's instant, source, and message.",
        'Sort by instant, then by source name with the default sort, then by input order.',
      ],
      edgeCases: ['The same message from two sources is kept twice.', 'Do not change sources.'],
    },
    example: {
      input:
        'incidentTimeline([{source: "app", events: [{at: "2026-10-19T08:02:00Z", message: "errors rise"}]}, {source: "chat", events: [{at: "2026-10-19T15:01:00+07:00", message: "Ada: checkout is failing"}]}])',
      output:
        '[{at: "2026-10-19T08:01:00.000Z", source: "chat", message: "Ada: checkout is failing"}, {at: "2026-10-19T08:02:00.000Z", source: "app", message: "errors rise"}]',
    },
    note: `There are at most 5,000 events. Clocks on different machines can disagree by a few seconds; this rep trusts the times it is given. ${notRun}`,
    vocabulary: [
      { term: 'Incident', meaning: "an unplanned event that hurts a service's users and needs a response" },
      { term: 'Timeline', meaning: 'the events of an incident in the order they happened, on one clock' },
    ],
    planPrompt:
      'Two events read "15:01+07:00" and "08:02Z". Which happened first, and how do you compare them without converting anything by hand?',
    starter:
      'type Source = { source: string; events: { at: string; message: string }[] }\n\nfunction incidentTimeline(sources: Source[]): { at: string; source: string; message: string }[] {\n  return []\n}\n',
    functionName: 'incidentTimeline',
    preserveInput: true,
    hints: [
      'Date.parse reads an ISO time with any offset as milliseconds since 1970.',
      'A Set of keys built from instant, source, and message finds repeats.',
      'Array.prototype.sort is stable, so events that tie on instant and source keep their input order.',
    ],
    checks: [
      {
        name: 'Orders the example across offsets',
        input: [
          [
            { source: 'app', events: [{ at: '2026-10-19T08:02:00Z', message: 'errors rise' }] },
            { source: 'chat', events: [{ at: '2026-10-19T15:01:00+07:00', message: 'Ada: checkout is failing' }] },
          ],
        ],
        expected: [
          { at: '2026-10-19T08:01:00.000Z', source: 'chat', message: 'Ada: checkout is failing' },
          { at: '2026-10-19T08:02:00.000Z', source: 'app', message: 'errors rise' },
        ],
      },
      {
        name: 'Reads a negative offset',
        input: [
          [
            { source: 'lb', events: [{ at: '2026-10-19T03:00:30-05:00', message: '502 responses' }] },
            { source: 'app', events: [{ at: '2026-10-19T08:00:10Z', message: 'pool exhausted' }] },
          ],
        ],
        expected: [
          { at: '2026-10-19T08:00:10.000Z', source: 'app', message: 'pool exhausted' },
          { at: '2026-10-19T08:00:30.000Z', source: 'lb', message: '502 responses' },
        ],
      },
      {
        name: 'Breaks a tie by source name',
        input: [
          [
            { source: 'web', events: [{ at: '2026-10-19T08:00:00Z', message: 'w' }] },
            { source: 'api', events: [{ at: '2026-10-19T08:00:00Z', message: 'a' }] },
          ],
        ],
        expected: [
          { at: '2026-10-19T08:00:00.000Z', source: 'api', message: 'a' },
          { at: '2026-10-19T08:00:00.000Z', source: 'web', message: 'w' },
        ],
      },
      {
        name: 'Keeps input order for a full tie',
        input: [
          [
            {
              source: 'app',
              events: [
                { at: '2026-10-19T08:00:00Z', message: 'second line' },
                { at: '2026-10-19T08:00:00Z', message: 'first line' },
              ],
            },
          ],
        ],
        expected: [
          { at: '2026-10-19T08:00:00.000Z', source: 'app', message: 'second line' },
          { at: '2026-10-19T08:00:00.000Z', source: 'app', message: 'first line' },
        ],
      },
      {
        name: 'Drops an event shipped twice',
        input: [
          [
            {
              source: 'app',
              events: [
                { at: '2026-10-19T08:00:00Z', message: 'restart' },
                { at: '2026-10-19T15:00:00+07:00', message: 'restart' },
              ],
            },
          ],
        ],
        expected: [{ at: '2026-10-19T08:00:00.000Z', source: 'app', message: 'restart' }],
      },
      {
        name: 'Keeps the same message from two sources',
        input: [
          [
            { source: 'a', events: [{ at: '2026-10-19T08:00:00Z', message: 'restart' }] },
            { source: 'b', events: [{ at: '2026-10-19T08:00:00Z', message: 'restart' }] },
          ],
        ],
        expected: [
          { at: '2026-10-19T08:00:00.000Z', source: 'a', message: 'restart' },
          { at: '2026-10-19T08:00:00.000Z', source: 'b', message: 'restart' },
        ],
      },
      {
        name: 'Keeps the same message at two times',
        input: [
          [
            {
              source: 'app',
              events: [
                { at: '2026-10-19T08:05:00Z', message: 'restart' },
                { at: '2026-10-19T08:00:00Z', message: 'restart' },
              ],
            },
          ],
        ],
        expected: [
          { at: '2026-10-19T08:00:00.000Z', source: 'app', message: 'restart' },
          { at: '2026-10-19T08:05:00.000Z', source: 'app', message: 'restart' },
        ],
      },
      { name: 'Handles no sources', input: [[]], expected: [] },
    ],
  },
  {
    id: 'devops-incident-durations',
    title: 'Measure how long an incident took',
    category: 'DevOps',
    format: 'devops',
    context:
      'Teams track a few durations for every incident: how long users were affected before anyone was alerted, before the harm was stopped, and before the cause was fixed. Shrinking the first one, the time to detect, is often the cheapest improvement.',
    prompt:
      'Implement incidentDurations(events). events lists {at, kind} in any order; at is an ISO 8601 time ending in "Z" or a ±HH:MM offset, and kind is "impact-start", "alert", "mitigated", "resolved", or "note". Use the earliest event of each kind. Return {timeToDetect, timeToMitigate, timeToResolve}: the whole minutes, rounded down, from the earliest impact-start to the earliest alert, mitigated, and resolved event respectively. A duration is null if there is no impact-start or no event of its kind, and 0 if its event is earlier than the impact start. Do not change events.',
    brief: {
      summary: 'Implement incidentDurations(events) and return {timeToDetect, timeToMitigate, timeToResolve} in whole minutes.',
      rules: [
        'Use the earliest event of each kind; events are in any order, and times are ISO 8601 with "Z" or a ±HH:MM offset.',
        'Each duration is the whole minutes, rounded down, from the earliest impact-start to the earliest alert, mitigated, or resolved event.',
        'A duration is null with no impact-start or no event of its kind, and 0 if its event is earlier than the impact start.',
      ],
      edgeCases: ['"note" events never change a duration.', 'Do not change events.'],
    },
    example: {
      input:
        'incidentDurations([{at: "2026-10-19T08:30:00Z", kind: "resolved"}, {at: "2026-10-19T08:00:00Z", kind: "impact-start"}, {at: "2026-10-19T15:12:30+07:00", kind: "alert"}, {at: "2026-10-19T08:20:00Z", kind: "mitigated"}])',
      output: '{timeToDetect: 12, timeToMitigate: 20, timeToResolve: 30}',
    },
    note: `Some teams measure from the alert instead of the impact start; this contract measures from the impact start. ${notRun}`,
    vocabulary: [
      { term: 'Time to detect', meaning: 'how long users were affected before the team was alerted' },
      { term: 'Mitigation', meaning: 'stopping the harm to users, for example by rolling back, before the cause is fixed' },
    ],
    planPrompt: 'Why might mitigation come long before resolution? What should a duration be if an alert fired before users were affected?',
    starter:
      'function incidentDurations(events: { at: string; kind: string }[]) {\n  return { timeToDetect: null as number | null, timeToMitigate: null as number | null, timeToResolve: null as number | null }\n}\n',
    functionName: 'incidentDurations',
    preserveInput: true,
    hints: [
      'Find the earliest instant of each kind in one pass, keeping a Map from kind to milliseconds.',
      'Divide a difference in milliseconds by 60,000 and round down with Math.floor.',
      'Math.max(0, ...) turns an early event into 0.',
    ],
    checks: [
      {
        name: 'Measures the example',
        input: [
          [
            { at: '2026-10-19T08:30:00Z', kind: 'resolved' },
            { at: '2026-10-19T08:00:00Z', kind: 'impact-start' },
            { at: '2026-10-19T15:12:30+07:00', kind: 'alert' },
            { at: '2026-10-19T08:20:00Z', kind: 'mitigated' },
          ],
        ],
        expected: { timeToDetect: 12, timeToMitigate: 20, timeToResolve: 30 },
      },
      {
        name: 'Uses the earliest event of each kind',
        input: [
          [
            { at: '2026-10-19T08:00:00Z', kind: 'impact-start' },
            { at: '2026-10-19T08:40:00Z', kind: 'alert' },
            { at: '2026-10-19T08:09:00Z', kind: 'alert' },
            { at: '2026-10-19T07:55:00Z', kind: 'impact-start' },
          ],
        ],
        expected: { timeToDetect: 14, timeToMitigate: null, timeToResolve: null },
      },
      {
        name: 'Rounds partial minutes down',
        input: [
          [
            { at: '2026-10-19T08:00:00Z', kind: 'impact-start' },
            { at: '2026-10-19T08:04:59Z', kind: 'alert' },
          ],
        ],
        expected: { timeToDetect: 4, timeToMitigate: null, timeToResolve: null },
      },
      {
        name: 'Gives 0 for an alert before the impact',
        input: [
          [
            { at: '2026-10-19T08:00:00Z', kind: 'impact-start' },
            { at: '2026-10-19T07:58:00Z', kind: 'alert' },
          ],
        ],
        expected: { timeToDetect: 0, timeToMitigate: null, timeToResolve: null },
      },
      {
        name: 'Returns nulls without an impact start',
        input: [[{ at: '2026-10-19T08:10:00Z', kind: 'alert' }]],
        expected: { timeToDetect: null, timeToMitigate: null, timeToResolve: null },
      },
      {
        name: 'Ignores notes',
        input: [
          [
            { at: '2026-10-19T08:00:00Z', kind: 'impact-start' },
            { at: '2026-10-19T08:01:00Z', kind: 'note' },
            { at: '2026-10-19T09:00:00Z', kind: 'resolved' },
          ],
        ],
        expected: { timeToDetect: null, timeToMitigate: null, timeToResolve: 60 },
      },
      {
        name: 'Compares times with different offsets',
        input: [
          [
            { at: '2026-10-19T03:00:00-05:00', kind: 'impact-start' },
            { at: '2026-10-19T08:45:00Z', kind: 'mitigated' },
          ],
        ],
        expected: { timeToDetect: null, timeToMitigate: 45, timeToResolve: null },
      },
    ],
  },
  {
    id: 'devops-impact-windows',
    title: 'Find when users were affected',
    category: 'DevOps',
    format: 'devops',
    context:
      'A graph of the error rate during an incident shows bad minutes, a short dip, and more bad minutes. For the report, the team wants the windows of impact, treating a short dip as part of the same window rather than two separate problems.',
    prompt:
      'Implement impactWindows(rates, threshold, mergeGap). rates lists an error percentage for each minute, starting at minute 0. A minute is bad when its rate is greater than threshold. Group bad minutes into windows of consecutive bad minutes, then join two windows when at most mergeGap good minutes separate them. Return each window as {start, end, minutes}, where start and end are the positions of its first and last bad minute and minutes is end - start + 1, in order. Do not change rates.',
    brief: {
      summary: 'Implement impactWindows(rates, threshold, mergeGap) and return the windows of bad minutes.',
      rules: [
        'rates has one error percentage per minute, starting at minute 0. A minute is bad when its rate is greater than threshold.',
        'Consecutive bad minutes form a window; join two windows when at most mergeGap good minutes separate them.',
        'Return {start, end, minutes} for each window in order, with minutes = end - start + 1.',
      ],
      edgeCases: ['A rate equal to threshold is not bad.', 'A window always starts and ends on a bad minute.', 'Do not change rates.'],
    },
    example: {
      input: 'impactWindows([0, 8, 9, 1, 7, 0, 0, 0, 6], 5, 1)',
      output: '[{start: 1, end: 4, minutes: 4}, {start: 8, end: 8, minutes: 1}]',
    },
    note: `Rates are whole numbers; threshold and mergeGap are whole numbers of at least 0. ${notRun}`,
    vocabulary: [
      { term: 'Impact window', meaning: 'a period during which users were affected by an incident' },
      {
        term: 'Error rate graph',
        meaning: 'a chart of the share of failed requests over time, used to see when a problem started and ended',
      },
    ],
    planPrompt: 'In the example, why are minutes 1 to 4 one window, and why is minute 8 separate?',
    starter:
      'function impactWindows(rates: number[], threshold: number, mergeGap: number): { start: number; end: number; minutes: number }[] {\n  return []\n}\n',
    functionName: 'impactWindows',
    preserveInput: true,
    hints: [
      'Walk the minutes once, remembering the current window and the last bad minute.',
      'A new bad minute joins the current window if it is at most mergeGap + 1 positions after the last bad minute.',
      'Close the last window after the loop.',
    ],
    checks: [
      {
        name: 'Joins a short dip in the example',
        input: [[0, 8, 9, 1, 7, 0, 0, 0, 6], 5, 1],
        expected: [
          { start: 1, end: 4, minutes: 4 },
          { start: 8, end: 8, minutes: 1 },
        ],
      },
      {
        name: 'Keeps windows apart with a gap of 0',
        input: [[8, 0, 8], 5, 0],
        expected: [
          { start: 0, end: 0, minutes: 1 },
          { start: 2, end: 2, minutes: 1 },
        ],
      },
      { name: 'Joins a gap exactly mergeGap long', input: [[8, 0, 0, 8], 5, 2], expected: [{ start: 0, end: 3, minutes: 4 }] },
      {
        name: 'Splits a gap one longer than mergeGap',
        input: [[8, 0, 0, 0, 8], 5, 2],
        expected: [
          { start: 0, end: 0, minutes: 1 },
          { start: 4, end: 4, minutes: 1 },
        ],
      },
      { name: 'Does not count a rate equal to the threshold', input: [[5, 6, 5], 5, 0], expected: [{ start: 1, end: 1, minutes: 1 }] },
      { name: 'Ends a window on its last bad minute', input: [[0, 9, 9, 0, 0], 5, 3], expected: [{ start: 1, end: 2, minutes: 2 }] },
      { name: 'Covers every minute when all are bad', input: [[9, 9, 9], 5, 0], expected: [{ start: 0, end: 2, minutes: 3 }] },
      { name: 'Returns nothing when all are good', input: [[0, 1, 2], 5, 4], expected: [] },
    ],
  },
  {
    id: 'devops-changes-before',
    title: 'List the changes just before an incident',
    category: 'DevOps',
    format: 'devops',
    context:
      'Most incidents start soon after something changed: a deploy, a config edit, a feature flag. One of the first questions in an incident is what changed shortly before users were affected, starting with the most recent change and the changes to the affected service.',
    prompt:
      'Implement changesBefore(changes, impactStart, lookbackMinutes, service). changes lists {at, service, description}; at and impactStart are ISO 8601 times ending in "Z" or a ±HH:MM offset. Keep the changes that happened after impactStart minus lookbackMinutes and no later than impactStart. Return them newest first, keeping input order for changes at the same instant, as {at, service, description, sameService}, where at is rewritten as Date.prototype.toISOString does and sameService is true when the change\'s service equals service. Do not change the inputs.',
    brief: {
      summary: 'Implement changesBefore(changes, impactStart, lookbackMinutes, service) and return the recent changes, newest first.',
      rules: [
        'Keep changes after impactStart minus lookbackMinutes and no later than impactStart; times are ISO 8601 with "Z" or an offset.',
        'Return them newest first, keeping input order for the same instant.',
        'Return {at, service, description, sameService}, with at written by toISOString and sameService true when the service matches.',
      ],
      edgeCases: [
        'A change exactly lookbackMinutes before the start is left out.',
        'A change at the impact start itself is kept.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'changesBefore([{at: "2026-10-19T07:40:00Z", service: "checkout", description: "deploy v42"}, {at: "2026-10-19T14:55:00+07:00", service: "search", description: "flag on"}], "2026-10-19T08:00:00Z", 60, "checkout")',
      output:
        '[{at: "2026-10-19T07:55:00.000Z", service: "search", description: "flag on", sameService: false}, {at: "2026-10-19T07:40:00.000Z", service: "checkout", description: "deploy v42", sameService: true}]',
    },
    note: `A change before an incident is a lead, not proof of its cause. There are at most 1,000 changes. ${notRun}`,
    vocabulary: [
      { term: 'Change event', meaning: 'a record of something altered in production, such as a deploy or a config edit' },
      { term: 'Lookback window', meaning: 'how far back before an event to search for possible causes' },
    ],
    planPrompt:
      'A deploy happened exactly 60 minutes before the impact and the lookback is 60 minutes. Is it in the list? What about a change one second after the impact started?',
    starter:
      'type Change = { at: string; service: string; description: string }\n\nfunction changesBefore(changes: Change[], impactStart: string, lookbackMinutes: number, service: string) {\n  return [] as (Change & { sameService: boolean })[]\n}\n',
    functionName: 'changesBefore',
    preserveInput: true,
    hints: [
      "Turn impactStart into milliseconds once, and the window's start is that minus lookbackMinutes × 60,000.",
      'The window excludes its start and includes its end.',
      'A stable sort by instant, newest first, keeps ties in input order.',
    ],
    checks: [
      {
        name: 'Lists the example newest first',
        input: [
          [
            { at: '2026-10-19T07:40:00Z', service: 'checkout', description: 'deploy v42' },
            { at: '2026-10-19T14:55:00+07:00', service: 'search', description: 'flag on' },
          ],
          '2026-10-19T08:00:00Z',
          60,
          'checkout',
        ],
        expected: [
          { at: '2026-10-19T07:55:00.000Z', service: 'search', description: 'flag on', sameService: false },
          { at: '2026-10-19T07:40:00.000Z', service: 'checkout', description: 'deploy v42', sameService: true },
        ],
      },
      {
        name: 'Leaves out a change exactly at the window start',
        input: [[{ at: '2026-10-19T07:00:00Z', service: 'checkout', description: 'deploy v41' }], '2026-10-19T08:00:00Z', 60, 'checkout'],
        expected: [],
      },
      {
        name: 'Keeps a change at the impact start',
        input: [[{ at: '2026-10-19T08:00:00Z', service: 'db', description: 'failover' }], '2026-10-19T08:00:00Z', 60, 'checkout'],
        expected: [{ at: '2026-10-19T08:00:00.000Z', service: 'db', description: 'failover', sameService: false }],
      },
      {
        name: 'Leaves out changes after the impact start',
        input: [[{ at: '2026-10-19T08:00:01Z', service: 'checkout', description: 'rollback' }], '2026-10-19T08:00:00Z', 60, 'checkout'],
        expected: [],
      },
      {
        name: 'Reads offsets on the impact start too',
        input: [[{ at: '2026-10-19T07:30:00Z', service: 'checkout', description: 'config' }], '2026-10-19T03:00:00-05:00', 45, 'checkout'],
        expected: [{ at: '2026-10-19T07:30:00.000Z', service: 'checkout', description: 'config', sameService: true }],
      },
      {
        name: 'Keeps input order for the same instant',
        input: [
          [
            { at: '2026-10-19T07:50:00Z', service: 'a', description: 'first' },
            { at: '2026-10-19T14:50:00+07:00', service: 'b', description: 'second' },
          ],
          '2026-10-19T08:00:00Z',
          30,
          'a',
        ],
        expected: [
          { at: '2026-10-19T07:50:00.000Z', service: 'a', description: 'first', sameService: true },
          { at: '2026-10-19T07:50:00.000Z', service: 'b', description: 'second', sameService: false },
        ],
      },
      {
        name: 'Uses the supplied lookback',
        input: [[{ at: '2026-10-19T07:00:00Z', service: 'checkout', description: 'deploy v41' }], '2026-10-19T08:00:00Z', 120, 'checkout'],
        expected: [{ at: '2026-10-19T07:00:00.000Z', service: 'checkout', description: 'deploy v41', sameService: true }],
      },
    ],
  },
  {
    id: 'devops-postmortem-draft',
    title: 'Draft a postmortem from the timeline',
    category: 'DevOps',
    format: 'devops',
    context:
      'A blameless postmortem explains what happened and how to prevent it, without blaming a person. Its facts, the duration, the timeline, and the agreed actions, can be assembled automatically; the explanation of what happened and why has to be written by the people who were there. Here your function builds the factual skeleton, and you write the explanation yourself in Explain.',
    prompt:
      'Implement postmortemDraft(incident). incident is {title, impactStart, resolvedAt, events, actions}; events lists {at, source, message} in any order, actions lists {task, owner}, and every time is an ISO 8601 time ending in "Z" or a ±HH:MM offset. Return one text whose lines are joined with "\\n": "# Postmortem: TITLE", an empty line, "Duration: N minutes (START to END)", an empty line, "## Timeline (UTC)", then one line "- HH:MM SOURCE: MESSAGE" per event, an empty line, "## Action items", then one line "- [ ] TASK (owner: OWNER)" per action in the given order, or "- None recorded" if there are none, an empty line, "## What happened", "_Write this section yourself._", an empty line, "## Why it happened", and "_Write this section yourself._". N is the whole minutes, rounded down, from impactStart to resolvedAt; START and END are those times written as Date.prototype.toISOString does. Events are sorted by instant, then by source name with the default sort, then by input order, and HH:MM is the event\'s hour and minute in UTC. Do not change incident.',
    brief: {
      summary: 'Implement postmortemDraft(incident) and return the postmortem skeleton as one text with lines joined by "\\n".',
      rules: [
        'Header: "# Postmortem: TITLE", "", "Duration: N minutes (START to END)", with N the whole minutes, rounded down, and START and END written by toISOString.',
        'Timeline: "## Timeline (UTC)", then "- HH:MM SOURCE: MESSAGE" per event, sorted by instant, then source name, then input order, with HH:MM in UTC.',
        'Actions: "## Action items", then "- [ ] TASK (owner: OWNER)" per action in order, or "- None recorded".',
        'End: "## What happened", "_Write this section yourself._", "", "## Why it happened", "_Write this section yourself._", with one empty line between sections.',
      ],
      edgeCases: ['Times may use different offsets; read every ISO 8601 time as an instant.', 'Do not change incident.'],
    },
    example: {
      input:
        'postmortemDraft({title: "Checkout errors", impactStart: "2026-10-19T08:00:00Z", resolvedAt: "2026-10-19T15:42:30+07:00", events: [{at: "2026-10-19T08:12:00Z", source: "pager", message: "alert fired"}], actions: [{task: "Alert on pool usage", owner: "Ada"}]})',
      output:
        '"# Postmortem: Checkout errors\\n\\nDuration: 42 minutes (2026-10-19T08:00:00.000Z to 2026-10-19T08:42:30.000Z)\\n\\n## Timeline (UTC)\\n- 08:12 pager: alert fired\\n\\n## Action items\\n- [ ] Alert on pool usage (owner: Ada)\\n\\n## What happened\\n_Write this section yourself._\\n\\n## Why it happened\\n_Write this section yourself._"',
    },
    note: `The checks compare only the skeleton your function returns. The postmortem itself, what happened and why, written blamelessly in Explain, is self-reviewed against the guide and never graded. ${notRun}`,
    vocabulary: [
      { term: 'Postmortem', meaning: 'a written review after an incident: what happened, why, and what will change' },
      { term: 'Blameless', meaning: 'focusing on how the system and process allowed a failure, not on who made a mistake' },
    ],
    planPrompt:
      'Which parts of a postmortem can a program assemble from records, and which must people write? In Explain, write the "What happened" and "Why it happened" sections for an incident you know, without naming who was at fault.',
    starter:
      "type Incident = {\n  title: string\n  impactStart: string\n  resolvedAt: string\n  events: { at: string; source: string; message: string }[]\n  actions: { task: string; owner: string }[]\n}\n\nfunction postmortemDraft(incident: Incident): string {\n  return ''\n}\n",
    functionName: 'postmortemDraft',
    preserveInput: true,
    hints: [
      'Build an array of lines and join it with "\\n" at the end; empty strings become the empty lines.',
      'toISOString().slice(11, 16) gives HH:MM in UTC.',
      'Sort a copy of the events with a stable sort on instant, then source name.',
    ],
    checks: [
      {
        name: 'Drafts the example',
        input: [
          {
            title: 'Checkout errors',
            impactStart: '2026-10-19T08:00:00Z',
            resolvedAt: '2026-10-19T15:42:30+07:00',
            events: [{ at: '2026-10-19T08:12:00Z', source: 'pager', message: 'alert fired' }],
            actions: [{ task: 'Alert on pool usage', owner: 'Ada' }],
          },
        ],
        expected:
          '# Postmortem: Checkout errors\n\nDuration: 42 minutes (2026-10-19T08:00:00.000Z to 2026-10-19T08:42:30.000Z)\n\n## Timeline (UTC)\n- 08:12 pager: alert fired\n\n## Action items\n- [ ] Alert on pool usage (owner: Ada)\n\n## What happened\n_Write this section yourself._\n\n## Why it happened\n_Write this section yourself._',
      },
      {
        name: 'Orders events from several offsets',
        input: [
          {
            title: 'Search outage',
            impactStart: '2026-10-19T08:00:00Z',
            resolvedAt: '2026-10-19T09:00:00Z',
            events: [
              { at: '2026-10-19T08:30:00Z', source: 'app', message: 'rollback done' },
              { at: '2026-10-19T15:05:00+07:00', source: 'chat', message: 'Grace: search is empty' },
              { at: '2026-10-19T03:05:00-05:00', source: 'app', message: 'index missing' },
            ],
            actions: [],
          },
        ],
        expected:
          '# Postmortem: Search outage\n\nDuration: 60 minutes (2026-10-19T08:00:00.000Z to 2026-10-19T09:00:00.000Z)\n\n## Timeline (UTC)\n- 08:05 app: index missing\n- 08:05 chat: Grace: search is empty\n- 08:30 app: rollback done\n\n## Action items\n- None recorded\n\n## What happened\n_Write this section yourself._\n\n## Why it happened\n_Write this section yourself._',
      },
      {
        name: 'Keeps actions in the given order',
        input: [
          {
            title: 'Disk full',
            impactStart: '2026-10-19T08:00:00Z',
            resolvedAt: '2026-10-19T08:10:59Z',
            events: [],
            actions: [
              { task: 'Rotate logs daily', owner: 'Lin' },
              { task: 'Alert at 80% disk', owner: 'Sam' },
            ],
          },
        ],
        expected:
          '# Postmortem: Disk full\n\nDuration: 10 minutes (2026-10-19T08:00:00.000Z to 2026-10-19T08:10:59.000Z)\n\n## Timeline (UTC)\n\n## Action items\n- [ ] Rotate logs daily (owner: Lin)\n- [ ] Alert at 80% disk (owner: Sam)\n\n## What happened\n_Write this section yourself._\n\n## Why it happened\n_Write this section yourself._',
      },
      {
        name: 'Keeps input order for identical times and sources',
        input: [
          {
            title: 'Queue stall',
            impactStart: '2026-10-19T23:50:00Z',
            resolvedAt: '2026-10-20T00:20:00Z',
            events: [
              { at: '2026-10-20T00:05:00Z', source: 'worker', message: 'stuck job' },
              { at: '2026-10-20T00:05:00Z', source: 'worker', message: 'lease expired' },
            ],
            actions: [{ task: 'Shorten the lease', owner: 'Kai' }],
          },
        ],
        expected:
          '# Postmortem: Queue stall\n\nDuration: 30 minutes (2026-10-19T23:50:00.000Z to 2026-10-20T00:20:00.000Z)\n\n## Timeline (UTC)\n- 00:05 worker: stuck job\n- 00:05 worker: lease expired\n\n## Action items\n- [ ] Shorten the lease (owner: Kai)\n\n## What happened\n_Write this section yourself._\n\n## Why it happened\n_Write this section yourself._',
      },
    ],
  },
]
