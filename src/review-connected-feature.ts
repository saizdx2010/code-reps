import type { RepDepth } from './rep-depth.ts'

export const connectedFeatureDepth: Record<string, RepDepth> = {
  'connected-note-state': {
    reasoning: 'Fresh transitions leave the old state available for comparison. The status describes the transition, not the truthiness of the text.',
    trace: 'Ada/Ready becomes empty/Unsaved after clearing; the original remains Ada/Ready.',
    alternative: 'Mutating a shared object avoids allocation but destroys the previous snapshot.',
    counterexample: 'Returning the original object on an empty edit fails the clear-text checkpoint.',
    transfer: 'Add an undo operation; decide what evidence must be retained.'
  },
  'connected-note-render': {
    reasoning: 'The rendering module derives literal output from state and links one label to the editable control.',
    trace: 'Text <b>A</b> remains literal text, with no child element in output.',
    alternative: 'A template can be compact, but interpolated HTML would interpret learner text as markup.',
    counterexample: 'innerHTML turns <b>A</b> into a bold element rather than the required text.',
    transfer: 'Render a two-line note; decide which control and observation contract change.'
  },
  'connected-note-input': {
    reasoning: 'Accepted state changes only for values within the limit. The input can hold invalid text while output retains the last accepted value.',
    trace: 'Ada is accepted; 81 a characters leave output Ada and status Too long; Ok then replaces it with Unsaved.',
    alternative: 'Rebuilding the whole view is simple but loses input identity and focus; updating owned nodes preserves both.',
    counterexample: 'Slicing invalid text to 80 silently changes user input and violates the rejection rule.',
    transfer: 'Add a character counter; decide whether it describes typed or accepted text.'
  },
  'connected-note-save': {
    reasoning: 'The saved snapshot changes only after successful explicit saving. A failed write cannot claim Saved or remove the draft.',
    trace: 'Save Bo succeeds; editing again shows Unsaved; a failing save leaves the stored Bo snapshot unchanged.',
    alternative: 'Autosave is another policy but requires an explicit failure and timing contract that this fixture does not provide.',
    counterexample: 'Saving the last accepted text while the input is over limit hides the fact that current input was rejected.',
    transfer: 'Replace the fixture with a real storage adapter and review exceptions without claiming these checks validate browser persistence.'
  },
  'connected-note-recover': {
    reasoning: 'Unknown JSON must pass shape, version, type, and length validation before becoming trusted state. Recovery does not rewrite the original evidence.',
    trace: 'Version 2 with Ada becomes empty/Recovered while the raw record stays intact. Editing Repaired and saving replaces it; Reload reads Repaired/Ready.',
    alternative: 'Partial salvage may retain text but can violate a versioned schema; all-or-nothing recovery is the authored policy here.',
    counterexample: 'A type assertion accepts a numeric text field at runtime and cannot establish safety.',
    transfer: 'Introduce version 2 with a title field; choose an explicit migration instead of silently accepting both.'
  },
  'connected-note-test': {
    reasoning: 'The learner test table includes valid, missing, malformed, and exact-limit cases. Each exception is isolated so later cases still run.',
    trace: 'The version mutant passes ordinary valid data but returns Ada for version 2; verify reports only version. A throwing reader fails all eight cases.',
    alternative: 'Assertions that stop at the first failure are simpler, but a list of failures gives fuller feedback in this contract.',
    counterexample: 'Checking only that the reader does not throw misses a version-accepting faulty reader.',
    transfer: 'Write a new faulty reader that rejects exactly 80 characters, then identify a case that exposes it; this transfer is self-reviewed.'
  },
  'connected-note-independent': {
    reasoning: 'A connected feature needs agreement between editing, accepted state, the stored snapshot, recovery, and test observations. Behavior alone cannot certify the chosen module structure.',
    trace: 'Recover invalid JSON without overwriting it, edit Bo, save, edit discard, then reload: Bo returns with Ready while learner tests still expose the version mutant.',
    alternative: 'A single module can satisfy behavior but couples rendering and validation; separated owners make changed policies easier to review.',
    counterexample: 'A successful save followed by editing must show Unsaved; leaving Saved misreports the current draft.',
    transfer: 'Extend the brief to two separate notes and explain how identity, storage validation, and checks change.'
  }
}

