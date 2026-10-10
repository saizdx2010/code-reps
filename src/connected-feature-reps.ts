import type { Rep, Check } from './rep.ts'
import { encodeFiles } from './project-files.ts'

const stateStarter = 'export type Status = \'Ready\' | \'Unsaved\' | \'Too long\' | \'Saved\' | \'Save failed\' | \'Recovered\'\nexport type State = { text: string\n status: Status }\nexport function initial(text: string): State { return { text: \'\', status: \'Ready\' } }\nexport function edit(state: State, text: string): State { return state }\n'
const stateCheckpointEntry = 'import { initial, edit } from \'./state\'\nexport function inspect(text: string, next: string) { const before = initial(text)\n const after = edit(before, next)\n return { before, after } }\n'
const completedState = 'export type Status = \'Ready\' | \'Unsaved\' | \'Too long\' | \'Saved\' | \'Save failed\' | \'Recovered\'\nexport type State = { text: string\n status: Status }\nexport function initial(text: string): State { return { text, status: \'Ready\' } }\nexport function edit(state: State, text: string): State { return { text, status: \'Unsaved\' } }\n'
const renderStarter = 'export function render(root: HTMLElement, text: string, status: string): void { root.replaceChildren() }\n'
const renderCheckpointEntry = 'import { initial, edit } from \'./state\'\nimport { render } from \'./view\'\ntype Props = { text: string\n raw: string | null\n failSave: boolean\n faulty?: string }\nexport function mountNote(root: HTMLElement, props: Props): void {\n  let state = initial(props.text)\n  render(root, state.text, state.status)\n}\n'
const completedView = 'export function render(root: HTMLElement, text: string, status: string): void {\n  root.replaceChildren()\n  const label = document.createElement(\'label\')\n label.htmlFor = \'note-input\'\n label.textContent = \'Note\'\n  const input = document.createElement(\'input\')\n input.id = \'note-input\'\n input.dataset.testid = \'note\'\n input.value = text\n  const output = document.createElement(\'p\')\n output.dataset.testid = \'output\'\n output.textContent = text\n  const message = document.createElement(\'p\')\n message.dataset.testid = \'status\'\n message.setAttribute(\'role\', \'status\')\n message.textContent = status\n  root.append(label, input, output, message)\n}\n'
const inputCheckpointEntry = 'import { initial, edit } from \'./state\'\nimport { render } from \'./view\'\ntype Props = { text: string\n raw: string | null\n failSave: boolean\n faulty?: string }\nexport function mountNote(root: HTMLElement, props: Props): void {\n  let state = initial(props.text)\n  render(root, state.text, state.status)\n  const input = root.querySelector<HTMLInputElement>(\'[data-testid="note"]\')!\n  const output = root.querySelector<HTMLElement>(\'[data-testid="output"]\')!\n  const status = root.querySelector<HTMLElement>(\'[data-testid="status"]\')!\n  input.addEventListener(\'input\', () => {\n    if (input.value.length > 80) { state = { ...state, status: \'Too long\' } }\n    else { state = edit(state, input.value) }\n    output.textContent = state.text\n status.textContent = state.status\n  })\n}\n'
const storageStarter = 'export function serialize(text: string): string { return \'\' }\nexport function restore(raw: string | null) { return {text:\'\',status:\'Ready\'} }\n'
const saveCheckpointEntry = 'import { initial, edit } from \'./state\'\nimport { render } from \'./view\'\nimport { restore, serialize } from \'./storage\'\ntype Props = { text: string\n raw: string | null\n failSave: boolean\n faulty?: string }\nexport function mountNote(root: HTMLElement, props: Props): void {\n  let state = restore(props.raw)\n  render(root, state.text, state.status)\n  const input = root.querySelector<HTMLInputElement>(\'[data-testid="note"]\')!\n  const output = root.querySelector<HTMLElement>(\'[data-testid="output"]\')!\n  const status = root.querySelector<HTMLElement>(\'[data-testid="status"]\')!\n  input.addEventListener(\'input\', () => {\n    if (input.value.length > 80) { state = { ...state, status: \'Too long\' } }\n    else { state = edit(state, input.value) }\n    output.textContent = state.text\n status.textContent = state.status\n  })\n  let raw = props.raw\n  const stored = document.createElement(\'p\')\n stored.dataset.testid = \'stored\'\n stored.textContent = raw ?? \'(missing)\'\n  const save = document.createElement(\'button\')\n save.type = \'button\'\n save.dataset.testid = \'save\'\n save.textContent = \'Save\'\n  save.addEventListener(\'click\', () => {\n    if (input.value.length > 80) return\n    if (props.failSave) state = { ...state, status: \'Save failed\' }\n    else { raw = serialize(state.text)\n stored.textContent = raw\n state = { ...state, status: \'Saved\' } }\n    status.textContent = state.status\n  })\n  root.append(save, stored)\n  const reload = document.createElement(\'button\')\n reload.type = \'button\'\n reload.dataset.testid = \'reload\'\n reload.textContent = \'Reload\'\n  reload.addEventListener(\'click\', () => {\n    state = restore(raw)\n input.value = state.text\n output.textContent = state.text\n status.textContent = state.status\n  })\n  root.append(reload)\n}\n'
const recoveryCheckpointEntry = 'export function serialize(text: string): string { return JSON.stringify({version:1,text}) }\nexport function restore(raw: string | null): {text:string\nstatus:string} { return {text:\'\',status:\'Ready\'} }\n'
const testingCheckpointEntry = 'import { initial, edit } from \'./state\'\nimport { render } from \'./view\'\nimport { restore, serialize } from \'./storage\'\nimport { verify } from \'./tests\'\ntype Props = { text: string\n raw: string | null\n failSave: boolean\n faulty?: string }\nexport function mountNote(root: HTMLElement, props: Props): void {\n  let state = restore(props.raw)\n  render(root, state.text, state.status)\n  const input = root.querySelector<HTMLInputElement>(\'[data-testid="note"]\')!\n  const output = root.querySelector<HTMLElement>(\'[data-testid="output"]\')!\n  const status = root.querySelector<HTMLElement>(\'[data-testid="status"]\')!\n  input.addEventListener(\'input\', () => {\n    if (input.value.length > 80) { state = { ...state, status: \'Too long\' } }\n    else { state = edit(state, input.value) }\n    output.textContent = state.text\n status.textContent = state.status\n  })\n  let raw = props.raw\n  const stored = document.createElement(\'p\')\n stored.dataset.testid = \'stored\'\n stored.textContent = raw ?? \'(missing)\'\n  const save = document.createElement(\'button\')\n save.type = \'button\'\n save.dataset.testid = \'save\'\n save.textContent = \'Save\'\n  save.addEventListener(\'click\', () => {\n    if (input.value.length > 80) return\n    if (props.failSave) state = { ...state, status: \'Save failed\' }\n    else { raw = serialize(state.text)\n stored.textContent = raw\n state = { ...state, status: \'Saved\' } }\n    status.textContent = state.status\n  })\n  root.append(save, stored)\n  const reload = document.createElement(\'button\')\n reload.type = \'button\'\n reload.dataset.testid = \'reload\'\n reload.textContent = \'Reload\'\n  reload.addEventListener(\'click\', () => {\n    state = restore(raw)\n input.value = state.text\n output.textContent = state.text\n status.textContent = state.status\n  })\n  root.append(reload)\n  const test = document.createElement(\'button\')\n test.type = \'button\'\n test.dataset.testid = \'test\'\n test.textContent = \'Test reader\'\n  const report = document.createElement(\'p\')\n report.dataset.testid = \'report\'\n  test.addEventListener(\'click\', () => {\n    const reader = props.faulty === \'version\' ? (raw: string | null) => {\n      if (raw === \'{"version":2,"text":"Ada"}\') return { text: \'Ada\', status: \'Ready\' }\n      return restore(raw)\n    } : props.faulty === \'throw\' ? () => { throw new Error(\'Broken reader\') } : restore\n    const failures = verify(reader)\n    report.textContent = failures.length ? \'Failures: \' + failures.join(\', \') : \'All reader cases passed\'\n  })\n  root.append(test, report)\n}\n'
const completedStorage = 'import type { State } from \'./state\'\nexport function restore(raw: string | null): State {\n  if (raw === null) return { text: \'\', status: \'Ready\' }\n  try {\n    const value = JSON.parse(raw)\n    if (!value || typeof value !== \'object\' || Array.isArray(value) || value.version !== 1 || typeof value.text !== \'string\' || value.text.length > 80) throw new Error(\'Invalid\')\n    return { text: value.text, status: \'Ready\' }\n  } catch { return { text: \'\', status: \'Recovered\' } }\n}\nexport function serialize(text: string): string { return JSON.stringify({ version: 1, text }) }\n'
const testingStarter = 'export function verify(read: (raw: string | null) => {text:string\nstatus:string}): string[] { return [] }\n'
const independentEntry = 'export function mountNote(root: HTMLElement, props: {text:string\nraw:string|null\nfailSave:boolean\nfaulty?:string}): void { root.replaceChildren() }\n'

