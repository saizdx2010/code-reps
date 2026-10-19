import type { Skill } from './knowledge.ts'
import { q } from './knowledge-question.ts'

// DevOps track lessons. The reps they link are TypeScript functions over authored inputs, never a shell, Docker, CI, or
// a network. Checked questions keep their IDs and answer contracts once shipped.
export const devopsSkills: Skill[] = [
  {
    id: 'ci-output',
    title: 'Read CI output: exit codes and the first real error',
    summary:
      'Tell from an exit code whether a command passed, failed, or was stopped, and find the line in a noisy CI log that explains a failure.',
    prerequisites: [],
    objectives: [
      'Read an exit code: 0 for success, other values for failure, and the codes for a missing command and a stopped process.',
      'Find the first real error in a log by removing colour codes and timestamps and skipping warnings and summary lines.',
      'Work out which step failed a job when some steps may fail without failing it and others always run.',
    ],
    sections: [
      {
        title: 'CI runs your commands and reports exit codes',
        body: 'Continuous integration (CI) runs the same commands you would run locally, such as installing packages, building, and testing, on every change. Each command ends with an exit code. 0 means success and anything else means failure, so CI marks a step as failed when its command exits with a non-zero code. In a shell, 127 usually means the command was not found, 126 that it was found but could not be run, and 128 plus a number that a signal stopped it: 137 is signal 9, which often means the process ran out of memory.',
      },
      {
        title: 'Read the first error, not the last line',
        body: 'A failed step often ends with a line such as "Error: Process completed with exit code 1." That line only reports the failure. The cause is usually the first error above it, because later errors are often effects of the first one. Logs also contain noise: colour codes that terminals turn into colours, timestamps at the start of each line, warnings that mention errors without being failures, and lines such as "Errors: 0". Clean each line, skip the noise, then look for the first line that really is an error.',
      },
      {
        title: 'Steps run in order, with conditions',
        body: 'A job runs its steps in order on one machine. After a step fails, later steps are skipped, except steps marked to run on failure (to send a notice) or always (to upload a report or clean up). A step can also be allowed to fail, such as an optional lint, without failing the job. So the step that failed the job is the first failure that was not allowed, and errors in an allowed step are not the cause.',
      },
      {
        title: 'What these reps check',
        body: 'Every DevOps rep is a TypeScript function that applies an authored policy to authored inputs: these exit codes, this log format, these step conditions. The checks call the function directly. They show that it follows the policy, not that a shell, Docker, a CI service, or a network behaves the same way, and real tools print many formats these reps leave out.',
      },
    ],
    example:
      "2026-10-19T08:00:01Z Run npm test\nwarning: error handler is deprecated in retry.ts\nPASS src/cart.test.ts\nError: Cannot find module './tax'\n    at Object.<anonymous> (src/cart.ts:1:1)\nError: Process completed with exit code 1.",
    walkthrough: [
      'Remove the timestamp from line 1; it is not an error.',
      'Line 2 starts with "warning", so it is skipped even though it mentions an error.',
      'Line 4 starts with the word "Error", so it is the first real error: the module ./tax is missing.',
      'The last line only reports that the step failed; it is never the cause.',
    ],
    mistakes: [
      'Reading the last line of the log and stopping there.',
      'Treating a warning, or a line such as "Errors: 0", as the failure.',
      'Blaming a step that was allowed to fail when a later step failed the job.',
      'Reading exit code 137 as an ordinary test failure instead of a stopped process, often out of memory.',
    ],
    questions: [
      q(
        'exit-code-127-v1',
        'A CI step running "jest" exits with code 127. What is the most likely cause?',
        '',
        ['A test failed', 'The jest command was not found', 'The machine ran out of memory'],
        1,
        'In a shell, 127 means the command could not be found, for example because packages were not installed.',
      ),
      q(
        'exit-code-137-v1',
        'A build step exits with code 137 and its log ends with "Killed". What does 137 tell you?',
        '',
        ['It exited normally with a custom code', 'A signal stopped it: 137 is 128 + 9', 'It was skipped'],
        1,
        '128 plus a signal number means a signal stopped the process. Signal 9 is a forced stop, often because it ran out of memory.',
      ),
      q(
        'first-error-not-last-v1',
        'A failed step prints 300 lines. Which line usually explains the failure?',
        '',
        ['The last line, which gives the exit code', 'The first real error line', 'The longest line'],
        1,
        'The last line only reports that the step failed. Later errors are often effects of the first one, so start there.',
      ),
      q(
        'continue-on-error-v1',
        'Lint fails but is allowed to fail, then tests fail. Which step failed the job?',
        '',
        ['Lint', 'Tests', 'Both equally'],
        1,
        'A step allowed to fail never fails the job, so the first failure that was not allowed, the tests, is the one to explain.',
      ),
    ],
    repIds: ['devops-exit-meaning', 'devops-first-error', 'devops-step-outcomes', 'devops-error-annotations', 'devops-failing-step'],
    related: [],
  },
  {
    id: 'service-config',
    title: 'Configuration: environment variables, schemas, and secrets',
    summary:
      'Read settings from environment variables, check them all against a schema when the service starts, and keep secret values out of logs and reports.',
    prerequisites: ['ci-output'],
    objectives: [
      'Read a setting from an environment variable with a type, a range, and a default, refusing text that only looks like a number.',
      'Check every setting against a schema at startup and report all problems at once.',
      'Mask secret values in log lines and compare two environments without printing secrets.',
    ],
    sections: [
      {
        title: 'Settings live outside the code',
        body: 'The same build should run on a laptop, in CI, in staging, and in production, so the things that differ, such as ports, database addresses, and feature switches, are passed in as environment variables. Every environment variable is text. A port of "8080" has to be turned into a number, and "8080abc" or "1e3" must be refused rather than read as 8080 or 1000 by a forgiving parser.',
      },
      {
        title: 'Check everything when the service starts',
        body: 'A schema lists each setting with its type, whether it is required, and its default. Checking the whole schema at startup and stopping with a clear list of problems is called failing fast: one restart fixes every mistake, instead of the service running for an hour and failing on the first request that needs a missing value. An empty value is usually treated as missing, so a blank line in a settings file does not hide a required setting.',
      },
      {
        title: 'Keep secrets out of logs',
        body: 'Passwords and tokens are also passed in as environment variables, and a script can print one by accident. CI services mask known secrets by replacing each value with a placeholder in every log line. Mask longer values first, because a shorter secret inside a longer one would otherwise leave part of the longer one visible, and treat each value as plain text, since secrets contain characters such as "." and "+". Masking cannot unprint a value already shown elsewhere, so the real fix is not to print it.',
      },
      {
        title: 'Local files and drift',
        body: 'For local work, a .env file holds NAME=value lines that a loader turns into variables. Over time environments drift apart: a variable added in staging is forgotten in production. Comparing the two sets of names and values, while showing only "***" for secret ones, finds that drift before a deploy does.',
      },
    ],
    example:
      'schema: PORT integer required · DEBUG boolean default "false" · DATABASE_URL string required\nenv:    PORT="8080" · DEBUG="yes"\n\nPORT          "8080" → 8080\nDEBUG         "yes"  → error: DEBUG must be true or false\nDATABASE_URL  missing → error: DATABASE_URL is required',
    walkthrough: [
      'PORT is present and is only digits, so it becomes the number 8080.',
      'DEBUG is present, so its default is not used, and "yes" is not one of true, false, 1, or 0.',
      'DATABASE_URL is missing and has no default, so it is reported as required.',
      'Both errors are reported together, so one fix and one restart are enough.',
    ],
    mistakes: [
      'Converting with parseInt or Number, which accept "8080abc" or "1e3".',
      'Stopping at the first problem, so each restart reveals only one more.',
      'Treating an empty value as set, so a blank line hides a missing required setting.',
      'Masking a short secret before a longer one that contains it, which leaves part of the longer one in the log.',
    ],
    questions: [
      q(
        'port-parseint-v1',
        'PORT is "8080abc". What does parseInt(PORT, 10) return?',
        '',
        ['NaN', '8080', 'An error'],
        1,
        'parseInt reads digits until the first character that is not one and ignores the rest, so the mistake passes silently. Check the whole text first.',
      ),
      q(
        'config-fail-fast-v1',
        'A required DATABASE_URL is missing. When should the service report it?',
        '',
        [
          'On the first request that needs the database',
          'At startup, together with any other setting problems',
          'Never; use an empty address',
        ],
        1,
        'Checking every setting at startup fails fast: the service never runs half-configured, and one list shows every problem.',
      ),
      q(
        'mask-longest-first-v1',
        'Secrets "abc123" and "token-abc123" both appear in a log. Masking "abc123" first leaves what in place of "token-abc123"?',
        '',
        ['***', 'token-***', 'token-abc123'],
        1,
        'Once "abc123" is replaced, the longer value no longer matches, so "token-" stays visible. Mask longer values first.',
      ),
      q(
        'env-empty-default-v1',
        'WORKERS is set to "" and its default is "4". Under the usual rule, what is the setting?',
        '',
        ['"" (empty)', '4', 'An error'],
        1,
        'An empty value is treated as missing, so the default applies.',
      ),
    ],
    repIds: ['devops-read-port', 'devops-validate-env', 'devops-mask-secrets', 'devops-parse-dotenv', 'devops-config-drift'],
    related: ['ci-output', 'validation'],
  },
  {
    id: 'semver',
    title: 'Versions: semantic versioning, ranges, and lockfiles',
    summary:
      'Read and compare MAJOR.MINOR.PATCH versions, choose the next one from the changes in a release, check versions against ranges, and summarise a lockfile change.',
    prerequisites: ['ci-output'],
    objectives: [
      'Compare versions part by part as numbers, including pre-releases such as 2.0.0-rc.1.',
      'Choose the next version from the kinds of change in a release, including the 0.x convention.',
      'Check a version against exact, >=, tilde, and caret ranges, and summarise what a lockfile change did.',
    ],
    sections: [
      {
        title: 'Three numbers, three promises',
        body: 'A semantic version such as 4.17.21 has three parts. PATCH rises for bug fixes that change nothing else, MINOR for new features that keep existing code working, and MAJOR for changes that may break code written for the old version. Raising one part resets the parts to its right to 0, so after 1.9.9 a new feature gives 1.10.0. While MAJOR is 0 a project is not yet stable, and many teams raise MINOR for breaking changes until 1.0.0.',
      },
      {
        title: 'Compare as numbers, not text',
        body: 'Compared as text, "1.10.0" comes before "1.9.0" because "1" is less than "9". Versions must be split into parts and compared as numbers, major first. A pre-release such as 2.0.0-beta.2 comes before 2.0.0, and its labels compare one by one: numbers as numbers, so beta.11 comes after beta.2, and a number before a word. Build information after "+" never changes the order.',
      },
      {
        title: 'Ranges ask for compatible versions',
        body: 'A package file usually asks for a range. ^1.2.3 accepts anything from 1.2.3 up to, but not including, 2.0.0, because a new major version may break. For 0.x versions the caret is stricter: ^0.2.3 stops before 0.3.0 and ^0.0.3 before 0.0.4. ~1.2.3 accepts only patches: from 1.2.3 up to 1.3.0. The lower bound is included and the upper bound never is.',
      },
      {
        title: 'Lockfiles pin what was installed',
        body: 'Because ranges allow many versions, two installs on different days could get different code. A lockfile records the exact version every install used, so local machines and CI install the same packages. Review a lockfile change by its summary: which packages were added or removed, which went up or down, and which upgrades are major, since those are the ones most likely to break something. These reps compare authored versions; they do not install packages or read a real lockfile.',
      },
    ],
    example:
      'range ^1.9.0 (from 1.9.0, up to but not including 2.0.0)\n\n1.8.9  → below the base     → no\n1.9.0  → the base          → yes\n1.10.0 → 1.10 is above 1.9  → yes  (as text, "1.10.0" < "1.9.0")\n2.0.0  → the upper limit   → no',
    walkthrough: [
      'The caret on 1.9.0 keeps the major number: the range ends just before 2.0.0.',
      '1.8.9 is below the base, so it is refused.',
      '1.10.0 has minor 10, which is greater than 9 as a number, so it is inside the range even though text order says otherwise.',
      '2.0.0 is the upper limit, which is never included.',
    ],
    mistakes: [
      'Comparing versions as text, so 1.10.0 sorts before 1.9.0.',
      'Forgetting to reset the parts to the right, giving 1.5.2 instead of 1.5.0 after a feature.',
      'Treating ^0.2.3 like ^1.2.3, which lets in 0.3.0, a version that may break.',
      'Sorting 2.0.0-rc.1 after 2.0.0, or beta.11 before beta.2.',
    ],
    questions: [
      q(
        'semver-text-order-v1',
        'Which is the newer version: 1.10.0 or 1.9.0?',
        '',
        ['1.9.0, because "9" is greater than "1"', '1.10.0, because minor 10 is greater than 9', 'They are equal'],
        1,
        'Each part is a number. Compared as text, "1.10.0" sorts first, which is why versions must be split and compared part by part.',
      ),
      q(
        'semver-caret-zero-v1',
        'A package asks for ^0.2.3. Which version does that range accept?',
        '',
        ['0.3.0', '0.2.9', '1.0.0'],
        1,
        'For 0.x versions the caret keeps the minor number, so the range stops before 0.3.0.',
      ),
      q(
        'semver-prerelease-v1',
        'Which comes first when versions are sorted: 2.0.0 or 2.0.0-rc.1?',
        '',
        ['2.0.0', '2.0.0-rc.1', 'Neither; they are equal'],
        1,
        'A pre-release leads up to its release, so it sorts before the plain version.',
      ),
      q(
        'lockfile-purpose-v1',
        'Why do projects commit a lockfile?',
        '',
        ['To make installs faster only', 'So every install gets the same exact versions', 'To stop packages from ever being upgraded'],
        1,
        'Ranges allow many versions. The lockfile records the exact ones, so laptops and CI install the same code until someone deliberately updates it.',
      ),
    ],
    repIds: ['devops-compare-versions', 'devops-next-version', 'devops-sort-versions', 'devops-lockfile-diff', 'devops-satisfies-range'],
    related: ['ci-output', 'api-evolution'],
  },
]