export const connectedFeatureGuides: Record<string, { plan: string[]; explanation: string[]; example: string }> = {
  'connected-note-state': {
    plan: [
      'Name the state and boundary that this checkpoint owns.',
      'List an integration observation that must remain true.'
    ],
    explanation: [
      'Ada/Ready becomes empty/Unsaved after clearing; the original remains Ada/Ready.',
      'Separate checked behavior from types, module quality, keyboard review, and real storage limitations.'
    ],
    example: 'Fresh transitions leave the old state available for comparison. The status describes the transition, not the truthiness of the text. Ada/Ready becomes empty/Unsaved after clearing; the original remains Ada/Ready.'
  },
  'connected-note-render': {
    plan: [
      'Name the state and boundary that this checkpoint owns.',
      'List an integration observation that must remain true.'
    ],
    explanation: [
      'Text <b>A</b> remains seven literal characters, with no child element in output.',
      'Separate checked behavior from types, module quality, keyboard review, and real storage limitations.'
    ],
    example: 'The rendering module derives literal output from state and links one label to the editable control. Text <b>A</b> remains seven literal characters, with no child element in output.'
  },
  'connected-note-input': {
    plan: [
      'Name the state and boundary that this checkpoint owns.',
      'List an integration observation that must remain true.'
    ],
    explanation: [
      'Ada is accepted; 81 a characters leave output Ada and status Too long; Ok then replaces it with Unsaved.',
      'Separate checked behavior from types, module quality, keyboard review, and real storage limitations.'
    ],
    example: 'Accepted state changes only for values within the limit. The input can hold invalid text while output retains the last accepted value. Ada is accepted; 81 a characters leave output Ada and status Too long; Ok then replaces it with Unsaved.'
  },
  'connected-note-save': {
    plan: [
      'Name the state and boundary that this checkpoint owns.',
      'List an integration observation that must remain true.'
    ],
    explanation: [
      'Save Bo succeeds; editing again shows Unsaved; a failing save leaves the stored Bo snapshot unchanged.',
      'Separate checked behavior from types, module quality, keyboard review, and real storage limitations.'
    ],
    example: 'The saved snapshot changes only after successful explicit saving. A failed write cannot claim Saved or remove the draft. Save Bo succeeds; editing again shows Unsaved; a failing save leaves the stored Bo snapshot unchanged.'
  },
  'connected-note-recover': {
    plan: [
      'Name the state and boundary that this checkpoint owns.',
      'List an integration observation that must remain true.'
    ],
    explanation: [
      'Version 2 with Ada becomes empty/Recovered while the raw record stays intact. Editing Repaired and saving replaces it; Reload reads Repaired/Ready.',
      'Separate checked behavior from types, module quality, keyboard review, and real storage limitations.'
    ],
    example: 'Unknown JSON must pass shape, version, type, and length validation before becoming trusted state. Recovery does not rewrite the original evidence. Version 2 with Ada becomes empty/Recovered while the raw record stays intact. Editing Repaired and saving replaces it; Reload reads Repaired/Ready.'
  },
  'connected-note-test': {
    plan: [
      'Name the state and boundary that this checkpoint owns.',
      'List an integration observation that must remain true.'
    ],
    explanation: [
      'The version mutant passes ordinary valid data but returns Ada for version 2; verify reports only version. A throwing reader fails all eight cases.',
      'Separate checked behavior from types, module quality, keyboard review, and real storage limitations.'
    ],
    example: 'The learner test table includes valid, missing, malformed, and exact-limit cases. Each exception is isolated so later cases still run. The version mutant passes ordinary valid data but returns Ada for version 2; verify reports only version. A throwing reader fails all eight cases.'
  },
  'connected-note-independent': {
    plan: [
      'Name the state and boundary that this checkpoint owns.',
      'List an integration observation that must remain true.'
    ],
    explanation: [
      'Recover invalid JSON without overwriting it, edit Bo, save, edit discard, then reload: Bo returns with Ready while learner tests still expose the version mutant.',
      'Separate checked behavior from types, module quality, keyboard review, and real storage limitations.'
    ],
    example: 'A connected feature needs agreement between editing, accepted state, the stored snapshot, recovery, and test observations. Behavior alone cannot certify the chosen module structure. Recover invalid JSON without overwriting it, edit Bo, save, edit discard, then reload: Bo returns with Ready while learner tests still expose the version mutant.'
  }
}
