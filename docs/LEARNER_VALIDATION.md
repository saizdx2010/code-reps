# Learner validation protocol

This is a prepared protocol, not evidence of completed learner sessions. Do not mark learning effectiveness or retention validated from automated tests.

## Session setup

For the daily-practice iteration, recruit three to five returning TypeScript developers when the internal build is ready. Participant availability is pending. This protocol does not authorize sending invitations or collecting learner work. No accounts are needed. Each participant uses a local profile; export is optional, and keep their work on their machine unless they explicitly agree to share it. Explain that the product is being tested, not the person's intelligence.

Record observations locally with a participant alias rather than identifying information. Let the participant choose whether the observer sees code or written reflections. Do not send telemetry or silently collect their notebook.

## First session

1. Ask the participant to explain the purpose of the home recommendation in their own words.
2. Have them open Knowledge, find arrays, and describe a worked example before checking the prediction.
3. Observe guided practice: record where wording, syntax, planning, or feedback causes confusion. Let them request hints themselves.
4. Ask them to solve a related independent task and explain an empty/equality boundary.
5. Ask them to review their understanding, approach, implementation, and explanation with the rubric. Check whether they understand which evidence is automatic and which judgment is their own.
6. Have them save a mistake note, set a practice goal, switch profiles, and return to their work.
7. Ask what they would do next and why. Compare their answer with the application's recommendation.

Record completion, hint use, misunderstandings, time spent blocked, navigation failures, and the learner's explanation. Avoid turning session duration into a mastery score.

## Later session

After at least three days, offer the authored recall task without exposing the old solution. Ask for a prediction/plan before execution, then an explanation afterward. Later recurring-review variants provide more evidence after a longer gap.

Check independently:

- Did the learner understand the contract?
- Could they choose and implement an approach without hints?
- Could they explain why it worked on a new boundary input?
- Did they understand why their evidence/progress changed?
- Did the skill transfer into the project milestone?

An incorrect attempt is useful evidence. Inspect whether the cause is an unclear requirement, missing prerequisite, a misconception, or a problem with the exercise checks. Revise content before expanding the catalog or tuning intervals.

## Observation template

- Build/content version:
- Participant alias and chosen starting point:
- Skill and exercise IDs:
- Prompt or terminology confusion:
- Predictions made before running:
- Hints requested:
- Independent behavior observed:
- Explanation evidence:
- Navigation/save/accessibility issues:
- Later recall date and outcome:
- Proposed content or product change:
- What still cannot be concluded:

## Daily practice observation packet (stages 3 and 4)

Run this focused walkthrough before the broader knowledge and transfer protocol above. Use a fresh local profile or participant-owned data with consent; never alter their existing work merely to stage a scenario. Use prepared disposable profiles for a due recall and for drafts inside and outside the chosen path. Record any facilitator setup separately from learner actions.

Ask neutrally, without pointing to the intended control:

1. “What would you practise next, and why?” Observe whether the learner identifies the recommendation and its reason. In the due-recall scenario, check whether they understand why it can come from another path without changing their goal.
2. “Choose the path you want to focus on. What changed?” Observe explicit goal choice versus browsing. With no due recall, inspect whether the learner can find the draft within that goal and other available work.
3. “Start a short practice session. You can request help if you want it.” Observe explicit start, intentional help reveal, and the learner's explanation of its effect on independent evidence.
4. “Stop before finishing the rep and write what you learned or where you got stuck.” Observe whether they can end with reflection and understand that the rep remains incomplete. Separately ask them to save and leave without reflection.
5. “Close and return to the app, then continue your work.” Observe Home, explicit resume, preserved code and reflection, and the new session alongside the earlier unfinished record.
6. “Explain what this path and your practice history show about your progress.” Observe whether session endings, completed attempts, independence, and retention are distinguished without facilitator teaching.
7. “What would you do next?” Record the learner's intended action, including whether another session feels optional.

After at least three days, use an eligible authored recall without exposing the prior solution. Record hints and independent explanation separately from passing behavioral checks. An ended session must not be treated as new retention evidence. Apply the broader later-session protocol for transfer; do not infer effectiveness from one successful walkthrough.

### Record per scenario

- Build/commit and content version, platform/browser, viewport or zoom:
- Participant alias, returning-developer context, consent boundaries:
- Scenario and profile setup; rep/path IDs:
- Neutral prompt given:
- Action and explanation observed (quote only with consent):
- Facilitator intervention or hints:
- Expected behavior versus observed behavior:
- Save/recovery, navigation, terminology, or accessibility difficulty:
- Outcome: observed / blocked / not attempted:
- Follow-up recall date and actual result, or pending:
- Supported finding and remaining uncertainty:

### Stage 4 finding record

For each proposed fix, record the source (automated failure, manual walkthrough, or learner observation), reproducible steps or observation context, expected versus actual behavior, learner impact, proposed scoped change, and checks to rerun. Distinguish isolated preference from repeated confusion. A single data-loss or accessibility blocker can justify action without waiting for repeated reports.

If no findings support a change, record that result. Keep learner-dependent findings pending until observations occur. Do not tune recall scheduling or expand content as a substitute for collecting evidence.
