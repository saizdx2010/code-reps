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
  'devops-read-port': {
    reasoning:
      'Checking the whole trimmed text against a digits-only pattern before converting means the number can only come from text that is exactly a number, so nothing is silently dropped or reinterpreted. The range check then applies to that exact number. A missing or blank value is a different case from an invalid one: it means "not set", so the default applies instead of an error.',
    trace:
      'For "8080abc", the pattern /^[0-9]+$/ fails at "a", so the result is the error, although parseInt would give 8080. For "1e3", the pattern fails at "e", although Number would give 1000. For "0080", the pattern matches and Number gives 80, which is in range. For "   ", trimming leaves "", so the default 3000 applies.',
    alternative:
      'Number.isInteger(Number(raw)) accepts "1e3" and " 8080 " without trimming, and parseInt accepts trailing text; either needs the pattern anyway. A schema library can express the same rule, but it still has to be told that text such as "1e3" is not a port.',
    counterexample:
      'parseInt(raw, 10) with a range check accepts "8080abc" as 8080, which "Refuses trailing letters" refuses. Checking raw === undefined instead of trimming first treats "   " as invalid instead of using the default.',
    transfer:
      'Read HOST too, defaulting to "127.0.0.1", and refuse "0.0.0.0" unless ALLOW_PUBLIC is "true". Decide how the two settings report errors together. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-validate-env': {
    reasoning:
      'Each setting is handled in two separate steps: choose the text (the value, else the default, else nothing) and then convert it by type. Collecting errors instead of returning early means one run reports every problem, and going through the schema in order makes that report stable. A default passes through the same conversion as a value, so a setting has one meaning however it was supplied.',
    trace:
      'For WORKERS "many", DEBUG "maybe", no DATABASE_URL, and no PORT with default "3000": DATABASE_URL has no value or default and is required, so "DATABASE_URL is required". WORKERS fails the integer pattern. PORT uses "3000" and becomes 3000. DEBUG lowercases to "maybe", which is not a boolean word. The result lists the three errors in schema order.',
    alternative:
      'A schema library would give richer types, such as URLs and enums, and generated TypeScript types for the config. Throwing on the first error is simpler but makes a broken deployment take several restarts to fix.',
    counterexample:
      'Returning at the first error reports only "DATABASE_URL is required" in "Reports every problem in schema order". Using the default only when the variable is absent, not when it is blank, reports WORKERS "  " as an invalid integer instead of using 4.',
    transfer:
      'Add a type "list" for comma-separated text, such as ALLOWED_ORIGINS. Decide how to treat spaces around commas, empty items, and an empty list. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-mask-secrets': {
    reasoning:
      'Masking longer values first guarantees that when a shorter secret is part of a longer one, the longer one is replaced whole before the shorter one could split it. Treating each value as plain text means every character in it is matched literally, which matters because tokens contain ".", "+", and "*". Skipping very short values avoids turning ordinary text into placeholders.',
    trace:
      'With SHORT "abc123" and LONG "token-abc123" in the line "sent token-abc123", sorting by length puts "token-abc123" first, so the line becomes "sent ***" and "abc123" no longer appears. In the other order, "abc123" is replaced first, giving "sent token-***", and the longer value no longer matches.',
    alternative:
      'A single regular expression built from all values, with each value escaped and the alternatives ordered longest first, does the work in one pass per line. CI services also mask common encodings of a secret, such as its base64 form, which this rep leaves out.',
    counterexample:
      'new RegExp(value, "g") treats "p@ss.w*rd+" as a pattern, so the literal password is not matched and leaks in "Treats a value as plain text". Masking in the order the names were listed fails "Masks a longer value before a shorter one inside it".',
    transfer:
      'Also mask the value when it appears URL-encoded, such as "p%40ss" for "p@ss". Decide whether the encoded form needs the same length limit and in what order the forms are masked. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-parse-dotenv': {
    reasoning:
      'Each line is read in a fixed order so that each rule only sees what the earlier ones left: skip comments, remove export, split at the first "=", check the name, then decide between a quoted value and an unquoted one. Checking for quotes before looking for a comment is what lets "#" survive inside quotes, and requiring a space before "#" keeps URLs and colours such as "#fff" intact.',
    trace:
      'For GREETING="hello # world", the first "=" splits the name GREETING from "\\"hello # world\\"", which starts and ends with ", so the value is hello # world and the "#" is never treated as a comment. For DEBUG=true # for now, the value is not quoted, so " #" starts a comment and the value becomes "true". For "2FAST=yes", the name starts with a digit, so line 4 is reported.',
    alternative:
      'A library such as dotenv also handles escapes and multi-line quoted values; writing the rules out shows what a loader decides for you. Rejecting the whole file on the first bad line is stricter, but reporting line numbers lets a person fix every problem at once.',
    counterexample:
      'Removing comments before checking quotes turns GREETING="hello # world" into "\\"hello", which the example check refuses. Splitting at the last "=" turns KEY=a=b into a name "KEY=a", which is invalid.',
    transfer:
      'Allow ${NAME} inside a value to refer to a variable defined earlier in the file. Decide what happens with an undefined name, a name defined later, and a reference inside single quotes. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-config-drift': {
    reasoning:
      'The report has to cover every name in either environment, so the names come from the union of both maps, sorted for a stable order. Presence is checked with hasOwn, not truthiness, so an empty value counts as set. Whether to hide a value is decided only for names whose values differ, and a name missing on one side never shows its value at all.',
    trace:
      'For staging {PORT: "8080", DB_PASSWORD: "a1"} and production {PORT: "80", DB_PASSWORD: "b2", CDN: "on"}, the sorted names are CDN, DB_PASSWORD, PORT. CDN is only in production. DB_PASSWORD differs and is sensitive, so both values show "***". PORT differs and is not sensitive, so 8080 and 80 are shown.',
    alternative:
      'Comparing a hash of each secret value, instead of hiding it completely, would show whether two secrets match without revealing them, but even a hash of a short secret can be guessed. Reporting equal names too, as "same", makes a longer report that is easier to scan for completeness.',
    counterexample:
      'Testing presence with staging[name] treats PROXY "" as missing, which "Counts an empty value as present" refuses. Sorting with localeCompare puts "a" before "B", which "Sorts names with the default sort" refuses.',
    transfer:
      'Some names are expected to differ, such as DATABASE_URL. Add a list of such names and decide whether they are skipped entirely or reported only when one side is missing. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-compare-versions': {
    reasoning:
      'A version is three numbers in order of importance, so the first part that differs decides and later parts cannot outweigh it. Turning each part into a number before comparing is what makes 10 greater than 9; returning only -1, 0, or 1 keeps the result usable as a sort comparator and as a plain answer.',
    trace:
      'For "1.10.0" and "1.9.0", the parts are [1, 10, 0] and [1, 9, 0]. Major is equal, minor is 10 against 9, so the result is 1 and patch is never looked at. For "v2.0.0" and "v10.0.0", removing "v" gives majors 2 and 10, so the result is -1, although "v2" sorts after "v10" as text.',
    alternative:
      'Padding each part to a fixed width ("0001.0010.0000") makes text comparison work, but needs a maximum width. A semver library does the same work and also handles pre-releases, which this rep leaves for later.',
    counterexample:
      'a.localeCompare(b) returns -1 for "1.10.0" against "1.9.0". Returning left[index] - right[index] gives 6 for "1.2.10" against "1.2.4", which "Returns 1, not the difference" refuses.',
    transfer:
      'Accept versions with only two parts, such as "1.4", treating the missing patch as 0. Decide whether "1.4" and "1.4.0" are equal and how a tag such as "v1" should compare. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-next-version': {
    reasoning:
      'The release is only as large as its largest change, so the kinds are checked from breaking down and the first one present decides. Raising a part resets every part to its right because the new number starts a fresh series; the 0.x rule moves a breaking change down one place, because before 1.0.0 the minor number carries that meaning.',
    trace:
      'For "0.4.1" with ["breaking"], breaking is present and major is 0, so minor rises to 5 and patch resets: "0.5.0". For "1.9.9" with ["feature"], the parts are numbers, so minor becomes 10 and patch 0: "1.10.0". For "2.0.0" with only docs, nothing applies, so the version stays and release is false.',
    alternative:
      'Release tools such as semantic-release read commit messages for the same information; this rep takes the kinds already classified. Some teams treat the first breaking change in 0.x as the move to 1.0.0, which this contract does not.',
    counterexample:
      'Raising minor without resetting patch gives "1.5.2" for the example, which "Picks a feature over a fix" refuses. Adding to the text part gives "1.91.0" for "1.9.9", which "Adds as numbers" refuses.',
    transfer:
      'Add pre-releases: a flag asks for the next version as "-rc.1", and a following call on "2.0.0-rc.1" should give "-rc.2". Decide what a fix does to a pre-release version. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-sort-versions': {
    reasoning:
      'Precedence is a chain of tie-breakers, each used only when everything before it is equal: the three numbers, then whether there is a pre-release, then the identifiers in order, then their count. Build information is dropped before any of this, and a stable sort keeps versions with equal precedence in their original order instead of inventing one.',
    trace:
      'For 1.0.0-alpha.beta and 1.0.0-alpha.1, the main parts are equal and both have pre-releases. The first identifiers are both "alpha". The second identifiers are "beta" and "1"; "1" is only digits and "beta" is not, so 1 comes first and alpha.1 sorts before alpha.beta. For beta.11 and beta.2, both second identifiers are numbers, so 2 comes before 11.',
    alternative:
      'Comparing the whole pre-release as text is shorter but puts beta.11 before beta.2. A semver library implements exactly these rules; writing them once shows why its order can surprise people reading a release list.',
    counterexample:
      'Comparing identifiers with localeCompare puts "beta" before "Beta", which "Compares words by character code" refuses. Splitting the whole version at every "-" breaks "1.0.0-x-y" into the wrong identifiers.',
    transfer:
      'Return only the latest stable version and the latest pre-release newer than it, or null. Decide what happens when every version is a pre-release. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-lockfile-diff': {
    reasoning:
      'Every package name falls into exactly one case: only after, only before, both and equal, or both and different. Going through the sorted union once puts each package in at most one list and keeps every list sorted. The leftmost part that differs both decides the direction and names the kind, so a major upgrade is reported as major even if its minor number went down.',
    trace:
      'For vite 5.4.9 → 6.0.1, the parts are [5, 4, 9] and [6, 0, 1]; the first difference is at index 0, and 6 > 5, so it is an upgrade of kind "major". For lodash 4.9.0 → 4.10.0, the first difference is the minor part, 10 > 9, so it is a minor upgrade, although "4.10.0" < "4.9.0" as text.',
    alternative:
      'A package manager can print this diff for you, and also shows changes deep in the dependency tree that no package file names. Grouping upgrades by kind, majors first, would make a review comment easier to scan than one name-sorted list.',
    counterexample:
      'Comparing versions as text reports lodash 4.9.0 → 4.10.0 as a downgrade in "Compares versions as numbers". Naming the kind from the largest difference instead of the leftmost one calls vite 5.4.9 → 6.0.1 a "minor" or "patch" change.',
    transfer:
      'Flag upgrades that cross a range in the package file, such as react ^18.2.0 moving to 19.0.0. Decide which inputs you need and how to report a package with no range. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-satisfies-range': {
    reasoning:
      "Every range form becomes a lowest allowed version and, except for >=, a first version that is not allowed, so one comparison function answers all four. The caret's limit comes from the first part of the base that is not 0, because in a 0.x or 0.0.x version that part is the one whose change may break callers.",
    trace:
      'For "0.3.0" against "^0.2.3", the base is [0, 2, 3]; major is 0 and minor is 2, so the limit is [0, 3, 0]. 0.3.0 is not below the limit, so it is refused. For "1.10.0" against "^1.9.0", the limit is [2, 0, 0]; 1.10.0 is at least 1.9.0 and below 2.0.0 when compared as numbers, so it is accepted.',
    alternative:
      'Translating each range into a pair of comparisons, such as >=1.2.3 <2.0.0, is how package managers describe them and makes it easy to add more forms later. A table of examples is clearer for people, but cannot cover every version.',
    counterexample:
      'Using the major-version limit for every caret range accepts 0.3.0 for ^0.2.3, which "Stops a 0.x caret range at the next minor" refuses. Allowing the upper limit itself with <= accepts 2.0.0 for ^1.2.3.',
    transfer:
      'Add ranges joined by "||", such as "^1.2.0 || ^2.0.0". Decide how spaces around "||" are handled and what an empty side means. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-job-waves': {
    reasoning:
      'A job can start only after all of its needs, so placing each wave from jobs whose needs are already placed guarantees that order. Finding the whole wave before marking any of it placed keeps a job out of the wave of a job it needs. If a round finds nothing ready while jobs remain, every remaining job waits, directly or not, on a loop, so the leftover list is exactly what can never run.',
    trace:
      'For deploy needs a, a needs b, b needs a, and lint needs nothing: every need exists. Round one finds only lint. Round two finds nothing ready: a waits for b, b for a, and deploy for a. So the result is CYCLE with deploy, a, and b in file order, although deploy itself is not part of the loop.',
    alternative:
      "A depth-first search can find the actual loop, such as a → b → a, which makes a clearer error message than the list of stuck jobs. Kahn's algorithm with a queue gives one order instead of waves; waves show what can run at the same time.",
    counterexample:
      'Marking each ready job as placed the moment it is found lets a job join the wave of a job listed just before it: in "Waits for the slower branch of a diamond" all four jobs land in the first wave. Checking loops before unknown needs reports CYCLE in "Checks needs before loops".',
    transfer:
      'Allow at most two jobs to run at once. Decide how waves split when more than two jobs are ready, and which jobs go first. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-cache-key': {
    reasoning:
      'The key must change exactly when the cache contents could change, so it is built only from the key files, and every one of them, missing or not, contributes something. Sorting and removing repeats makes the key independent of how the list was written, and putting each path in the hashed text means moving the same content to another file changes the key.',
    trace:
      'For keyFiles [".nvmrc", "package-lock.json", ".nvmrc"], the set gives two paths and sorting puts ".nvmrc" first. The text is ".nvmrc\\n24\\npackage-lock.json\\n{...}\\n", whose FNV-1a hash is 5a74218d, the same as for the example\'s order. A missing yarn.lock adds "yarn.lock\\n<missing>\\n", which hashes differently from "yarn.lock\\n\\n" for an empty one.',
    alternative:
      'CI services hash files with SHA-256 through a helper such as hashFiles, which is far less likely to give two different inputs the same key. Hashing each file separately and joining the hashes avoids building one long text, at the cost of a longer key.',
    counterexample:
      'Hashing the key files in the given order changes the key in "Ignores the order and repeats of key files". Leaving out padStart gives "4961fcd" instead of "04961fcd". Treating an empty file as missing with files[path] ?? breaks nothing, but files[path] || "<missing>" does.',
    transfer:
      'Add the Node.js version to the key, read from .nvmrc when present and "default" otherwise. Decide whether .nvmrc should then still be a key file. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-cache-restore': {
    reasoning:
      'An exact match means the inputs are the same, so it is always the best answer. Prefixes go from most to least specific, so the first prefix with any match gives the closest available cache, and within it the newest cache is the one most likely to need the least extra work. Only a strictly newer cache replaces the current choice, which keeps the earlier one on a tie.',
    trace:
      'For key deps-linux-9a1 with restore keys ["deps-linux-", "deps-"] and caches deps-linux-5f2 (100) and deps-macos-77c (900), no key is exact. The first prefix matches only deps-linux-5f2, so it is returned, although deps-macos-77c is newer: a macOS cache would be a worse starting point for a Linux job.',
    alternative:
      'Choosing the newest cache across all prefixes is simpler but can restore a cache for the wrong operating system. Restoring nothing on a miss is always safe; a partial restore is faster but means the job must check and update what it restored.',
    counterexample:
      'Searching all prefixes together returns deps-macos-77c in "Uses the first prefix that matches". Using >= when comparing createdAt keeps the later cache on a tie, which "Keeps the earlier cache on a tie" refuses.',
    transfer:
      'Caches older than seven days are deleted. Add a now input and ignore expired caches. Decide whether an expired exact match should still win. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-pipeline-duration': {
    reasoning:
      "A job's finish time depends only on the finish times of its needs, so working them out first, and remembering each answer, handles jobs listed in any order and works each job out once. Walking back from the last job to finish, always through the need that finished last, follows exactly the waits that made the pipeline as long as it is.",
    trace:
      'For the example, deploy is listed first, so its finish needs test and lint. test needs build: build finishes at 5, test at 5 + 8 = 13. lint finishes at 3. deploy starts at max(13, 3) = 13 and finishes at 15. Walking back from deploy, test (13) beats lint (3), and test leads to build, so the critical path is build, test, deploy.',
    alternative:
      'Processing jobs wave by wave, as in the job-order rep, avoids recursion and works for any order too. Recording, for each job, which need it waited for while computing finish times lets the critical path be read off without comparing again.',
    counterexample:
      'Computing jobs in list order without waiting for their needs gives deploy a start of 0 in the example. Starting the path from the last job in the list instead of the last to finish returns ["build", "test"] in "Ends at the job that finishes last".',
    transfer:
      'Each job also waits 1 minute for a machine before it starts. Decide whether that delay is added once per job or once per wave, and what that does to the critical path. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-skip-unchanged': {
    reasoning:
      "A job's result can change only if its own inputs changed or an output it uses changed, and an output changes whenever the job that makes it runs. So a job runs when one of its paths matches a changed file or any job it needs runs. Deciding a job only after its needs, and remembering each decision, makes the rule work for any order and settles each job once.",
    trace:
      "For release needs package, package needs build, and build reads src/, with only src/main.ts changed: release asks about package, which asks about build. build matches src/, so it runs; package runs because build runs; release runs because package runs. The result lists all three in file order, although only build's files changed.",
    alternative:
      'Many CI services offer path filters per workflow, which is simpler but cannot express that a job must run when an upstream job runs. Build tools for monorepos compute this from the import graph instead of hand-written paths, which avoids paths that are out of date.',
    counterexample:
      'Ignoring needs skips deploy-api in the example even though test-api runs. Matching folders with includes instead of startsWith runs api for "src/api/index.ts" in "Matches a folder only at the start".',
    transfer:
      'Add a job flag alwaysRun for jobs such as security scans. Decide whether a job that needs an alwaysRun job must then always run too. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-layer-rebuild': {
    reasoning:
      'A layer is reusable only if everything it was built from is unchanged: its own copied files and every layer beneath it. So the first step whose copied files changed starts a rebuild, and from then on every step rebuilds, whatever it copies. A step that copies nothing can only be rebuilt by an earlier step, because the step list itself is unchanged here.',
    trace:
      'For the example with package-lock.json changed, FROM copies nothing and stays cached. The second step copies package-lock.json, which changed, so it rebuilds and the flag turns on. RUN npm ci and COPY src/ then rebuild because the flag is on, although src/ did not change.',
    alternative:
      'A build could check each step only against its own inputs, which would be cheaper but wrong: the install output depends on the copied lockfile layer beneath it. Real builders also hash the files a step copies, so touching a file without changing its content does not rebuild.',
    counterexample:
      'Checking each step only against its own sources leaves RUN npm run build cached in the example. Matching folders with includes rebuilds COPY src/ for "tests/src/a.ts" in "Matches a folder only from the start of a path".',
    transfer:
      'Add an ARG step whose value comes from the build command, such as a version number. Decide how a changed value is passed in and which steps it rebuilds. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-image-tags': {
    reasoning:
      'Each kind of ref answers a different question, so each gets its own tags: a release says which version it is and moves the floating tags 1.4, 1, and latest; a pre-release must not move them, so it gets only its full version; a branch gets a readable converted name. The commit tag is added to every build, so whatever runs can be traced to its code.',
    trace:
      'For refs/heads/@@hotfix, the branch is "@@hotfix". Lowercasing leaves it; replacing invalid characters gives "--hotfix"; removing leading "." and "-" gives "hotfix", which is kept with "sha-abcdef0". For refs/tags/v2.0.0-rc.1, the version pattern matches with the pre-release "-rc.1", so the only name tag is "2.0.0-rc.1" and latest does not move.',
    alternative:
      'Tagging every build only with its commit is unambiguous but forces people to look up which commit is the release. Some teams also tag the date or the build number, which sorts well but carries no compatibility meaning.',
    counterexample:
      'Removing leading characters before replacing leaves "--hotfix" for "@@hotfix", because "@" is not removed by that step. Treating a branch named "1.2.3" as a release would move latest from a branch build, which "Treats a branch named like a version as a branch" refuses.',
    transfer:
      'Add tags for pull requests, refs/pull/42/merge, as "pr-42". Decide what happens when a pull request is updated and whether old pr tags should be removed. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-dockerignore': {
    reasoning:
      'Each line is a rule that either leaves a file out or brings it back, and the last matching rule wins, so a general rule followed by a specific exception works as written. The three pattern forms are kept distinct so each matches only what it says: a folder from the start, a file ending in any folder, or one path and everything under it.',
    trace:
      'For logs/keep.log with lines node_modules, *.log, !logs/keep.log, .env: node_modules does not match. *.log matches because the last part, keep.log, ends with ".log", so the file is left out for now. !logs/keep.log matches the path exactly, so it is kept. .env does not match, so the last decision, keep, stands.',
    alternative:
      'Listing the files to include instead of the ones to exclude makes it impossible to leak a new file by accident, at the cost of updating the list for every new folder. Real ignore files use glob patterns with "**", which are more flexible and harder to read.',
    counterexample:
      'Stopping at the first matching line drops logs/keep.log in the example, because *.log matches first. Matching "build" with startsWith also drops "builder.ts" in "Matches a name as a folder but not as a prefix".',
    transfer:
      'Support patterns that start with "**/", such as "**/temp", meaning the name in any folder. Decide how it combines with the folder rule and with exceptions. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-tag-cleanup': {
    reasoning:
      'Protection is decided before counting, so a running image or a release can never be pushed out by the allowance, and does not take a place from the branch builds the allowance is meant to keep. Sorting each branch newest first with a stable sort makes ties follow the list, and deleting everything past the allowance leaves exactly the newest few.',
    trace:
      'For branch b with tags new (900), old (100), and mid (500) and an allowance of 1, none is protected. Sorted newest first they are new, mid, old, so new is kept and mid and old are deleted, returned in the order of tags: old, mid.',
    alternative:
      'Deleting by age, such as anything older than 30 days, needs a current time and can delete every tag of a quiet branch. Keeping a fixed number per branch never empties a branch but keeps old tags of abandoned branches forever.',
    counterexample:
      'Counting protected tags toward the allowance deletes a-2 in "Keeps the allowance for unprotected tags". Protecting any name that starts with a digit protects "2.1", which "Protects only the exact version form" refuses.',
    transfer:
      'Delete every tag of a branch that was merged and deleted more than 14 days ago, except protected ones. Decide which inputs you need and how this rule combines with the allowance. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-multistage-rebuild': {
    reasoning:
      "Stages are worked out in order, so whether an earlier stage changed is known before any stage that uses it. Inside a stage the single-stage rule applies, with two more reasons to start rebuilding: the stage starts from a changed stage, or a step copies from one. A step that copies from a stage depends on that stage's result, not on the build folder, so changed files never affect it directly.",
    trace:
      'For docs, api, and final with only api/server.ts changed: docs copies docs/, which did not change, so it is cached. api copies api/, so it rebuilds and api is marked changed. In final, the first step copies from docs, which did not change, so it is cached; the second copies from api, which changed, so it rebuilds.',
    alternative:
      "A builder can also skip stages the final image never uses, which saves work but means a stage's status depends on the final target. Copying the whole compiled folder into one stage is simpler but makes the final image larger.",
    counterexample:
      'Testing changed files for a step that copies from a stage rebuilds final in "Ignores changed files for a copy from a stage". Marking a stage changed only when it has a rebuilt step misses "alias", which has no steps but starts from a changed stage.',
    transfer:
      'Let a stage start from an image whose digest can change, passed in as a list of updated images. Decide which stages and steps that rebuilds. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-rolling-batches': {
    reasoning:
      'The allowed share must become a whole number of instances, and rounding down keeps at least the promised number serving. A floor of one batch instance keeps the update moving even when the share rounds to nothing. Slicing in order gives consecutive batches whose sizes add up to every instance exactly once.',
    trace:
      'For 9 instances at 33%, 9 × 33 / 100 is 2.97, which rounds down to 2, so 7 are always serving. The batches are a–b, c–d, e–f, g–h, and the last batch is just i. For 5 instances at 10%, 0.5 rounds down to 0, and the minimum makes it 1.',
    alternative:
      'Some orchestrators also allow a surge: extra new instances started before old ones stop, rounded up, which keeps full capacity during the update at the cost of extra machines. A fixed batch size is simpler to reason about but does not scale with the service.',
    counterexample:
      'Math.round gives 3 for 2.97, so only 6 instances stay serving instead of the promised 7. Without the minimum of 1, 5 instances at 10% give a batch size of 0 and a loop that never advances.',
    transfer:
      'Add maxSurgePercent, rounded up: that many new instances may start before old ones stop. Decide how batches change and what the minimum available becomes. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-percent-rollout': {
    reasoning:
      'The hash depends only on the flag and the user ID, so the same user always lands in the same bucket, and the rule bucket < percent turns a growing percentage into a growing set of buckets. Because buckets never move, raising the percentage only adds users. Hashing the flag name too gives every feature an independent order of users.',
    trace:
      'For u-1004 and new-checkout, the hashed text is "new-checkout:u-1004", whose FNV-1a value modulo 100 is 9. At 9%, 9 < 9 is false, so the user is off; at 10%, 9 < 10 is true; at 50% it is still true. For u-1002, new-checkout gives bucket 47 but dark-mode gives 18, so the user can get one feature early and the other late.',
    alternative:
      'Storing a random number per user when they sign up gives the same stability, but needs storage and a migration for existing users. Choosing by user ID ranges, such as IDs ending in 0, is simple but follows patterns in how IDs are assigned.',
    counterexample:
      'Hashing only the user ID gives u-1002 bucket 44 for every flag, so the same users get every new feature first. Without >>> 0 the hash can be negative, and a negative bucket is enabled even at 0%.',
    transfer:
      'Support a list of always-on user IDs for testers. Decide whether they count toward the percentage and what their bucket is. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-blue-green': {
    reasoning:
      'The state has four parts: which color is live, the version on each color, whether the idle color is checked, and whether there is a previous version to return to. Every event first checks its condition against that state and changes nothing if refused. A switch keeps the old live color as the rollback target because it is still running a known-good version; a new deploy overwrites that color, so the target is cleared.',
    trace:
      'After deploy v2, check passed, switch, rollback, switch: v2 goes on green and is checked healthy; switch makes green live with blue as the target; rollback makes blue live and marks green failed; the final switch is refused because the idle color, green, is failed. So blue is live with blue v1 and green v2, and event 4 is refused.',
    alternative:
      'A canary gives real traffic to the new version earlier and in smaller amounts; blue/green moves all traffic at once but switches back instantly. Keeping three environments allows a new deploy while still holding a rollback target, at the cost of more machines.',
    counterexample:
      'Allowing a switch after a deploy without a check refuses nothing in "Refuses to switch before a check". Keeping the rollback target after a new deploy lets rollback in "Clears the rollback target on a new deploy" return to blue, which now runs v3, not the version that was live.',
    transfer:
      'Add a "drain" event that must come before a switch, and refuse a switch until the live color has drained. Decide what a rollback needs. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-canary-schedule': {
    reasoning:
      "Only active time moves a rollout forward, so each pause is cut down to the part that lies between the start and now, and that total is subtracted. Each step's start is the sum of the earlier holds, so the current step is the last whose start is not after the active time. A step with no hold starts and ends at the same moment, so the next step takes over at once.",
    trace:
      'For the example, the steps start at 0, 10, 20, and 40 minutes of active time. At minute 25 with a pause from 12 to 18, the pause takes away 6 minutes, so the active time is 19. The last start at or before 19 is 10, so the rollout is on step 1 at 25%. Without the pause it would be on step 2 at 50%.',
    alternative:
      'Recording the start time of each step as it happens avoids recomputing from the start, but makes the result depend on stored state. Treating a pause as a fixed delay added to every later step gives the same answer for pauses that have ended.',
    counterexample:
      'Ignoring pauses moves the example to 50% while someone is still investigating. Counting the whole of a pause that has not ended, 20 to 40 at minute 25, subtracts 20 minutes instead of 5 and holds the rollout back two steps.',
    transfer:
      'Allow a step to require a manual approval before the next one starts. Decide how approvals are passed in and how they combine with pauses. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-canary-verdict': {
    reasoning:
      'A decision needs repeated evidence, so it is taken from runs, not single samples: a run of unhealthy minutes for rollback, a run of healthy ones for promotion, each reset by the other kind. Skipping quiet minutes keeps chance results out of both runs. Multiplying instead of dividing keeps the boundary exact, and returning at the first completed run reports when the decision could first be made.',
    trace:
      'For 300 requests with 40 errors, then 20 requests, then 310 with 35, under 2% and at least 100 requests: the first minute is unhealthy because 4000 > 600, so the unhealthy run is 1. The quiet minute is skipped and the run stays 1. The third is unhealthy, 3500 > 620, so the run reaches 2 and the result is rollback at 2.',
    alternative:
      'Comparing the canary with the current version, rather than with a fixed limit, ignores problems both share, such as a broken dependency, and catches a canary that is worse even when under the limit. Statistical tests weigh how much traffic each minute had instead of skipping quiet ones.',
    counterexample:
      'Computing (errors / requests) × 100 > maxErrorPercent calls 7 errors in 100 requests unhealthy at a 7% limit, because the division gives 7.000000000000001. Letting a quiet minute reset the run delays the rollback in "Skips quiet minutes without breaking a run".',
    transfer:
      'Add a limit on total time: if no decision is reached within 30 counted samples, roll back. Decide whether skipped samples count toward the limit. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-health-endpoints': {
    reasoning:
      'The two answers lead to different actions, so each looks only at what its action could fix. A restart can unstick a stalled process, so liveness looks only at stalled. Withholding traffic helps while the instance is starting, stopping, or missing a required dependency, so readiness collects exactly those reasons, and optional dependencies, which the instance can work without, never count.',
    trace:
      'For an instance that has not started, is shutting down, has queue and database down as required, and cache down as optional: the reasons are "starting", "shutting down", "queue is down", and "database is down", in that order, so readiness is 503. stalled is false, so liveness is 200 even though nothing else is healthy.',
    alternative:
      'Some services report one combined health status, which is simpler but forces a choice between restarting too often and not removing traffic. A third check, a startup check, can hold liveness off until the first successful start instead of relying on a long initial delay.',
    counterexample:
      'Failing liveness when a required dependency is down returns 503 for live in "Stays live while the database is down". Counting every dependency for readiness makes the instance not ready because the optional cache is down in "Is ready when every required dependency is up".',
    transfer:
      'Add a degraded state for dependencies that are slow but answering. Decide whether degraded required dependencies should affect readiness and how the reason is worded. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-probe-thresholds': {
    reasoning:
      'Acting only on runs filters out single blips: a pass resets the failure run and a failure resets the pass run, so only consecutive results count. Which threshold applies depends on the current state, so failures while out of service and passes while in service change nothing but the counts. Starting out of service means a new instance must prove itself before it gets traffic.',
    trace:
      'For pass, pass, fail, pass, pass, pass, fail, fail with thresholds 3 and 2: the first two passes are a run of 2, then the failure resets it. The next three passes reach 3, so the instance goes into service after the sixth check. The next failure is a run of 1, still in service; the eighth makes 2, so it leaves service.',
    alternative:
      'Counting failures over a sliding window, such as 3 of the last 5, tolerates flapping instances differently from strict runs. A single threshold for both directions is simpler, but adding an instance usually deserves more caution than keeping one.',
    counterexample:
      'Not resetting the pass count on a failure lets the instance in after pass, pass, fail, pass with a threshold of 3. Applying the failure threshold while out of service changes nothing here, but forgetting that the instance starts out of service puts it into service before its first check.',
    transfer:
      'Add a minimum time out of service: once removed, the instance cannot return for 30 seconds even if it passes. Decide how check times are passed in and how the counts behave during that time. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-restart-backoff': {
    reasoning:
      'Each crash in a series doubles the wait, so a container that crashes immediately is retried quickly at first and then rarely, and the limit keeps the wait bounded. A long run shows the problem has gone away, so it starts a new series: the decision is made before computing the delay for that crash, which is why the delay after a long run is the base again.',
    trace:
      'For runs 5, 5, 5, 700, 5 with base 10, limit 300, and reset 600: the first three short runs give 10, 20, and 40 as the count goes 0, 1, 2. The 700-second run is at least 600, so the count resets to 0 and its delay is 10. The next short run follows with a count of 1, giving 20.',
    alternative:
      'Adding random jitter to each delay spreads out restarts when many containers crash together, at the cost of less predictable timing. A fixed delay is simplest but either restarts a broken container too often or recovers a fixed one too slowly.',
    counterexample:
      'Checking the reset after computing the delay gives 80 instead of 10 after the 700-second run. Applying the limit before doubling lets the delay grow past 300.',
    transfer:
      'Stop restarting after 10 crashes within one hour, and report the container as failed. Decide which inputs you need and whether the reset rule also clears that count. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-liveness-restart': {
    reasoning:
      'Checks happen at fixed times, so the question is which of those times fall inside a stall and whether enough of them fall in a row. Treating each stall as including its start and excluding its end makes a check at the moment a service recovers count as a pass. Returning at the first check that completes the run gives the restart time.',
    trace:
      'For a 45-second startup with checks at 10, 20, 30 and a threshold of 3, all three checks fall inside 0 to 45, so the third failure at 30 restarts the container. With a threshold of 5, the checks at 10, 20, 30, and 40 fail, the check at 50 passes and resets the count, and no restart happens by 300.',
    alternative:
      'A separate startup check that runs until the first success, with liveness starting only after it, handles slow and fast starts alike. A long initial delay works too, but delays catching a process that hangs early in every run.',
    counterexample:
      'Treating a stall\'s end as included fails the check at 30 in "Passes a check exactly at the end of a stall" and restarts the container. Forgetting to reset the count after a pass restarts in "Resets the count after a pass", where failures are never three in a row.',
    transfer:
      'Each check also has a timeout: a check during a slow period that answers after more than 1 second counts as a failure. Decide how slow periods are passed in. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-graceful-drain': {
    reasoning:
      'Two times divide everything: when accepting stops, and the deadline. Arrival decides acceptance, and finish time against the deadline decides completed or cut off. The instance cannot leave before it stops accepting, it stays busy while any accepted request is running, and it cannot stay past the deadline, so the exit is that busy time capped at the deadline.',
    trace:
      'For the example, accepting stops at 105 and the deadline is 130. a, b, and c arrive before 105, so they are accepted, and finish at 98, 112, and 106, all by 130. d arrives at 101, is accepted, but would finish at 140, so it is cut off. The busy time is the latest of 105, 98, 112, 106, and 140, which is 140, capped to 130.',
    alternative:
      'Rejecting new requests at once on the stop signal is simpler, but the load balancer may still send requests for a few seconds, which then fail. Making the grace period longer than the slowest request avoids cut-offs at the cost of slower deploys.',
    counterexample:
      'Ignoring the accept time rejects c in the example, although the load balancer had not yet stopped sending traffic. Exiting when the last completed request finishes gives 112, although d is still running until the deadline.',
    transfer:
      'Requests can be retried by the client when cut off. Add a list of retryable request ids and report which cut-off requests will be retried. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-cron-field': {
    reasoning:
      'Every valid part reduces to the same three numbers: a start, an end, and a step. "*" means the whole range, a number is a range of one, and a step only makes sense after something that is already a range, which is why "7/2" is refused. Checking every limit before adding values means an invalid part can never leave a partial answer, and a Set followed by a sort gives each value once in order.',
    trace:
      'For "30,5,1-3,2-4" with 0 to 59, the parts give {30}, {5}, {1, 2, 3}, and {2, 3, 4}. The Set holds 30, 5, 1, 2, 3, and 4, and sorting gives [1, 2, 3, 4, 5, 30]. For "*/5" with 1 to 12, the start is min, 1, so the values are 1, 6, and 11, not 0, 5, and 10.',
    alternative:
      'Splitting each part with split("/") and split("-") instead of one pattern is easier to read but needs separate checks for empty pieces and non-digits. Returning a bit mask instead of a list makes later matching faster but is harder to show.',
    counterexample:
      'Starting every step at 0 gives [0, 5, 10] for "*/5" in 1 to 12, where 0 is not even a valid month. parseInt accepts "5x" as 5, so a pattern that checks the whole part is needed to refuse it.',
    transfer:
      'Accept day names, MON to SUN, in the day-of-week field, in any letter case and inside ranges. Decide whether "SUN-MON" is valid. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-cron-matches': {
    reasoning:
      'Minute, hour, and month are independent conditions that must all hold. The two day fields are combined by a rule chosen by cron long ago: when both are restricted the schedule means "these dates or these weekdays", so either is enough, and when one starts with "*" only the other really restricts the day, so both must hold. The test is on the field text, not its values, so "*/2" still counts as starting with "*".',
    trace:
      'For "0 12 */2 * 1" at day 4, weekday 1: minute 0, hour 12, and month all match. The day-of-month field starts with "*", so both day fields must hold. Weekday 1 is allowed, but day 4 is not in 1, 3, 5, and so on, so the result is false.',
    alternative:
      'Some schedulers always require both day fields to match, which is what most people expect but breaks schedules written for classic cron. Others offer a separate syntax, such as "5#2" for the second Friday, which avoids the either-day rule altogether.',
    counterexample:
      'Requiring both day fields every time refuses Friday the 6th for "0 12 13 * 5". Deciding the rule from whether a field allows every value treats "*/2" as restricted and returns true for day 4 in "Needs both days when one starts with "*"".',
    transfer:
      'Add "L" in the day-of-month field, meaning the last day of the month. Decide what extra input your function needs and how "L" combines with the either-day rule. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-local-to-utc': {
    reasoning:
      'An instant shows the wall time target exactly when instant + offset(instant) = target, so every possible offset near the target gives one candidate, target − offset. Offsets change at most once within the window, so the offsets a day before, at, and a day after the first guess cover every case. Keeping only candidates whose local time really is the target filters out a gap, which leaves none, and an overlap, which leaves two.',
    trace:
      'For 2026-11-01T01:30 in New York, the offsets a day before and after are −4 hours and −5 hours. The candidates are 05:30Z and 06:30Z, and both show 01:30 locally, so the result is an overlap. For 2026-03-08T02:30, the candidates are 06:30Z, which shows 01:30, and 07:30Z, which shows 03:30, so neither matches and the time is in the gap.',
    alternative:
      'Stepping through every minute of the day and recording which instants show the target also works, but makes up to 1,440 formatter calls instead of a handful. Libraries such as Temporal, once available, expose this choice directly as "earlier", "later", or "reject".',
    counterexample:
      'Using only the offset at the first guess finds one of the two instants in an overlap and reports "ok". Using the machine\'s own time zone with new Date(year, month, ...) gives answers that change from one computer to another.',
    transfer:
      'Return the instant a scheduler should use instead of a status: for a gap, the first instant after the jump; for an overlap, the earlier one. Decide how to find the first instant after a gap. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-cron-next-utc': {
    reasoning:
      'In UTC every minute exists once, so the next run is simply the first matching minute after after. Starting at the next whole minute keeps after itself from counting, and skipping the rest of a day as soon as its date or month fails keeps a search of up to a year fast while still checking every candidate minute in order.',
    trace:
      'For "30 9 * * 1-5" after 2026-10-23T10:00:00Z, a Friday, the search starts at 10:01. No later minute on Friday is 09:30, Saturday and Sunday fail the weekday test and are skipped a day at a time, and Monday 2026-10-26 at 09:30 matches, so the result is "2026-10-26T09:30:00.000Z".',
    alternative:
      'Jumping straight to the next allowed month, day, hour, and minute is faster still, but needs care when a jump overflows into the next unit. Minute stepping without skipping days is simplest but takes over half a million steps for a yearly schedule.',
    counterexample:
      'Starting the search at after itself returns after when it lies on a matching minute, which "Never returns after itself" refuses. Rounding the start down instead of up returns 23:58 in "Rounds seconds up to the next minute".',
    transfer:
      'Return the next 5 runs instead of one, for a preview in the user interface. Decide whether the 366-day limit applies to all five together. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'devops-cron-next-zone': {
    reasoning:
      'Matching happens on local wall-clock time, so each candidate is a local date and time that the schedule allows, turned into the instants that show it. A skipped time has no instant and is passed over, and a repeated time is represented only by its earlier instant, so it can never run twice. Comparing that earlier instant with after, rather than the later one, is what stops the repeat from running when after falls between the two.',
    trace:
      'For "30 1 * * *" after 2026-11-01T06:20:00Z, local time is 01:20 standard time on 2026-11-01. The candidate 2026-11-01 01:30 has instants 05:30Z and 06:30Z; the earlier one, 05:30Z, is not after 06:20Z, so it is passed over. The next candidate, 2026-11-02 01:30, is 06:30Z, which is the answer.',
    alternative:
      'Stepping minute by minute from a day before after, remembering the latest local time seen, treats any local time that is not later than one already seen as a repeat. It is simpler to write and fast enough for 8 days, but slower for long horizons than visiting matching days.',
    counterexample:
      'Using the later instant of a repeated time runs the job at 06:30Z in "Runs at the first of two repeated times". Starting to follow the local clock only at after runs it at 06:30Z in "Knows the repeat already ran before after", because 01:30 standard time looks new.',
    transfer:
      'Change the gap rule: a job whose local time is skipped runs at the first instant after the jump instead. Decide what an hourly job does on that night. This changed contract is self-reviewed, not checked by the original cases.',
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
  'devops-read-port': {
    plan: ['Treat a missing or blank PORT as 3000.', 'Check the trimmed text is only digits.', 'Convert it and check the range.'],
    explanation: ['Trace "8080abc" and "1e3".', 'Explain why the default is not an error.', 'Say why leading zeros are allowed.'],
    example:
      'I trim PORT, or use "" when it is missing; an empty result gives 3000. If the text matches /^[0-9]+$/, I convert it with Number and accept it from 1 to 65535. Anything else returns the error. The work is linear in the length of the value. The checks pass env in directly; no process environment is read.',
  },
  'devops-validate-env': {
    plan: [
      'For each setting, choose the value, the default, or nothing.',
      'Convert the chosen text by type, collecting errors.',
      'Return every error in schema order, or the config.',
    ],
    explanation: [
      'Trace a schema with three different problems.',
      'Explain why a blank value uses the default.',
      'Say why every error is reported at once.',
    ],
    example:
      'For each setting I take the trimmed value, or the trimmed default when the value is blank or missing. With neither, a required setting adds "is required". Strings keep the text; integers must match /^-?[0-9]+$/; booleans accept true, 1, false, and 0 in lower case. Errors collect in schema order. The work is linear in the schema. The checks pass env and the schema in directly.',
  },
  'devops-mask-secrets': {
    plan: [
      'Collect the sensitive values that are set and at least 4 characters long.',
      'Sort them longest first.',
      'Replace every occurrence of each in every line.',
    ],
    explanation: [
      'Trace two secrets where one contains the other.',
      'Explain why a value is not used as a pattern.',
      'Say why very short values are skipped.',
    ],
    example:
      'I filter sensitive names to those set in env with values of at least 4 characters, map them to values, and sort by length, longest first. Each line goes through replaceAll for each value with "***". The work is the number of lines times the number of values times the line length. The checks pass lines in directly; no CI service masks anything.',
  },
  'devops-parse-dotenv': {
    plan: [
      'Trim each line and skip blanks and comments; remove a leading export.',
      'Split at the first "=" and check the name, recording bad line numbers.',
      'Keep a quoted value\'s inside, or remove a " #" comment from an unquoted one.',
    ],
    explanation: [
      'Trace a quoted value that contains "#".',
      'Explain why the first "=" is the split point.',
      'Say what happens to a repeated name.',
    ],
    example:
      'For each line I trim, skip "" and "#" lines, and remove "export ". indexOf("=") gives the name, which must match /^[A-Za-z_][A-Za-z0-9_]*$/, or the line number goes into errors. A value of 2 or more characters wrapped in matching quotes keeps its inside; otherwise I cut at " #" and trim. Later names overwrite earlier ones. The work is linear in the text. The checks pass text in directly; no file is read.',
  },
  'devops-config-drift': {
    plan: [
      'Collect and sort every name from both maps.',
      'Report names missing on one side.',
      'Report differing values, hiding sensitive ones.',
    ],
    explanation: [
      'Trace a sensitive name whose values differ.',
      'Explain why an empty value is present.',
      'Say what the report never shows.',
    ],
    example:
      'I sort the union of both maps\' keys. hasOwn tells me whether each side has the name; a name on one side only is reported missing on the other. When both have it and the values differ, I report both, replaced by "***" if the name is sensitive. The work is O(n log n) for the sort. The checks pass both maps in directly.',
  },
  'devops-compare-versions': {
    plan: [
      'Remove a leading "v" and split each version into three numbers.',
      'Compare the parts in order and stop at the first difference.',
      'Return -1, 0, or 1.',
    ],
    explanation: ['Trace 1.10.0 against 1.9.0.', 'Explain why text comparison fails.', 'Say why the result is never the difference.'],
    example:
      'I strip /^v/, split at ".", and map to Number. For each of the three positions, the first that differs returns -1 or 1; if none differs I return 0. The work is constant for three parts. The checks pass versions in directly.',
  },
  'devops-next-version': {
    plan: [
      'Find the largest kind of change.',
      'Raise the matching part, applying the 0.x rule for breaking changes.',
      'Reset the parts to its right, or return the current version with release false.',
    ],
    explanation: [
      'Trace 0.4.1 with a breaking change.',
      'Explain why the parts to the right reset.',
      'Say why docs alone make no release.',
    ],
    example:
      'I split the version into numbers. With "breaking" I return major + 1 with zeros, or 0.(minor + 1).0 when major is 0; with "feature" minor + 1 and patch 0; with "fix" patch + 1. Otherwise I return the current version with release false. The work is linear in the changes. The checks pass changes in directly; no commits are read.',
  },
  'devops-sort-versions': {
    plan: [
      'Drop build information and split each version into numbers and pre-release identifiers.',
      'Compare numbers, then pre-release presence, then identifiers, then length.',
      'Sort a copy with a stable sort.',
    ],
    explanation: [
      'Trace beta.2 against beta.11.',
      'Explain where a number identifier goes against a word.',
      'Say why 2.0.0-rc.1 sorts before 2.0.0.',
    ],
    example:
      'parse splits at "+", then at the first "-", into three numbers and a list of identifiers. The comparator checks the numbers, then puts a pre-release first, then compares identifiers: digits as numbers, digits before words, words by character code, and finally the shorter list first. I sort a copy, which keeps equal versions in order. The work is O(n log n). The checks pass versions in directly.',
  },
  'devops-lockfile-diff': {
    plan: [
      'Go through the sorted union of package names.',
      'Put each package in added, removed, upgraded, downgraded, or nowhere.',
      'Name the kind from the leftmost part that differs.',
    ],
    explanation: [
      'Trace a package whose minor part went from 9 to 10.',
      'Explain why vite 5.4.9 → 6.0.1 is major.',
      'Say what is left out of the summary.',
    ],
    example:
      'For each sorted name I check whether before and after have it. Only after is added and only before is removed, as "name@version". In both, I find the first index where the numbers differ; none means unchanged, a higher number is an upgrade named by that index, and a lower one is a downgrade. The work is O(n log n) for the sort. The checks pass two maps; no lockfile is read.',
  },
  'devops-satisfies-range': {
    plan: [
      'Read the operator and parse the base.',
      'Check the version is at least the base, or exactly it for no operator.',
      'For ~ and ^, find the first excluded version and check the version is below it.',
    ],
    explanation: ['Trace 0.3.0 against ^0.2.3.', 'Explain how the caret limit depends on zeros.', 'Say why the upper limit is excluded.'],
    example:
      'I take ">=", "^", "~", or nothing from the start and parse the rest. No operator needs equality. Otherwise the version must not be below the base; >= stops there. For ~ the limit is the next minor; for ^ it raises the first non-zero part of the base, or the patch when all are 0. The version must be below the limit. The work is constant. The checks pass ranges in directly; no package manager runs.',
  },
  'devops-job-waves': {
    plan: [
      'Check every need names a job.',
      'Find each wave from the jobs whose needs are already placed.',
      'Report the leftover jobs if a round finds none.',
    ],
    explanation: [
      'Trace a chain listed backwards.',
      'Explain why a whole wave is found before any of it is placed.',
      'Say why a job that needs a loop is also reported.',
    ],
    example:
      'I check needs against a Set of names and return the first unknown one. Then, while jobs are left, the wave is every left job whose needs are all placed, in file order; an empty wave returns CYCLE with the left jobs. I add the wave to placed and remove it from the left jobs. The work is up to O(n²) for n jobs. The checks pass jobs in directly; no CI file is read.',
  },
  'devops-cache-key': {
    plan: [
      'Remove repeats from keyFiles and sort them.',
      'Build the text from each path and its content or "<missing>".',
      'Hash it with FNV-1a and join job, os, and the padded hash.',
    ],
    explanation: [
      'Trace two orders of the same key files.',
      'Explain why a missing file is marked.',
      'Say which changes must not change the key.',
    ],
    example:
      'I sort [...new Set(keyFiles)] and map each path to path + "\\n" + content or "<missing>" + "\\n", joined. The hash starts at 2166136261, and each code unit updates it with Math.imul(hash ^ c, 16777619) >>> 0. I return job-os-hash with the hash as 8 hex digits. The work is linear in the text. The checks pass contents in directly; no cache service runs.',
  },
  'devops-cache-restore': {
    plan: [
      'Return an exact match first.',
      'Try each prefix in order, stopping at the first with any match.',
      'Return its newest cache, the earlier one on a tie, or a miss.',
    ],
    explanation: [
      'Trace a prefix match where a later prefix has a newer cache.',
      'Explain why the exact match wins.',
      'Say why a tie keeps the earlier cache.',
    ],
    example:
      'If some cache key equals key, I return exact. Otherwise for each prefix I keep the cache with the largest createdAt among keys that start with it, replacing only on a strictly larger value; the first prefix with a match returns partial. Otherwise I return miss. The work is the number of prefixes times the number of caches. The checks pass caches in directly.',
  },
  'devops-pipeline-duration': {
    plan: [
      "Work out each job's finish from its needs, remembering answers.",
      'Take the largest finish as the total.',
      'Walk back from the last job through the need that finished last.',
    ],
    explanation: [
      'Trace a job listed before its needs.',
      'Explain why only the critical path matters for speed.',
      'Say how ties are broken.',
    ],
    example:
      'finishOf(name) returns the remembered value or the largest finish among its needs (0 for none) plus its minutes. total is the largest finish. From the first job with the largest finish, I keep moving to the first need with the largest finish, then reverse the list. The work is linear in jobs and needs. The checks pass planned minutes, not measured runs.',
  },
  'devops-skip-unchanged': {
    plan: [
      'Match a changed file against a folder or an exact path.',
      'Decide each job from its paths and the jobs it needs, remembering answers.',
      'List run and skip in the order of jobs.',
    ],
    explanation: [
      'Trace a change that reaches a job through two needs.',
      'Explain why a folder must match from the start.',
      'Say what happens when a job forgets to list a path it reads.',
    ],
    example:
      'A path ending in "/" matches files that start with it; others must be equal. runs(name) returns the remembered answer or whether any path matches any changed file or any need runs. I filter jobs into run and skip with it. The work is jobs times paths times changed files. The checks pass changed paths in directly; no repository is read.',
  },
  'devops-layer-rebuild': {
    plan: [
      'Match a source against a changed file: ".", a folder, or an exact path.',
      'Turn a flag on at the first step with a matching source.',
      'Mark every step from there as rebuilt.',
    ],
    explanation: [
      'Trace a lockfile change through an install step.',
      'Explain why a step that copies nothing can rebuild.',
      'Say why step order matters for build time.',
    ],
    example:
      'matches returns true for ".", for a "/" source that the file starts with, or for an equal path. I map the steps; while the flag is off, it turns on if any source matches any changed file, and each step gets "rebuilt" or "cached" from the flag. The work is steps times sources times changed files. The checks pass steps and paths in directly; no image is built.',
  },
  'devops-image-tags': {
    plan: [
      'Split the ref into a branch or a tag.',
      'Give main, other branches, release versions, pre-releases, and other tags their name tags.',
      'End with the commit tag.',
    ],
    explanation: [
      'Trace a branch name with invalid characters at the start.',
      'Explain why a pre-release does not get latest.',
      'Say why every image gets a commit tag.',
    ],
    example:
      'convert lowercases, replaces /[^a-z0-9._-]/g with "-", removes /^[.-]+/, and keeps 40 characters. Branches give main and edge for main, or the converted name if it is not empty. Tags matching /^v?(\\d+)\\.(\\d+)\\.(\\d+)(-.+)?$/ give the full version with a pre-release, or the version, major.minor, major, and latest; other tags are converted. I append "sha-" and seven characters. The work is linear in the ref. The checks pass refs in directly; no registry is contacted.',
  },
  'devops-dockerignore': {
    plan: [
      'Parse the lines into patterns, skipping comments and blanks and marking exceptions.',
      'Match a pattern as a folder, a "*." ending, or a path and its folder.',
      'Let the last matching line decide for each file.',
    ],
    explanation: [
      'Trace an exception after a general rule.',
      'Explain why "build" does not match "builder.ts".',
      'Say what happens when the exception comes first.',
    ],
    example:
      'I trim the lines, drop "" and "#" lines, and turn each into {pattern, keep}. A "/" pattern matches paths that start with it; a "*." pattern matches when the part after the last "/" ends with the rest; others match the equal path or paths under it. Each file starts kept, and every matching rule sets keep. The work is files times lines. The checks pass paths in directly; no files are read.',
  },
  'devops-tag-cleanup': {
    plan: [
      'Mark deployed and version tags as protected.',
      'Group the other tags by branch and sort each newest first.',
      'Delete everything past the allowance, in the order of tags.',
    ],
    explanation: [
      'Trace a branch where a deployed tag is old.',
      'Explain why protected tags do not use the allowance.',
      'Say how a tie is broken.',
    ],
    example:
      'A tag is protected if deployed includes it or it matches /^\\d+\\.\\d+\\.\\d+$/. Other tags go into a Map by branch; each group is sorted by pushedAt, newest first, with a stable sort, and names after the first keepPerBranch go into a Set. I return tags filtered by that Set. The work is O(n log n). The checks pass tags in directly; no registry is changed.',
  },
  'devops-multistage-rebuild': {
    plan: [
      'Go through the stages in order, remembering which changed.',
      'Start a stage rebuilding if it starts from a changed stage.',
      'Otherwise start at the first step that copies from a changed stage or a changed file, and record whether the stage changed.',
    ],
    explanation: [
      'Trace a change that reaches the final stage through a copy.',
      'Explain why a copy from a stage ignores changed files.',
      'Say why a stage with no steps can still change.',
    ],
    example:
      'I keep a Set of changed stages. Each stage starts with rebuilding set if its from is in the Set. Each step, while not rebuilding, checks its fromStage in the Set, or its sources against changed files. Statuses follow the flag, and a stage whose flag ends on joins the Set. The work is steps times sources times changed files. The checks pass stages in directly; no Docker build runs.',
  },
  'devops-rolling-batches': {
    plan: [
      'Work out the batch size, rounding down but at least 1.',
      'Slice the instances in order into batches.',
      'Report the minimum number still serving.',
    ],
    explanation: [
      'Trace a share that rounds down to 0.',
      'Explain why the batch size rounds down.',
      'Say what the last batch can look like.',
    ],
    example:
      'batchSize is Math.max(1, Math.floor(n × percent / 100)). I push instances.slice(start, start + batchSize) for start = 0, batchSize, 2 × batchSize, and so on. minAvailable is n − batchSize. The work is linear in the instances. The checks pass names in directly; no instance is restarted.',
  },
  'devops-percent-rollout': {
    plan: [
      'Join the flag, ":", and the user ID.',
      'Hash the text with 32-bit FNV-1a.',
      'Take the hash modulo 100 and compare it with the percent.',
    ],
    explanation: [
      'Trace one user across 5%, 10%, and 50%.',
      'Explain why the flag is part of the text.',
      'Say why the comparison is strict.',
    ],
    example:
      'I hash flag + ":" + userId: hash starts at 2166136261 and each code unit c updates it with Math.imul(hash ^ c, 16777619) >>> 0. bucket is hash % 100, and enabled is bucket < percent. The work is linear in the text. The checks pass IDs in directly; no flag service runs.',
  },
  'devops-blue-green': {
    plan: [
      'Keep live, both versions, the idle health, and the rollback target.',
      'For each event, check its condition before changing anything.',
      'Record refused positions and return the final state.',
    ],
    explanation: [
      'Trace a deploy, check, switch, and rollback.',
      'Explain why a deploy clears the rollback target.',
      'Say why a rolled-back color cannot be switched to.',
    ],
    example:
      "deploy sets the idle color's version, marks it unchecked, and clears the target. check needs an idle version and sets healthy or failed. switch needs a healthy idle color; the old live color becomes the target and the idle one goes live. rollback needs a target, makes it live, and marks the other failed. Refused events add their index. The work is linear in the events. The checks pass events in directly; no traffic moves.",
  },
  'devops-canary-schedule': {
    plan: [
      'Add up the part of each pause between the start and now.',
      'Subtract it to get the active time.',
      'Walk the steps, adding holds, until a step starts after the active time.',
    ],
    explanation: [
      'Trace the example with and without its pause.',
      'Explain how an unfinished pause is counted.',
      'Say what a step with no hold does.',
    ],
    example:
      'Each pause contributes Math.max(0, Math.min(to, now) − Math.max(from, 0)). The active time is now minus their sum. I keep a running start, set current to each step whose start is not after the active time, and add its hold. The work is linear in the steps and pauses. The checks pass minutes in directly; no clock is read.',
  },
  'devops-canary-verdict': {
    plan: [
      'Skip samples with too few requests.',
      'Judge each counted sample with whole-number arithmetic.',
      'Keep runs of each kind and stop when one reaches its target.',
    ],
    explanation: [
      'Trace a run interrupted by a quiet minute.',
      'Explain why the comparison multiplies instead of dividing.',
      'Say why one bad minute is not enough.',
    ],
    example:
      'For each sample with at least minRequests requests, it is unhealthy when errors × 100 > maxErrorPercent × requests. An unhealthy sample adds to its run and resets the healthy run, and the reverse; reaching unhealthyNeeded returns rollback and healthyNeeded returns promote, with the index. Otherwise the result is continue. The work is linear in the samples. The checks pass counts in directly; no metrics are read.',
  },
  'devops-health-endpoints': {
    plan: [
      'Answer liveness from stalled alone.',
      'Collect readiness reasons in order.',
      'Set the readiness status from whether there are reasons.',
    ],
    explanation: [
      'Trace an instance whose database is down.',
      'Explain why liveness ignores dependencies.',
      'Say why optional dependencies never count.',
    ],
    example:
      'live is 503 when stalled and 200 otherwise. I push "starting" if not started, "shutting down" if shuttingDown, then "NAME is down" for each required dependency that is not up. ready is 200 with no reasons and 503 with any. The work is linear in the dependencies. The checks pass a state in directly; no orchestrator asks.',
  },
  'devops-probe-thresholds': {
    plan: [
      'Start out of service with both counts at 0.',
      'Update the run counts for each result.',
      'Change state when the run for the current state reaches its threshold.',
    ],
    explanation: [
      'Trace the example around its two changes.',
      'Explain why a pass resets the failure count.',
      'Say why a new instance starts out of service.',
    ],
    example:
      'For each result, a pass adds to passes and resets failures, and enters service if out and passes reach the healthy threshold; a failure does the reverse with the unhealthy threshold. I push the state after each result. The work is linear in the results. The checks pass results in directly; no load balancer runs.',
  },
  'devops-restart-backoff': {
    plan: [
      'Keep a crash count for the current series.',
      'Reset it when a run lasted at least the reset time.',
      'Double the base by the count, cap it, and add the crash.',
    ],
    explanation: [
      'Trace a long run in the middle of a crash loop.',
      'Explain why the reset comes before the delay.',
      'Say what the limit protects.',
    ],
    example:
      'For each run, I reset crashes to 0 if it lasted at least resetAfterSeconds, take Math.min(maxSeconds, baseSeconds × 2 ** crashes), then add 1 to crashes. The work is linear in the runs. The checks pass run lengths in directly; no container restarts.',
  },
  'devops-liveness-restart': {
    plan: [
      'Run checks from initialDelay every period up to the horizon.',
      'Fail a check inside a stall, including its start and excluding its end.',
      'Return the time the failures in a row reach the threshold.',
    ],
    explanation: [
      'Trace a slow start against short and long settings.',
      'Explain why a pass resets the count.',
      'Say what settings fit a 45-second start.',
    ],
    example:
      'I loop t from initialDelay while t <= horizon, adding period. A check fails if some stall has from <= t < to; failures count up and return t at the threshold, and a pass resets the count. Otherwise I return null. The work is checks times stalls. The checks pass times in directly; no clock is read.',
  },
  'devops-graceful-drain': {
    plan: [
      'Work out when accepting stops and the deadline.',
      'Sort each request into rejected, completed, or cut off.',
      'Exit at the latest busy time, capped at the deadline.',
    ],
    explanation: [
      'Trace a request still running at the deadline.',
      'Explain why the instance keeps accepting briefly.',
      'Say why exitAt is never before accepting stops.',
    ],
    example:
      'stopAccepting is shutdownAt + acceptForSeconds and the deadline is shutdownAt + graceSeconds. A request arriving at or after stopAccepting is rejected; otherwise it is completed if it finishes by the deadline and cut off if not, and its finish raises the busy time, which starts at stopAccepting. exitAt is the busy time capped at the deadline. The work is linear in the requests. The checks pass times in directly; no signal is sent.',
  },
  'devops-cron-field': {
    plan: [
      'Split the field at commas.',
      'Turn each part into a start, an end, and a step, refusing invalid ones.',
      'Collect the values, then sort them.',
    ],
    explanation: [
      'Trace a step over a range that does not start at 0.',
      'Explain why "7/2" is refused.',
      'Say why an invalid part makes the whole field null.',
    ],
    example:
      'For each part I match /^(\\*|(\\d+)(?:-(\\d+))?)(?:\\/(\\d+))?$/. "*" gives min to max; a number gives a range of one; a step after a single number returns null. The start, end, and step must be within limits. I add every s-th value from start to end to a Set and return it sorted. The work is the number of values. The checks pass fields in directly.',
  },
  'devops-cron-matches': {
    plan: [
      'Expand each field, mapping 7 to 0 for the weekday.',
      'Check minute, hour, and month.',
      'Join the day fields with "or" only when neither starts with "*".',
    ],
    explanation: [
      'Trace "0 12 13 * 5" on Friday the 6th.',
      'Explain why "*/2" does not switch on the either-day rule.',
      'Say why "* 9 * * *" runs 60 times.',
    ],
    example:
      'I expand each field into a Set, turning 7 into 0 for weekdays. Minute, hour, and month must be in their sets. If neither day field starts with "*", the day matches when the date or the weekday is in its set; otherwise both must be. The work is the size of the fields. The checks pass a time in directly; no clock is read.',
  },
  'devops-local-to-utc': {
    plan: [
      'Read local fields for an instant with formatToParts in the zone.',
      'Collect the offsets a day before, at, and after a first guess.',
      'Keep candidates whose local time equals the target and count them.',
    ],
    explanation: ['Trace an overlap in New York.', 'Explain why a gap has no instant.', "Say why the machine's time zone is never used."],
    example:
      'wall(ms) formats ms in the zone with hourCycle "h23" and turns the parts back into a UTC number. The target is the local time read as UTC. For the offsets at target − 1 day, target, and target + 1 day, each candidate is target − offset, and I keep those whose wall time equals the target, sorted. None is a gap, one is ok, two are an overlap. The work is a few formatter calls. The checks pass the time and zone in directly.',
  },
  'devops-cron-next-utc': {
    plan: [
      'Expand the fields once.',
      'Start at the next whole minute after after.',
      'Check each minute, skipping the rest of a day whose date or month fails, up to 366 days.',
    ],
    explanation: [
      'Trace a weekday schedule from a Friday afternoon.',
      'Explain why the search starts after after.',
      'Say why skipping days keeps it fast.',
    ],
    example:
      'I expand the fields into Sets, start at floor(after / 60000) × 60000 + 60000, and loop to after + 366 days. If the month or day rule fails, I jump to the next UTC midnight; otherwise a minute in the hour and minute sets returns toISOString. The work is at most the minutes of the matching days. The checks pass after in directly; no clock is read.',
  },
  'devops-cron-next-zone': {
    plan: [
      'Expand the fields and create one formatter for the zone.',
      'Visit local days from the local date of after, keeping those the day rules allow.',
      'For each allowed time, take its earliest instant, skipping gaps, and return the first after after within 8 days.',
    ],
    explanation: [
      'Trace the night clocks go back with after between the two 01:30s.',
      'Explain the gap and repeat rules.',
      'Say why the earlier instant is compared with after.',
    ],
    example:
      "I read after's local date in the zone, then for each of the next days check month and the day rule on the local date. For each allowed hour and minute, the earliest instant showing that wall time comes from the offsets near it; a gap gives none. The first instant after after and within 8 days is returned with toISOString. The work is days times allowed times. The checks pass after and zone in directly; no clock or machine time zone is read.",
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
  'service-config': {
    title: 'Missing, blank, and invalid are three different answers',
    code: 'WORKERS missing  → use the default "4" → 4\nWORKERS = "   "   → blank, use the default → 4\nWORKERS = "four"  → invalid → "WORKERS must be an integer"\nWORKERS = "4x"    → invalid (parseInt would say 4)',
    reasoning:
      'A setting can be absent, present but blank, or present with text that does not fit its type. Absent and blank both mean nobody chose a value, so the default applies. Text that does not fit means somebody chose a value and got it wrong, so the service must stop and say so rather than guess. A forgiving parser such as parseInt hides that mistake by reading a prefix.',
    challenge:
      'A team sets TIMEOUT_MS="30s" in production, expecting 30 seconds. Predict what parseInt and the schema rule each do with it, and what happens to requests in each case.',
    answer:
      'parseInt reads 30, so every request times out after 30 milliseconds and the service seems broken for a reason nobody can see in the settings. The schema rule refuses "30s" as an integer at startup, so the deploy stops with "TIMEOUT_MS must be an integer" and the mistake is fixed before any request is affected.',
  },
  semver: {
    title: 'A caret range trusts the promise in the version number',
    code: '^4.17.20  → from 4.17.20 up to 5.0.0 (not included)\n^0.2.3    → from 0.2.3 up to 0.3.0 (not included)\n~4.17.20  → from 4.17.20 up to 4.18.0 (not included)',
    reasoning:
      "A caret range accepts every version that should not break code written for its base. For a stable package that means anything below the next major. Before 1.0.0, minor versions may break, so the caret keeps the minor number too. The range is only as safe as the package's promise: a breaking change shipped as a minor version still gets installed, which is why the lockfile pins the exact version that was tested.",
    challenge:
      'A package file asks for ^2.3.0 and the lockfile has 2.3.4. The library publishes 2.4.0, which accidentally breaks your code. Predict what a fresh clone installs with the lockfile, what it installs if the lockfile is deleted, and which one CI should use.',
    answer:
      'With the lockfile, every install gets 2.3.4, so nothing breaks until someone updates it deliberately. Without it, the installer picks the newest version in ^2.3.0, which is 2.4.0, and the build breaks for reasons unrelated to your change. CI should install from the lockfile, failing if it is out of date, so a dependency change is always a reviewed change.',
  },
  'ci-pipelines': {
    title: 'A cache key is a promise that the inputs are the same',
    code: 'key = deps-linux-<hash of package-lock.json>\n\nchange src/app.ts       → same key → restore, skip install\nchange package-lock.json → new key → install, save a new cache\nforget the lockfile     → same key forever → stale packages',
    reasoning:
      'Restoring a cache skips work on the promise that the work would produce the same result. That promise holds only if every input that affects the result is in the key. Too few inputs and an old cache is restored after a real change; too many and the cache misses on changes that could not matter. The same reasoning decides when a job can be skipped: its result can change only if its inputs, or the outputs it uses, change.',
    challenge:
      'A team caches node_modules with the key deps-<os>-<hash of package.json>. They update a package version only in the lockfile. Predict what CI restores and what goes wrong, then repair the key.',
    answer:
      'package.json did not change, so the key is the same and CI restores the old node_modules with the previous package version, skipping the install. Tests run against code the lockfile no longer describes. Hashing the lockfile instead, which records the exact versions, makes any version change produce a new key.',
  },
  'container-images': {
    title: 'Put what changes least at the top',
    code: 'COPY . .                 ← any change rebuilds from here\nRUN npm ci               ← reinstalls on every code change\n\nCOPY package*.json ./    ← changes only with dependencies\nRUN npm ci               ← cached for code changes\nCOPY src/ ./src/         ← code changes rebuild from here',
    reasoning:
      'Every step after a rebuilt step runs again, so the position of the first step a change touches decides how much a build costs. Copying everything first makes every change, even to a README, reinstall all packages. Copying only the package files, installing, and then copying the code means the slow install reruns only when dependencies change, which is rare.',
    challenge:
      'A Dockerfile has COPY . ., RUN npm ci (3 minutes), RUN npm run build (1 minute). A team pushes 20 changes a day: 18 change only src/ and 2 change package-lock.json. Estimate the daily build minutes before and after reordering it as package files, install, source, build.',
    answer:
      'Before, every change rebuilds from COPY . ., so each build takes about 4 minutes: 20 × 4 = 80 minutes. After, the 18 source changes reuse the install and take about 1 minute, and the 2 dependency changes take about 4: 18 + 8 = 26 minutes. A README change, which used to cost 4 minutes, now costs nothing if README.md is not copied.',
  },
  'deploy-strategies': {
    title: 'A percentage rollout only ever adds users',
    code: 'bucket = hash(flag + ":" + userId) % 100\non = bucket < percent\n\n10%: buckets 0–9 on\n50%: buckets 0–49 on   ← includes every bucket from 10%\nrandom per request: a user is on, then off, then on',
    reasoning:
      'Because the bucket is a fixed function of the flag and the user, the set of users who are on at 10% is contained in the set at 50%. Raising the percentage adds users and never takes the feature away from anyone. A random choice per request has the same average but treats one user differently on every request, which looks like a bug to that user and makes support reports impossible to reproduce.',
    challenge:
      'A team decides buckets with hash(userId) % 100 and runs two experiments at 10% each, on different flags. Predict who gets which feature, and repair the bucket rule.',
    answer:
      'Without the flag in the hashed text, both flags give every user the same bucket, so the same 10% of users get both features and the other 90% get neither. The two experiments cannot be told apart. Hashing flag + ":" + userId gives each flag an independent order, so the two groups overlap only by chance.',
  },
  'service-health': {
    title: 'A restart only helps a process that is stuck',
    code: 'database down\n  liveness fails  → restart every instance → all start over, still no database\n  readiness fails → stop sending traffic   → all recover when it returns\n\nprocess stuck in a loop\n  liveness fails  → restart → it answers again',
    reasoning:
      'Each check triggers a different action, so each should fail only when its action can help. Restarting clears a process that is stuck, but it cannot fix a database, a network, or a dependency, and restarting every instance at once adds startup time to an outage. Withholding traffic is the right response to anything outside the process, and it reverses itself as soon as the problem clears.',
    challenge:
      "A team's liveness check calls the database and fails if the query takes more than 1 second. During a busy hour the database slows to 2 seconds per query. Predict what happens to the service, then repair the checks.",
    answer:
      'Every instance fails liveness, the orchestrator restarts them all, and while they restart there is no capacity at all, so the slow hour becomes an outage. The restarts also hit the database with new connections. Liveness should only check that the process itself responds; the database check belongs in readiness, which stops traffic without restarting anything.',
  },
  'cron-schedules': {
    title: 'A local time can happen zero, one, or two times',
    code: 'America/New_York, 2026\n\n03-08 02:30 → never      (clocks jump 02:00 → 03:00)\n07-15 09:00 → 13:00Z     (one instant)\n11-01 01:30 → 05:30Z and 06:30Z   (clocks go back 02:00 → 01:00)',
    reasoning:
      'Clocks in a time zone are a function of the instant, not the other way round. Every instant shows exactly one local time, but when clocks jump forward an hour of local times is never shown, and when they go back an hour is shown twice. A scheduler that works in local time must therefore choose a rule for both cases, and the rule shapes behaviour: skipping the gap means a 02:30 job does not run that night, and running the earlier repeat means a 01:30 job runs once, not twice.',
    challenge:
      'An hourly job, "0 * * * *", runs in New York. Predict how many times it runs between 00:00 and 04:00 local time on 2026-03-08 and on 2026-11-01, under these reps\' rules.',
    answer:
      'On 2026-03-08 the local times 00:00, 01:00, 03:00, and 04:00 occur; 02:00 is skipped, so it runs 4 times, one fewer than usual. On 2026-11-01 the times 00:00, 01:00 (once, at the earlier instant), 02:00, 03:00, and 04:00 run, so it runs 5 times, the usual number, although the local hours from 00:00 to 04:00 took 5 real hours instead of 4.',
  },
}
