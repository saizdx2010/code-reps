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
  {
    id: 'ci-pipelines',
    title: 'Pipelines: job order, caches, and skipped work',
    summary:
      'Order jobs by what they need and catch loops, build cache keys from the inputs that matter, and skip jobs whose inputs did not change.',
    prerequisites: ['ci-output'],
    objectives: [
      'Group jobs into waves that can run side by side, and report unknown needs and loops before anything runs.',
      "Build a cache key from the files that decide a cache's contents, and choose a fallback cache when the exact one is missing.",
      'Find the critical path of a pipeline and decide which jobs a change lets you skip.',
    ],
    sections: [
      {
        title: 'Jobs wait for the jobs they need',
        body: 'A pipeline lists jobs, and each job can name the jobs it needs. Jobs whose needs are all finished run side by side, so the pipeline runs in waves: first everything that needs nothing, then everything that needed only those, and so on. A job that needs a missing job, or jobs that need each other in a loop, can never run, so a pipeline checks for both before starting. The longest chain of jobs waiting on each other, the critical path, sets how long the whole pipeline takes.',
      },
      {
        title: 'Cache keys come from inputs',
        body: 'A cache saves the result of slow work, such as installed packages, and restores it next time. It is only safe to reuse when the inputs that decided it are the same, so the cache key is built from those inputs: the job, the operating system, and a hash of files such as the lockfile. Files that do not affect the result stay out of the key, or every unrelated change would miss the cache. When the exact key is missing, a list of key prefixes finds an older, similar cache to start from.',
      },
      {
        title: 'Skip what a change cannot affect',
        body: "In a repository with several parts, each job can name the paths it reads. A change that touches none of them cannot change the job's result, so the job can be skipped. A job that uses another job's output must still run whenever that job runs, so the decision passes along the needs. Skipping saves time only when the paths are complete: a job that reads a file it does not list will be skipped when it should not be.",
      },
      {
        title: 'What these reps check',
        body: 'These reps describe pipelines as plain data: names, needs, minutes, paths, and file contents passed to your function. The checks show that the function applies the stated rules to those inputs. They do not run a CI service, read a YAML file, or measure real job times, and the simple FNV-1a hash used for cache keys here is chosen for being easy to follow, not for strength.',
      },
    ],
    example:
      'lint    needs nothing\nbuild   needs nothing\ntest    needs build\ndeploy  needs lint, test\n\nwave 1: lint, build\nwave 2: test\nwave 3: deploy',
    walkthrough: [
      'lint and build need nothing, so they form the first wave and run side by side.',
      'test needs only build, which is in wave 1, so test is in wave 2.',
      'deploy needs lint and test; test is in wave 2, so deploy waits until wave 3.',
      'If test also needed deploy, neither could ever start: that loop is reported instead of waves.',
    ],
    mistakes: [
      'Placing a job in the same wave as a job it needs because both became ready in one pass.',
      'Building a cache key from every file, so any change misses the cache, or from too few, so a stale cache is reused.',
      'Speeding up a job that is not on the critical path and expecting the pipeline to finish sooner.',
      'Skipping a deploy job because its own files did not change, although the build it uses ran again.',
    ],
    questions: [
      q(
        'pipeline-wave-v1',
        'test needs build, and deploy needs test. build needs nothing. In which wave does deploy run?',
        '',
        ['Wave 2', 'Wave 3', 'Wave 1, with build'],
        1,
        'build runs in wave 1, test in wave 2 after it, and deploy in wave 3 after test.',
      ),
      q(
        'cache-key-inputs-v1',
        'A cache holds installed packages. Which file belongs in its key?',
        '',
        ['README.md', 'The lockfile', 'Every file in the repository'],
        1,
        'The lockfile decides which packages are installed. README changes cannot change the cache, and hashing every file would miss the cache on every change.',
      ),
      q(
        'critical-path-v1',
        'build (5 min) then test (8 min) run in a chain; lint (3 min) runs beside them. Which job, made faster, shortens the pipeline?',
        '',
        ['lint', 'test', 'Either one'],
        1,
        'The pipeline takes 13 minutes because of the build → test chain. lint already finishes long before, so speeding it up changes nothing.',
      ),
      q(
        'skip-needs-run-v1',
        'deploy reads only deploy/ and needs build. A change touches only src/, which build reads. Should deploy run?',
        '',
        ['No, none of its files changed', 'Yes, because build runs and deploy uses its output', 'Only if deploy/ is empty'],
        1,
        "deploy's result depends on build's output, which changes when build runs again, so deploy must run too.",
      ),
    ],
    repIds: ['devops-job-waves', 'devops-cache-key', 'devops-cache-restore', 'devops-pipeline-duration', 'devops-skip-unchanged'],
    related: ['ci-output', 'semver'],
  },
  {
    id: 'container-images',
    title: 'Containers: image layers, build context, and tags',
    summary:
      'Predict which image layers a change rebuilds, keep files out of the build context, and tag and clean up images so the right one can always be found.',
    prerequisites: ['ci-pipelines'],
    objectives: [
      'Predict which build steps reuse their cached layer and which rebuild after a change, in one stage or several.',
      'Order build steps so that common changes rebuild as little as possible, and leave files out of the build context.',
      'Tag images from branches and releases, and choose old tags to delete without losing running or released images.',
    ],
    sections: [
      {
        title: 'An image is a stack of layers',
        body: 'A container image is built from a list of steps: start from a base image, copy files in, run commands. Each step saves its result as a layer. On the next build, a step whose inputs are unchanged reuses its layer from the cache. Once a step has to run again, every later step runs again too, because it was built on top of the old result. That is why builds copy the lockfile and install packages before copying the source code: editing code then rebuilds only the last few steps.',
      },
      {
        title: 'Stages and the build context',
        body: 'A multi-stage build compiles in one stage and copies only the output into a small final stage. A stage that starts from, or copies from, a stage that changed must rebuild too. Everything in the build folder is the build context, which steps can copy from. An ignore file leaves out folders such as node_modules and files such as .env, so builds are faster and local secrets never reach an image.',
      },
      {
        title: 'Tags say which image to run',
        body: 'Each build pushes an image with tags. A release gets its version, such as 1.4.2, plus 1.4, 1, and latest, so users can choose how closely to follow updates; a pre-release gets only its own version, so latest never points at a test build. Branch builds get a tag made from the branch name, converted to the characters tags allow, and every image gets a tag from its commit, so any running image can be traced to its code.',
      },
      {
        title: 'Clean up without losing what matters',
        body: 'Registries fill up quickly, so cleanup policies keep only the newest few tags per branch. They must never delete an image that is running, or a release someone may need to roll back to. These reps describe builds and registries as plain data passed to your functions; the checks do not run Docker, build an image, or contact a registry.',
      },
    ],
    example:
      'FROM node:24                              cached\nCOPY package.json package-lock.json ./   cached\nRUN npm ci                                cached\nCOPY src/ ./src/                          rebuilt  ← src/app.ts changed\nRUN npm run build                         rebuilt  ← built on the new layer',
    walkthrough: [
      'FROM copies nothing from the build folder, so it stays cached.',
      'The package files did not change, so the copy and the install reuse their layers.',
      'src/app.ts changed and is copied by COPY src/, so that step rebuilds.',
      'The build step comes after a rebuilt step, so it rebuilds too, even though it copies nothing.',
    ],
    mistakes: [
      'Copying all the source code before installing packages, so every code change reinstalls everything.',
      'Expecting a later step to stay cached after an earlier step rebuilt.',
      'Leaving .env or node_modules in the build context, so secrets end up in the image or builds slow down.',
      'Moving latest to a pre-release, or deleting a tag that is still deployed.',
    ],
    questions: [
      q(
        'layer-after-rebuild-v1',
        'Step 3 of 5 rebuilds. What happens to steps 4 and 5?',
        '',
        ['They stay cached if their own inputs are unchanged', 'They rebuild too', 'Only step 5 rebuilds'],
        1,
        'Each layer is built on the one before it, so every step after a rebuilt step runs again.',
      ),
      q(
        'copy-order-v1',
        'Why do Dockerfiles copy package-lock.json and run the install before copying src/?',
        '',
        ['Installs must run first by rule', 'So a code change reuses the cached install layer', 'To make the image smaller'],
        1,
        'Code changes far more often than the lockfile. With the install first, a code change rebuilds only the steps after COPY src/.',
      ),
      q(
        'prerelease-latest-v1',
        'v2.0.0-rc.1 is built. Should it get the latest tag?',
        '',
        ['Yes, it is the newest build', 'No, latest should point at a release', 'Only if main passed'],
        1,
        'People pull latest expecting a release. A pre-release gets only its own version tag.',
      ),
      q(
        'tag-cleanup-deployed-v1',
        'A cleanup keeps the 3 newest tags per branch. An older tag on that branch is running in production. Should it be deleted?',
        '',
        ['Yes, it is not among the newest 3', 'No, a running image is never deleted', 'Only after the next deploy'],
        1,
        'Deleting a running image can stop a restart or a rollback from finding it, so running tags are protected.',
      ),
    ],
    repIds: ['devops-layer-rebuild', 'devops-image-tags', 'devops-dockerignore', 'devops-tag-cleanup', 'devops-multistage-rebuild'],
    related: ['ci-pipelines', 'semver'],
  },
]
