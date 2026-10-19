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
  {
    id: 'deploy-strategies',
    title: 'Deploys: rolling, blue/green, canary, and rollback',
    summary:
      'Plan a rolling update, switch safely between blue and green, roll a feature out to a stable share of users, and decide from error rates whether a canary is promoted or rolled back.',
    prerequisites: ['container-images'],
    objectives: [
      'Turn a share of unavailable instances into whole batches, and keep a minimum number serving.',
      'Give each user a stable bucket with a hash, so a percentage rollout only ever adds users.',
      'Follow a blue/green switch and a canary schedule, and decide to promote or roll back from runs of healthy and unhealthy minutes.',
    ],
    sections: [
      {
        title: 'Change a running service gradually',
        body: 'A deploy replaces the version that is serving users, so the safest deploys change a little at a time and can stop. A rolling update replaces a few instances at a time; the share allowed to be out of service at once is rounded down to whole instances, but never below one, so the update always moves. Blue/green keeps two complete environments and switches all traffic at once, but only to an environment that has passed its checks, which makes switching back instant.',
      },
      {
        title: 'Canaries and percentage rollouts',
        body: 'A canary sends a small share of traffic to the new version, holds, then moves to larger shares; pausing stops the hold timer so a paused step is not rushed. A percentage rollout does the same for a feature flag, by user. Each user must get the same answer on every request, and a user who has the feature at 10% must keep it at 50%, so the choice comes from a stable hash of the user ID: users whose bucket is below the percentage are in, and raising the percentage only adds users.',
      },
      {
        title: 'Decide from evidence, not one bad minute',
        body: 'Error rates are noisy. One bad minute may be chance, so rollback waits for a run of unhealthy minutes, and promotion for a run of healthy ones. A minute with too little traffic says almost nothing and is skipped. Comparing errors × 100 with the allowed percent × requests keeps the decision in whole numbers, so a rate exactly at the limit is judged the same way every time.',
      },
      {
        title: 'What these reps check',
        body: 'These reps plan and judge deploys from data passed to your functions: instance names, events, minutes, and request counts. They do not start instances, move traffic, or read live metrics. The hash used for buckets is FNV-1a, chosen because it is short and easy to follow; it is fine for spreading users evenly but not for anything secret.',
      },
    ],
    example:
      'flag new-checkout, user u-1004\nFNV-1a("new-checkout:u-1004") % 100 = 9\n\nat 5%  → 9 < 5 is false  → off\nat 10% → 9 < 10 is true  → on\nat 50% → 9 < 50 is true  → still on',
    walkthrough: [
      'The flag name and the user ID are joined with ":" and hashed, so every request for this user gets the same bucket, 9.',
      'At 5% only buckets 0 to 4 are on, so this user does not have the feature yet.',
      'At 10% buckets 0 to 9 are on, so the user is added.',
      'Raising the percentage never removes a user, because their bucket does not change.',
    ],
    mistakes: [
      'Rounding a rolling batch down to 0, so the update never moves.',
      'Choosing rollout users at random per request, so the feature flickers on and off for one person.',
      'Switching traffic to an environment before it has passed its checks.',
      'Rolling back on a single bad minute, or judging a minute with almost no traffic.',
    ],
    questions: [
      q(
        'rolling-batch-floor-v1',
        'A service has 5 instances and allows 10% unavailable. How many instances does each batch update?',
        '',
        ['0, so the update waits', '1', '5'],
        1,
        '5 × 10% is 0.5, which rounds down to 0, but a batch is never smaller than 1, or the update would never move.',
      ),
      q(
        'rollout-stable-hash-v1',
        'Why hash the user ID instead of choosing randomly on each request?',
        '',
        ['Hashing is faster', 'So each user always gets the same answer', 'So more users get the feature'],
        1,
        'A hash gives the same bucket every time, so a user does not see the feature appear and disappear between requests.',
      ),
      q(
        'blue-green-switch-v1',
        'Green has the new version but its health check failed. What should a switch do?',
        '',
        ['Switch anyway and watch the errors', 'Refuse, and keep blue live', 'Switch half the traffic'],
        1,
        'Blue/green only switches to an environment that passed its checks; blue keeps serving until green is healthy.',
      ),
      q(
        'canary-quiet-minute-v1',
        'A canary minute had 8 requests and 2 errors. The policy needs at least 100 requests to judge a minute. What does that minute count as?',
        '',
        ['Unhealthy, 25% errors', 'Nothing; it is skipped', 'Healthy, too small to matter'],
        1,
        'With so few requests the rate is mostly chance, so the minute is skipped: it neither counts nor breaks a run.',
      ),
    ],
    repIds: ['devops-rolling-batches', 'devops-percent-rollout', 'devops-blue-green', 'devops-canary-schedule', 'devops-canary-verdict'],
    related: ['container-images', 'ci-pipelines'],
  },
  {
    id: 'service-health',
    title: 'Health: liveness, readiness, restarts, and draining',
    summary:
      'Tell liveness from readiness, put instances in and out of service from runs of checks, back off between restarts, and drain requests before shutting down.',
    prerequisites: ['deploy-strategies'],
    objectives: [
      'Answer liveness from whether the process is stuck, and readiness from startup, shutdown, and required dependencies.',
      'Use runs of passing and failing checks to add and remove instances, and set check timing that fits a slow start.',
      'Back off between restarts, and shut down by finishing work in progress within a grace period.',
    ],
    sections: [
      {
        title: 'Two different questions',
        body: 'Liveness asks whether the process is stuck and needs a restart; readiness asks whether it should get traffic right now. A dependency that is down, such as the database, makes an instance not ready, but restarting it would not fix the database, so liveness ignores dependencies. If liveness failed whenever the database did, every instance would restart at once and the outage would get worse. An instance that is still starting or is shutting down is alive but not ready.',
      },
      {
        title: 'Decide from runs of checks',
        body: 'Load balancers and orchestrators check every few seconds and act only on runs: several failures in a row to remove an instance or restart it, several passes in a row to add it back. A single blip changes nothing. The timing has to fit the service: a liveness check that starts before a slow service has finished starting fails until it restarts the container, and the restart starts the slow startup over again.',
      },
      {
        title: 'Back off, then shut down gracefully',
        body: 'A container that keeps crashing is restarted after growing delays, doubling up to a limit, and the delays start over once it has stayed up for a while. When an instance is told to stop, it keeps accepting briefly while the load balancer stops sending traffic, then refuses new requests, lets those in progress finish, and is stopped by force when the grace period ends. Requests still running then are cut off, which is why long requests need a long enough grace period.',
      },
      {
        title: 'What these reps check',
        body: 'These reps work from states, check results, and times passed to your functions, in whole seconds. The checks show that the functions apply the stated policies; they do not run an orchestrator, send signals, or serve requests.',
      },
    ],
    example:
      'database down for every instance\n\nliveness: 200 (the process is fine)\nreadiness: 503, "database is down"\n\nif liveness also failed → every instance restarts → none can serve when the database returns',
    walkthrough: [
      'The process is not stuck, so liveness passes and the orchestrator leaves it running.',
      'A required dependency is down, so readiness fails and the load balancer stops sending it traffic.',
      'When the database comes back, readiness passes again and traffic returns without any restart.',
      'Tying liveness to the database would restart every instance at the same moment, adding a startup delay to the outage.',
    ],
    mistakes: [
      'Failing liveness because a dependency is down, so a shared outage restarts every instance.',
      'Starting liveness checks before a slow service has finished starting, which causes a restart loop.',
      'Removing an instance after one failed check, so normal blips cause churn.',
      'Exiting as soon as the stop signal arrives, which fails every request still in progress.',
    ],
    questions: [
      q(
        'liveness-dependency-v1',
        "The database is down. What should an instance's liveness check answer?",
        '',
        ['Fail, so the instance restarts', 'Pass, because restarting will not fix the database', 'Fail only for the first instance'],
        1,
        'Liveness asks whether this process is stuck. A down database is readiness information; restarts would not help and would make the outage worse.',
      ),
      q(
        'readiness-shutdown-v1',
        'An instance has been told to stop and is finishing its last requests. What should readiness answer?',
        '',
        ['Ready, it is still running', 'Not ready, so no new traffic is sent', 'Not live'],
        1,
        'It should finish what it has but get no new requests, which is exactly what failing readiness does.',
      ),
      q(
        'liveness-initial-delay-v1',
        'A service takes 60 seconds to start. Its liveness check starts at 10 seconds, runs every 10, and restarts after 3 failures. What happens?',
        '',
        ['It starts normally at 60 seconds', 'It is restarted at 30 seconds, again and again', 'It is never checked'],
        1,
        'The checks at 10, 20, and 30 seconds fail before startup ends, so it restarts at 30 and the startup begins again.',
      ),
      q(
        'restart-backoff-v1',
        'Restarts wait 10 seconds, doubling each time up to 300. How long is the wait before the fourth restart in a crash loop?',
        '',
        ['40 seconds', '80 seconds', '300 seconds'],
        1,
        'The waits are 10, 20, 40, then 80 seconds.',
      ),
    ],
    repIds: [
      'devops-health-endpoints',
      'devops-probe-thresholds',
      'devops-restart-backoff',
      'devops-liveness-restart',
      'devops-graceful-drain',
    ],
    related: ['deploy-strategies', 'retries'],
  },
  {
    id: 'cron-schedules',
    title: 'Schedules: cron expressions, time zones, and clock changes',
    summary:
      'Read the five fields of a cron expression, find the next run, and handle the local times that daylight saving time skips or repeats.',
    prerequisites: ['service-health'],
    objectives: [
      'Expand cron fields with lists, ranges, and steps, and apply the rule that joins the two day fields.',
      'Find the next run of a schedule after a given instant, in UTC and in a named time zone.',
      'Turn a local wall-clock time into an instant, and state what happens to times that are skipped or repeated.',
    ],
    sections: [
      {
        title: 'Five fields',
        body: 'A cron expression has five fields: minute, hour, day of month, month, and day of week, where 0 and 7 both mean Sunday. Each field is "*" for every value, a number, a range such as 9-17, a list such as 1,15, or a step such as */15 for every fifteenth value. A job runs at every minute that all five fields allow, so "* 9 * * *" runs sixty times between 9:00 and 9:59, while "0 9 * * *" runs once.',
      },
      {
        title: 'The two day fields',
        body: 'The day of month and the day of week are joined by a rule that surprises people. If both are restricted, a day matches when either one does: "0 12 13 * 5" runs on every 13th and on every Friday, not only on Friday the 13th. If either field starts with "*", both must match, which in practice means the other field decides.',
      },
      {
        title: 'Schedules live in local time',
        body: "A schedule usually means local wall-clock time, such as 01:30 in New York, and a wall-clock time is not always one instant. When clocks spring forward, a local time such as 02:30 does not happen that day; when they fall back, 01:30 happens twice, an hour apart. A scheduler has to choose: these reps skip a time that does not exist and run a repeated time only at its earlier instant, so the job never runs twice in one night. Reading local times with Intl.DateTimeFormat and an explicit timeZone keeps the answer independent of the machine's own time zone.",
      },
      {
        title: 'What these reps check',
        body: 'The current time and the time zone are always passed in, so the functions never read a clock, and every answer is an exact instant. The time zone rules come from the JavaScript engine, which uses the same data in Node and Chromium for the dates in these checks. The checks do not run a scheduler or wait for any time to pass.',
      },
    ],
    example:
      '"30 1 * * *" in America/New_York, night of 2026-11-01 (clocks go back at 02:00)\n\n05:30Z = 01:30 EDT → runs (first 01:30)\n06:30Z = 01:30 EST → skipped (repeat)\nnext run: 2026-11-02T06:30Z = 01:30 EST',
    walkthrough: [
      'At 05:30 UTC it is 01:30 daylight time in New York, which matches the schedule, so the job runs.',
      'At 06:00 UTC the clocks go back an hour, so at 06:30 UTC it is 01:30 again, now standard time.',
      'That second 01:30 is a repeat, so the job does not run again that night.',
      'The next run is 01:30 the following day, which is 06:30 UTC now that the offset is five hours.',
    ],
    mistakes: [
      'Writing "* 9 * * *" for "9 a.m.", which runs every minute of that hour.',
      'Expecting "0 12 13 * 5" to mean only Friday the 13th.',
      "Converting local times with the machine's time zone instead of the schedule's.",
      'Running a job twice on the night clocks go back, or failing on the time clocks skip.',
    ],
    questions: [
      q(
        'cron-every-minute-v1',
        'How many times between 9:00 and 9:59 does "* 9 * * *" run?',
        '',
        ['Once', '60 times', 'Never'],
        1,
        'The minute field "*" allows every minute, so the job runs at each of the 60 minutes in hour 9.',
      ),
      q(
        'cron-day-either-v1',
        'Does "0 12 13 * 5" run at noon on Friday the 6th?',
        '',
        [
          'No, only on Friday the 13th',
          'Yes, because both day fields are restricted, either may match',
          'Only in months with a Friday the 13th',
        ],
        1,
        'With both day fields restricted, a day matches if it is the 13th or a Friday.',
      ),
      q(
        'dst-gap-v1',
        'In New York, clocks jump from 02:00 to 03:00 on 2026-03-08. When does a job scheduled at 02:30 run that day, under the rule used in these reps?',
        '',
        ['At 03:30', 'It does not run that day', 'At 02:30 standard time'],
        1,
        '02:30 does not exist that day. These reps skip it; some schedulers run it right after the jump instead, which is why the rule must be stated.',
      ),
      q(
        'dst-overlap-v1',
        "On 2026-11-01, 01:30 happens twice in New York. How many times does a 01:30 job run that night under these reps' rule?",
        '',
        ['Twice', 'Once, at the first 01:30', 'Once, at the second 01:30'],
        1,
        'A repeated local time runs only at its earlier instant, so the job runs once.',
      ),
    ],
    repIds: ['devops-cron-field', 'devops-cron-matches', 'devops-local-to-utc', 'devops-cron-next-utc', 'devops-cron-next-zone'],
    related: ['service-health', 'dependency-injection'],
  },
  {
    id: 'observability',
    title: 'Observability: percentiles, error budgets, and alerts',
    summary:
      'Summarise response times with a stated percentile method, measure how fast an error budget is being spent, and write alerts that page for real problems without flapping.',
    prerequisites: ['service-health'],
    objectives: [
      'Compute a percentile by the nearest-rank method and explain why percentiles beat averages for latency.',
      'Turn an SLO target into an error budget and a burn rate with exact whole-number arithmetic.',
      'Combine windows, delays, and two limits so an alert pages for sustained problems and does not flap.',
    ],
    sections: [
      {
        title: 'Averages hide the slow requests',
        body: 'If 99 requests take 100 ms and one takes 10 seconds, the average is about 200 ms, which describes no request at all. A percentile answers a clearer question: p95 is the time that 95% of requests were at or under. There are several methods; the nearest-rank method sorts the values and picks the one at rank p × n / 100, rounded up, so the answer is always a real measurement. Percentiles cannot be averaged across routes or servers; each must be computed from its own samples.',
      },
      {
        title: 'Error budgets turn a target into a number',
        body: 'A service level objective of 99.9% success over 30 days allows 0.1% of requests to fail. That allowance is the error budget. The burn rate compares the current error rate with the budget: 1 spends exactly the budget over the period, and 14.4 would spend a 30-day budget in about two days. Writing the target in basis points, such as 9990 for 99.90%, keeps the arithmetic in whole numbers.',
      },
      {
        title: 'Alerts that mean something',
        body: 'An alert should page only when someone needs to act. A short window alone pages for every blip; a long window alone pages late and keeps paging after the problem has ended. Requiring a high burn rate over both a long and a short window pages fast for real problems and stops as soon as they end. For a value that hovers around a limit, waiting for several bad samples before firing and requiring the value to fall below a lower limit before resolving stops the alert from flapping.',
      },
      {
        title: 'What these reps check',
        body: 'These reps compute from lists of measurements passed to your functions. The checks show that the functions follow the stated methods exactly; they do not read a metrics system, send alerts, or show that a threshold is right for a real service.',
      },
    ],
    example:
      'response times (ms): 100, 110, 120, 130, 150, 200, 900\n\naverage ≈ 244\np95 by nearest rank: rank = ceil(95 × 7 / 100) = 7 → 900\np50 by nearest rank: rank = ceil(50 × 7 / 100) = 4 → 130',
    walkthrough: [
      'The values are already sorted from smallest to largest.',
      'For p95 the rank is 95 × 7 / 100 = 6.65, rounded up to 7, so p95 is the 7th value, 900 ms.',
      'For p50 the rank is 3.5, rounded up to 4, so the median is 130 ms.',
      'The average, about 244 ms, matches no request and hides the one slow request entirely.',
    ],
    mistakes: [
      'Reporting the average latency instead of a percentile, or a percentile without saying which method.',
      'Averaging the p95 of several routes to get an overall p95.',
      'Writing 99.9% as a decimal and letting rounding decide whether the budget is spent.',
      'Paging on one short window, so every blip wakes someone, or resolving as soon as a value dips under the firing limit.',
    ],
    questions: [
      q(
        'percentile-average-v1',
        '99 requests take 100 ms and one takes 10,000 ms. Which number shows users a slow request exists?',
        '',
        ['The average', 'p99 or the maximum', 'The median'],
        1,
        'The average is about 199 ms and the median 100 ms; only a high percentile or the maximum shows the 10-second request.',
      ),
      q(
        'error-budget-share-v1',
        'An SLO is 99.9% over 1,000,000 requests. How many errors does the budget allow?',
        '',
        ['100', '1,000', '10,000'],
        1,
        '0.1% of 1,000,000 is 1,000 requests.',
      ),
      q(
        'burn-rate-meaning-v1',
        'The burn rate over the last hour is 2. What does that mean?',
        '',
        ['Two errors happened', 'The budget is being spent twice as fast as the SLO allows', 'The SLO is twice as strict'],
        1,
        'At a burn rate of 2, a 30-day budget would run out in 15 days.',
      ),
      q(
        'alert-hysteresis-v1',
        'An alert fires at 90% CPU and resolves below 80%. CPU now moves between 85% and 89%. What does the firing alert do?',
        '',
        ['Resolves and fires again each minute', 'Stays firing', 'Resolves'],
        1,
        'Values between the two limits neither fire a resolved alert nor resolve a firing one, which is what stops flapping.',
      ),
    ],
    repIds: ['devops-percentile', 'devops-error-budget', 'devops-route-latency', 'devops-burn-alert', 'devops-alert-hysteresis'],
    related: ['service-health', 'deploy-strategies'],
  },
  {
    id: 'incident-response',
    title: 'Incidents: timelines, durations, and blameless postmortems',
    summary:
      "Put an incident's events on one clock, measure how long detection and mitigation took, find what changed just before, and write a postmortem that explains without blaming.",
    prerequisites: ['observability'],
    objectives: [
      'Merge events from sources in different time offsets into one ordered timeline, dropping repeats.',
      'Measure time to detect, mitigate, and resolve, and find impact windows and recent changes.',
      'Assemble a postmortem skeleton from records and write its explanation blamelessly yourself.',
    ],
    sections: [
      {
        title: 'One clock, one order',
        body: 'During an incident, evidence comes from application logs, load balancers, alerts, deploy records, and chat, each with its own clock and often its own time offset. Before anyone argues about causes, every event goes onto one clock, usually UTC, in one order. Comparing instants rather than the text of times is what makes 15:01+07:00 come before 08:02Z.',
      },
      {
        title: 'Durations and changes',
        body: 'Three durations summarise an incident: from the start of user impact to the first alert (time to detect), to the moment harm stopped (time to mitigate, often by rolling back), and to the fix of the cause (time to resolve). Most incidents follow a change, so listing the deploys, config edits, and flag changes shortly before the impact gives the first leads, newest first. A change shortly before is a lead to check, not proof.',
      },
      {
        title: 'Blameless postmortems',
        body: 'A postmortem records what happened, why it was possible, and what will change. It is blameless: it asks how the system and the process let a reasonable action cause harm, because people will hide mistakes if mistakes are punished, and the same gap will catch the next person. Facts such as the duration, the timeline, and the action items can be assembled from records; the explanation must be written by the people involved.',
      },
      {
        title: 'What these reps check',
        body: "These reps work from event records passed to your functions. The checks show that timelines, durations, windows, and the postmortem skeleton follow the stated rules. The postmortem writing itself, in the last rep's Explain step, is self-reviewed against the guide and never graded; no check can tell whether an explanation is true or blameless.",
      },
    ],
    example:
      'chat  15:01+07:00  "Ada: checkout is failing"   → 08:01Z\napp   08:02Z       "errors rise"                → 08:02Z\nlb    03:00:30-05:00 "502 responses"            → 08:00:30Z\n\ntimeline: 08:00:30 lb, 08:01 chat, 08:02 app',
    walkthrough: [
      'Each time is read as an instant, whatever its offset.',
      "The load balancer's 03:00:30 at −05:00 is 08:00:30 UTC, the earliest event.",
      'The chat message at 15:01 at +07:00 is 08:01 UTC, a minute before the application logged rising errors.',
      "In one order, the timeline shows users noticed the problem before the application's own error log did.",
    ],
    mistakes: [
      'Sorting events by the text of their times, so offsets put them in the wrong order.',
      'Counting the same log line twice because it was shipped twice.',
      'Treating the last change before an incident as its proven cause.',
      'Writing a postmortem that names who made a mistake instead of what let the mistake cause harm.',
    ],
    questions: [
      q(
        'timeline-offsets-v1',
        'Which happened first: 15:01 at +07:00 or 08:02 at Z (UTC)?',
        '',
        ['08:02 UTC', '15:01 at +07:00, which is 08:01 UTC', 'They are the same moment'],
        1,
        '15:01 − 7 hours is 08:01 UTC, one minute before 08:02 UTC.',
      ),
      q(
        'time-to-detect-v1',
        'Users were affected from 08:00, the alert fired at 08:12, and a rollback stopped the errors at 08:20. What was the time to detect?',
        '',
        ['20 minutes', '12 minutes', '8 minutes'],
        1,
        'Time to detect runs from the start of impact to the first alert: 08:00 to 08:12.',
      ),
      q(
        'change-before-incident-v1',
        'A deploy finished five minutes before the errors began. What does that establish?',
        '',
        ['The deploy caused the incident', 'The deploy is a lead worth checking first', 'Nothing at all'],
        1,
        'A change shortly before impact is the most likely place to start looking, but it has to be confirmed, for example by rolling it back.',
      ),
      q(
        'blameless-postmortem-v1',
        'Which sentence fits a blameless postmortem?',
        '',
        ['Sam ran the wrong command', 'The script accepted a production database name without a confirmation step', 'Someone was careless'],
        1,
        'It describes what allowed the action to cause harm, which is what the action items can change.',
      ),
    ],
    repIds: [
      'devops-incident-timeline',
      'devops-incident-durations',
      'devops-impact-windows',
      'devops-changes-before',
      'devops-postmortem-draft',
    ],
    related: ['observability', 'deploy-strategies'],
  },
]