const transition0: Check = {expected: {after: {status: 'Unsaved', text: 'Bo'}, before: {status: 'Ready', text: 'Ada'}}, input: ['Ada', 'Bo'], name: 'Transition 0'}
const transition1: Check = {expected: {after: {status: 'Unsaved', text: 'Ada'}, before: {status: 'Ready', text: ''}}, input: ['', 'Ada'], name: 'Transition 1'}
const transition2: Check = {expected: {after: {status: 'Unsaved', text: ''}, before: {status: 'Ready', text: 'Ada'}}, input: ['Ada', ''], name: 'Transition 2'}
const transition3: Check = {expected: {after: {status: 'Unsaved', text: ' B '}, before: {status: 'Ready', text: ' A '}}, input: [' A ', ' B '], name: 'Transition 3'}
const transition4: Check = {expected: {after: {status: 'Unsaved', text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}, before: {status: 'Ready', text: '<b>'}}, input: ['<b>', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'], name: 'Transition 4'}
const renderInitialNote: Check = {expected: [{read: 'prop:value', target: 'note', value: 'Ada'}, {read: 'label', target: 'note', value: 'Note'}, {read: 'text', target: 'output', value: 'Ada'}, {read: 'text', target: 'status', value: 'Ready'}, {read: 'attr:role', target: 'status', value: 'status'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: []}], name: 'Render initial note'}
const renderEmptyNote: Check = {expected: [{read: 'text', target: 'output', value: ''}, {read: 'prop:value', target: 'note', value: ''}], input: [{props: {failSave: false, raw: '{"version": 1, "text": ""}', text: ''}, steps: []}], name: 'Render empty note'}
const keepMarkupLiteral: Check = {expected: [{read: 'text', target: 'output', value: '<b>A</b>'}, {read: 'prop:childElementCount', target: 'output', value: 0}], input: [{props: {failSave: false, raw: '{"version": 1, "text": "<b>A</b>"}', text: '<b>A</b>'}, steps: []}], name: 'Keep markup literal'}
const editWithoutReplacingFocusedInput: Check = {expected: [{read: 'text', target: 'output', value: ' Bo '}, {read: 'text', target: 'status', value: 'Unsaved'}, {read: 'focused', target: 'note', value: true}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'focus', target: 'note'}, {do: 'type', target: 'note', value: ' Bo '}]}], name: 'Edit without replacing focused input'}
const clearText: Check = {expected: [{read: 'text', target: 'output', value: ''}, {read: 'text', target: 'status', value: 'Unsaved'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: ''}]}], name: 'Clear text'}
const acceptLimit: Check = {expected: [{read: 'text', target: 'output', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}]}], name: 'Accept limit'}
const rejectOverLimitThenRecover: Check = {expected: [{read: 'text', target: 'output', value: 'Ok'}, {read: 'text', target: 'status', value: 'Unsaved'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}, {do: 'type', target: 'note', value: 'Ok'}]}], name: 'Reject over limit then recover'}
const keepLastAcceptedTextOnInvalidInput: Check = {expected: [{read: 'text', target: 'output', value: 'Ada'}, {read: 'prop:value', target: 'note', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}, {read: 'text', target: 'status', value: 'Too long'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}]}], name: 'Keep last accepted text on invalid input'}
const saveLatestLiteralValue: Check = {expected: [{read: 'text', target: 'stored', value: '{"version":1,"text":" <b>Bo</b> "}'}, {read: 'text', target: 'status', value: 'Saved'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: ' <b>Bo</b> '}, {do: 'click', target: 'save'}]}], name: 'Save latest literal value'}
const saveFailurePreservesDraftAndStoredData: Check = {expected: [{read: 'text', target: 'stored', value: 'old'}, {read: 'text', target: 'output', value: 'Bo'}, {read: 'text', target: 'status', value: 'Save failed'}], input: [{props: {failSave: true, raw: 'old', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: 'Bo'}, {do: 'click', target: 'save'}]}], name: 'Save failure preserves draft and stored data'}
const doNotSaveInvalidCurrentInput: Check = {expected: [{read: 'text', target: 'stored', value: '{"version":1,"text":"Ada"}'}, {read: 'text', target: 'status', value: 'Too long'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}, {do: 'click', target: 'save'}]}], name: 'Do not save invalid current input'}
const repeatedSavesUseNewestText: Check = {expected: [{read: 'text', target: 'stored', value: '{"version":1,"text":""}'}, {read: 'text', target: 'status', value: 'Saved'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'click', target: 'save'}, {do: 'type', target: 'note', value: ''}, {do: 'click', target: 'save'}]}], name: 'Repeated saves use newest text'}
const recoverSyntax: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Recovered'}, {read: 'text', target: 'stored', value: '{'}], input: [{props: {failSave: false, raw: '{', text: 'Ada'}, steps: []}], name: 'Recover syntax'}
const recoverArray: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Recovered'}, {read: 'text', target: 'stored', value: '[]'}], input: [{props: {failSave: false, raw: '[]', text: 'Ada'}, steps: []}], name: 'Recover array'}
const recoverNull: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Recovered'}, {read: 'text', target: 'stored', value: 'null'}], input: [{props: {failSave: false, raw: 'null', text: 'Ada'}, steps: []}], name: 'Recover null'}
const recoverVersion: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Recovered'}, {read: 'text', target: 'stored', value: '{"version":2,"text":"Ada"}'}], input: [{props: {failSave: false, raw: '{"version":2,"text":"Ada"}', text: 'Ada'}, steps: []}], name: 'Recover version'}
const recoverType: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Recovered'}, {read: 'text', target: 'stored', value: '{"version":1,"text":3}'}], input: [{props: {failSave: false, raw: '{"version":1,"text":3}', text: 'Ada'}, steps: []}], name: 'Recover type'}
const recoverMissingText: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Recovered'}, {read: 'text', target: 'stored', value: '{"version":1}'}], input: [{props: {failSave: false, raw: '{"version":1}', text: 'Ada'}, steps: []}], name: 'Recover missing text'}
const recoverOverLimit: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Recovered'}, {read: 'text', target: 'stored', value: '{"version": 1, "text": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'}], input: [{props: {failSave: false, raw: '{"version": 1, "text": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}', text: 'Ada'}, steps: []}], name: 'Recover over limit'}
const loadValidBoundary: Check = {expected: [{read: 'text', target: 'output', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}, {read: 'text', target: 'status', value: 'Ready'}], input: [{props: {failSave: false, raw: '{"version": 1, "text": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}', text: 'Ada'}, steps: []}], name: 'Load valid boundary'}
const saveRecoveredDraftAndReload: Check = {expected: [{read: 'prop:value', target: 'note', value: 'Repaired'}, {read: 'text', target: 'output', value: 'Repaired'}, {read: 'text', target: 'status', value: 'Ready'}], input: [{props: {failSave: false, raw: '{', text: 'Ada'}, steps: [{do: 'type', target: 'note', value: 'Repaired'}, {do: 'click', target: 'save'}, {do: 'type', target: 'note', value: 'discard'}, {do: 'click', target: 'reload'}]}], name: 'Save recovered draft and reload'}
const reloadDiscardsUnsavedDraft: Check = {expected: [{read: 'prop:value', target: 'note', value: ''}, {read: 'text', target: 'status', value: 'Ready'}], input: [{props: {failSave: false, raw: null, text: 'Ada'}, steps: [{do: 'type', target: 'note', value: 'discard'}, {do: 'click', target: 'reload'}]}], name: 'Reload discards unsaved draft'}
const readerReferencePassesLearnerTests: Check = {expected: [{read: 'text', target: 'report', value: 'All reader cases passed'}], input: [{props: {failSave: false, raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'click', target: 'test'}]}], name: 'Reader reference passes learner tests'}
const exposeVersionMutant: Check = {expected: [{read: 'text', target: 'report', value: 'Failures: version'}], input: [{props: {failSave: false, faulty: 'version', raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'click', target: 'test'}]}], name: 'Expose version mutant'}
const treatThrownReadersAsFailedCases: Check = {expected: [{read: 'text', target: 'report', value: 'Failures: missing, valid, syntax, shape, version, type, limit, boundary'}], input: [{props: {failSave: false, faulty: 'throw', raw: '{"version":1,"text":"Ada"}', text: 'Ada'}, steps: [{do: 'click', target: 'test'}]}], name: 'Treat thrown readers as failed cases'}

const contract0 = 'Implement `initial(text)` returning `{text,status: Ready}` and `edit(state,text)` returning a fresh `{text,status: Unsaved}`. Keep state unchanged. Use a finite status union in your `State` type. Inputs here are strings of at most 80 code units. The supplied inspect entry returns `{before,after}` for integration checks.'
const contract1 = 'Use a single-line Note input (data-testid note), an associated visible label Note, a paragraph output with literal text, and a status paragraph (role status). Initial status is Ready. Do not change props. Text is preserved exactly, including whitespace; its limit is 80 JavaScript UTF-16 code units. '
const contract2 = 'On input, accept lengths 0–80, update output and status Unsaved. For longer values keep the last accepted output, leave the typed input visible, and show Too long. Preserve the input element and focus. '
const contract3 = 'Add native type=button Save (save) and a stored paragraph (stored). The fixture starts with props.raw, displaying (missing) for null. Save accepted text as `JSON.stringify({version:1,text})` and show Saved. If props.failSave, preserve the stored value and draft and show Save failed. Save while input is over limit does nothing. This is an in-memory storage fixture per mount, not actual browser persistence. '
const contract4 = 'At startup and on native Reload button (reload), read the fixture instead of props.text. Missing data gives empty text and Ready. Accept only a non-null non-array object with version exactly 1 and text a string of at most 80 code units; ignore extra keys. Invalid JSON or shape gives empty text and Recovered; never overwrite invalid stored data until a successful explicit Save. Reload discards unsaved input. '
const contract6 = 'Add native Test reader button (test) and report paragraph (report). Export `verify(read)` from `tests.ts`. Return failing case names in this order: missing (null), valid ({version:1,text: Ada}), syntax ({), shape ([]), version ({version:2,text: Ada}), type ({version:1,text:5}), limit (81 a characters), boundary (80 a characters). Pass raw JSON strings except null. Expected text/status are empty/Ready for missing, Ada/Ready for valid, 80 a characters/Ready for boundary, and empty/Recovered for all invalid cases. A throw fails that case. Report All reader cases passed or Failures: followed by names joined with comma-space. The supplied main module injects a version-accepting mutant or a throwing reader via props.faulty. '

export const connectedFeatureReps: Rep[] = [
  {
    id: 'connected-note-state',
    title: 'Model scratch-note state',
    category: 'Connected browser feature',
    context: 'Build one local scratch-note feature across state, rendering, input, saving, recovery, and testing. Start with the state used by every later checkpoint.',
    prompt: contract0,
    example: {
      input: 'Edit Ada to Bo',
      output: 'Ada / Ready'
    },
    note: 'Review your types, module design, appearance, accessibility, and real storage yourself. No network or packages are available.',
    acceptanceCriteria: [
      'Explain module responsibilities and type guarantees.',
      'Manually review keyboard access, visible focus, and narrow layouts.'
    ],
    vocabulary: [
      {
        term: 'Checkpoint',
        meaning: 'a check that earlier parts still work together'
      },
      {
        term: 'Snapshot',
        meaning: 'the values captured at one point, kept unchanged while later work continues'
      }
    ],
    planPrompt: 'Name the expected outcomes and one boundary before coding. Which existing files need to change, and which earlier behavior must still pass?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'state.ts': stateStarter, 'main.ts': stateCheckpointEntry } }),
    functionName: 'inspect',
    preserveInput: true,
    hints: [
      'Decide which values belong to the note and which describe its latest transition.',
      'An empty string is still a valid note; do not replace it with a default.',
      'Create a fresh object for each transition so the previous snapshot can still be inspected.'
    ],
    checks: [transition0, transition1, transition2, transition3, transition4]
  },
  {
    id: 'connected-note-render',
    title: 'Render the scratch note',
    category: 'Connected browser feature',
    context: 'Build one local scratch-note feature across state, rendering, input, saving, recovery, and testing. This starter carries forward the completed files from the previous checkpoint; your earlier draft is not copied automatically. Compare it with your own files before continuing.',
    prompt: contract1,
    example: {
      input: 'Edit Ada to Bo',
      output: 'Ada / Ready'
    },
    note: 'Review your types, module design, appearance, accessibility, and real storage yourself. No network or packages are available.',
    acceptanceCriteria: [
      'Explain module responsibilities and type guarantees.',
      'Manually review keyboard access, visible focus, and narrow layouts.'
    ],
    vocabulary: [
      {
        term: 'Checkpoint',
        meaning: 'a check that earlier parts still work together'
      },
      {
        term: 'Literal text',
        meaning: 'characters displayed as written rather than interpreted as HTML'
      }
    ],
    planPrompt: 'Name the expected outcomes and one boundary before coding. Which existing files need to change, and which earlier behavior must still pass?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'state.ts': completedState, 'view.ts': renderStarter, 'main.ts': renderCheckpointEntry } }),
    functionName: 'mountNote',
    preserveInput: true,
    hints: [
      'Build the control, its label, the output, and the status as separate elements.',
      'The visible label needs to point to the input id.',
      'Set literal text on the output instead of interpreting it as markup.'
    ],
    checks: [renderInitialNote, renderEmptyNote, keepMarkupLiteral],
    format: 'frontend',
    domPreview: {
      title: 'Scratch note checkpoint',
      description: 'Edit the note and try the controls available in this stage.',
      props: {
        text: 'Ada',
        raw: '{"version":1,"text":"Ada"}',
        failSave: false
      },
      review: [
        'Use Tab and activate native buttons with Enter and Space.',
        'Check focus and readability on a narrow screen.'
      ]
    }
  },
  {
    id: 'connected-note-input',
    title: 'Handle scratch-note input',
    category: 'Connected browser feature',
    context: 'Build one local scratch-note feature across state, rendering, input, saving, recovery, and testing. This starter carries forward the completed files from the previous checkpoint; your earlier draft is not copied automatically. Compare it with your own files before continuing.',
    prompt: contract1 + contract2,
    example: {
      input: 'Edit Ada to Bo',
      output: 'Bo / Unsaved'
    },
    note: 'Review your types, module design, appearance, accessibility, and real storage yourself. No network or packages are available.',
    acceptanceCriteria: [
      'Explain module responsibilities and type guarantees.',
      'Manually review keyboard access, visible focus, and narrow layouts.'
    ],
    vocabulary: [
      {
        term: 'Checkpoint',
        meaning: 'a check that earlier parts still work together'
      },
      {
        term: 'Draft',
        meaning: 'the current edited text before a successful save'
      }
    ],
    planPrompt: 'Name the expected outcomes and one boundary before coding. Which existing files need to change, and which earlier behavior must still pass?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'state.ts': completedState, 'view.ts': completedView, 'main.ts': renderCheckpointEntry } }),
    functionName: 'mountNote',
    preserveInput: true,
    hints: [
      'Distinguish the typed value from the last accepted note.',
      'Check the length before replacing accepted state, and derive feedback from that decision.',
      'Update the existing input and paragraphs; replacing the input discards its focus.'
    ],
    checks: [renderInitialNote, renderEmptyNote, keepMarkupLiteral, editWithoutReplacingFocusedInput, clearText, acceptLimit, rejectOverLimitThenRecover, keepLastAcceptedTextOnInvalidInput],
    format: 'frontend',
    domPreview: {
      title: 'Scratch note checkpoint',
      description: 'Edit the note and try the controls available in this stage.',
      props: {
        text: 'Ada',
        raw: '{"version":1,"text":"Ada"}',
        failSave: false
      },
      review: [
        'Use Tab and activate native buttons with Enter and Space.',
        'Check focus and readability on a narrow screen.'
      ]
    }
  },
  {
    id: 'connected-note-save',
    title: 'Save the scratch note',
    category: 'Connected browser feature',
    context: 'Build one local scratch-note feature across state, rendering, input, saving, recovery, and testing. This starter carries forward the completed files from the previous checkpoint; your earlier draft is not copied automatically. Compare it with your own files before continuing.',
    prompt: contract1 + contract2 + contract3,
    example: {
      input: 'Edit Ada to Bo',
      output: 'Bo / Unsaved'
    },
    note: 'Review your types, module design, appearance, accessibility, and real storage yourself. No network or packages are available.',
    acceptanceCriteria: [
      'Explain module responsibilities and type guarantees.',
      'Manually review keyboard access, visible focus, and narrow layouts.'
    ],
    vocabulary: [
      {
        term: 'Checkpoint',
        meaning: 'a check that earlier parts still work together'
      },
      {
        term: 'Serialization',
        meaning: 'encoding a value as text so it can be read back later'
      }
    ],
    planPrompt: 'Name the expected outcomes and one boundary before coding. Which existing files need to change, and which earlier behavior must still pass?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'state.ts': completedState, 'view.ts': completedView, 'main.ts': inputCheckpointEntry, 'storage.ts': storageStarter } }),
    functionName: 'mountNote',
    preserveInput: true,
    hints: [
      'The draft and saved record can differ; saving is an explicit action.',
      'A save failure must leave both the existing record and the accepted draft available.',
      'Check the currently typed length before saving; only update the record and Saved status after success.'
    ],
    checks: [renderInitialNote, renderEmptyNote, keepMarkupLiteral, editWithoutReplacingFocusedInput, clearText, acceptLimit, rejectOverLimitThenRecover, keepLastAcceptedTextOnInvalidInput, saveLatestLiteralValue, saveFailurePreservesDraftAndStoredData, doNotSaveInvalidCurrentInput, repeatedSavesUseNewestText],
    format: 'frontend',
    domPreview: {
      title: 'Scratch note checkpoint',
      description: 'Edit the note and try the controls available in this stage.',
      props: {
        text: 'Ada',
        raw: '{"version":1,"text":"Ada"}',
        failSave: false
      },
      review: [
        'Use Tab and activate native buttons with Enter and Space.',
        'Check focus and readability on a narrow screen.'
      ]
    }
  },
  {
    id: 'connected-note-recover',
    title: 'Recover an invalid scratch note',
    category: 'Connected browser feature',
    context: 'Build one local scratch-note feature across state, rendering, input, saving, recovery, and testing. This starter carries forward the completed files from the previous checkpoint; your earlier draft is not copied automatically. Compare it with your own files before continuing.',
    prompt: contract1 + contract2 + contract3 + contract4,
    example: {
      input: 'Edit Ada to Bo, Save, edit again, Reload',
      output: 'Bo / Ready'
    },
    note: 'Review your types, module design, appearance, accessibility, and real storage yourself. No network or packages are available.',
    acceptanceCriteria: [
      'Explain module responsibilities and type guarantees.',
      'Manually review keyboard access, visible focus, and narrow layouts.'
    ],
    vocabulary: [
      {
        term: 'Checkpoint',
        meaning: 'a check that earlier parts still work together'
      },
      {
        term: 'Validation',
        meaning: 'checking that unknown data satisfies the rules before using it'
      }
    ],
    planPrompt: 'Name the expected outcomes and one boundary before coding. Which existing files need to change, and which earlier behavior must still pass?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'state.ts': completedState, 'view.ts': completedView, 'main.ts': saveCheckpointEntry, 'storage.ts': recoveryCheckpointEntry } }),
    functionName: 'mountNote',
    preserveInput: true,
    hints: [
      'Parsing a record and trusting its fields are separate decisions.',
      'Check the version, shape, text type, and exact limit before accepting text.',
      'Keep the invalid raw record intact during recovery; explicit successful Save is what replaces it.'
    ],
    checks: [renderInitialNote, renderEmptyNote, keepMarkupLiteral, editWithoutReplacingFocusedInput, clearText, acceptLimit, rejectOverLimitThenRecover, keepLastAcceptedTextOnInvalidInput, saveLatestLiteralValue, saveFailurePreservesDraftAndStoredData, doNotSaveInvalidCurrentInput, repeatedSavesUseNewestText, recoverSyntax, recoverArray, recoverNull, recoverVersion, recoverType, recoverMissingText, recoverOverLimit, loadValidBoundary, saveRecoveredDraftAndReload, reloadDiscardsUnsavedDraft],
    format: 'frontend',
    domPreview: {
      title: 'Scratch note checkpoint',
      description: 'Edit the note and try the controls available in this stage.',
      props: {
        text: 'Ada',
        raw: '{"version":1,"text":"Ada"}',
        failSave: false
      },
      review: [
        'Use Tab and activate native buttons with Enter and Space.',
        'Check focus and readability on a narrow screen.'
      ]
    }
  },
  {
    id: 'connected-note-test',
    title: 'Test the connected scratch note',
    category: 'Connected browser feature',
    context: 'Build one local scratch-note feature across state, rendering, input, saving, recovery, and testing. This starter carries forward the completed files from the previous checkpoint; your earlier draft is not copied automatically. Compare it with your own files before continuing.',
    prompt: contract1 + contract2 + contract3 + contract4 + contract6,
    example: {
      input: 'Edit Ada to Bo, Save, edit again, Reload',
      output: 'Bo / Ready'
    },
    note: 'Review your types, module design, appearance, accessibility, and real storage yourself. No network or packages are available.',
    acceptanceCriteria: [
      'Explain module responsibilities and type guarantees.',
      'Manually review keyboard access, visible focus, and narrow layouts.'
    ],
    vocabulary: [
      {
        term: 'Checkpoint',
        meaning: 'a check that earlier parts still work together'
      },
      {
        term: 'Boundary case',
        meaning: 'an input at or just beyond a rule, such as the maximum allowed length'
      }
    ],
    planPrompt: 'Name the expected outcomes and one boundary before coding. Which existing files need to change, and which earlier behavior must still pass?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'state.ts': completedState, 'view.ts': completedView, 'main.ts': testingCheckpointEntry, 'storage.ts': completedStorage, 'tests.ts': testingStarter } }),
    functionName: 'mountNote',
    preserveInput: true,
    hints: [
      'Choose observations that distinguish a correct reader from a reader with a plausible defect.',
      'A normal valid record cannot expose a reader that wrongly accepts an unsupported version.',
      'Keep running the remaining cases after a throw and compare both the recovered text and its status.'
    ],
    checks: [renderInitialNote, renderEmptyNote, keepMarkupLiteral, editWithoutReplacingFocusedInput, clearText, acceptLimit, rejectOverLimitThenRecover, keepLastAcceptedTextOnInvalidInput, saveLatestLiteralValue, saveFailurePreservesDraftAndStoredData, doNotSaveInvalidCurrentInput, repeatedSavesUseNewestText, recoverSyntax, recoverArray, recoverNull, recoverVersion, recoverType, recoverMissingText, recoverOverLimit, loadValidBoundary, saveRecoveredDraftAndReload, reloadDiscardsUnsavedDraft, readerReferencePassesLearnerTests, exposeVersionMutant, treatThrownReadersAsFailedCases],
    format: 'frontend',
    domPreview: {
      title: 'Scratch note checkpoint',
      description: 'Edit the note and try the controls available in this stage.',
      props: {
        text: 'Ada',
        raw: '{"version":1,"text":"Ada"}',
        failSave: false
      },
      review: [
        'Use Tab and activate native buttons with Enter and Space.',
        'Check focus and readability on a narrow screen.'
      ]
    }
  },
  {
    id: 'connected-note-independent',
    title: 'Build the scratch note independently',
    category: 'Connected browser feature',
    context: 'Build one local scratch-note feature across state, rendering, input, saving, recovery, and testing. Independent brief: start from the requirements and choose your own structure.',
    prompt: contract1 + contract2 + contract3.replace('as JSON.stringify({version:1,text})', 'as compact JSON with version then text fields, escaping text as JSON requires') + contract4 + contract6.replace('Export verify(read) from tests.ts. ', '').replace('The supplied main module injects a version-accepting mutant or a throwing reader via props.faulty.', 'When props.faulty is version, test a reader that incorrectly accepts version 2 with Ada but otherwise follows the contract. When it is throw, test a reader that throws for every input. Otherwise test the correct reader. Choose your own files, types, and implementation.'),
    example: {
      input: 'Edit Ada to Bo, Save, edit again, Reload',
      output: 'Bo / Ready'
    },
    note: 'Review your types, module design, appearance, accessibility, and real storage yourself. No network or packages are available.',
    acceptanceCriteria: [
      'Explain module responsibilities and type guarantees.',
      'Manually review keyboard access, visible focus, and narrow layouts.'
    ],
    vocabulary: [
      {
        term: 'Checkpoint',
        meaning: 'a check that earlier parts still work together'
      },
      {
        term: 'Integration',
        meaning: 'the agreement between parts when a whole feature is used'
      }
    ],
    planPrompt: 'Name the expected outcomes and one boundary before coding. Choose your own approach and explain your decisions afterward.',
    starter: encodeFiles({ entry: 'main.ts', files: { 'main.ts': independentEntry } }),
    functionName: 'mountNote',
    preserveInput: true,
    hints: [
      'Compare your result with each stated requirement.',
      'Trace one boundary from the supplied input to the visible result.',
      'Choose a second observation that could expose a plausible mistake; the brief leaves the implementation to you.'
    ],
    checks: [renderInitialNote, renderEmptyNote, keepMarkupLiteral, editWithoutReplacingFocusedInput, clearText, acceptLimit, rejectOverLimitThenRecover, keepLastAcceptedTextOnInvalidInput, saveLatestLiteralValue, saveFailurePreservesDraftAndStoredData, doNotSaveInvalidCurrentInput, repeatedSavesUseNewestText, recoverSyntax, recoverArray, recoverNull, recoverVersion, recoverType, recoverMissingText, recoverOverLimit, loadValidBoundary, saveRecoveredDraftAndReload, reloadDiscardsUnsavedDraft, readerReferencePassesLearnerTests, exposeVersionMutant, treatThrownReadersAsFailedCases],
    format: 'frontend',
    domPreview: {
      title: 'Scratch note checkpoint',
      description: 'Edit the note and try the controls available in this stage.',
      props: {
        text: 'Ada',
        raw: '{"version":1,"text":"Ada"}',
        failSave: false
      },
      review: [
        'Use Tab and activate native buttons with Enter and Space.',
        'Check focus and readability on a narrow screen.'
      ]
    }
  }
]
