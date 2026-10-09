import type { Rep } from './rep.ts'
import type { RepDepth } from './rep-depth.ts'

// Observation and step helpers for the sandboxed DOM checks. Targets are data-testid values.
const see = (target: string, read: string, value: unknown) => ({ target, read, value })
const type = (target: string, value: string) => ({ do: 'type', target, value })
const click = (target: string) => ({ do: 'click', target })
const focus = (target: string) => ({ do: 'focus', target })
const mark = (target: string) => ({ do: 'mark', target })
const submit = (target: string) => ({ do: 'submit', target })
const key = (name: string) => ({ do: 'key', key: name })
const dom = (props: unknown, steps: unknown[], expected: unknown[]) => ({ input: [{ props, steps }], expected })

const formProps = { fields: [
  { id: 'name', label: 'Full name', type: 'text', message: 'Enter your full name.' },
  { id: 'email', label: 'Email address', type: 'email', message: 'Enter your email address.' },
] }
const markupForm = { fields: [{ id: 'name', label: 'Full name', type: 'text', message: '<b>Required</b>' }] }
const disclosureProps = { label: 'Shipping details', content: 'Orders ship within two business days.', open: false }
const tabsProps = { label: 'Account settings', tabs: [
  { id: 'profile', title: 'Profile', content: 'Edit your name.' },
  { id: 'security', title: 'Security', content: 'Change your password.' },
  { id: 'billing', title: 'Billing', content: 'Update your card.' },
] }
const searchProps = { items: ['Apple', 'Banana', 'Pineapple', 'Apricot'] }
const allFruit = ['Apple', 'Banana', 'Pineapple', 'Apricot']
const selected = (profile: string, security: string, billing: string) => [see('tab-profile', 'attr:aria-selected', profile), see('tab-security', 'attr:aria-selected', security), see('tab-billing', 'attr:aria-selected', billing)]
const stops = (profile: number, security: number, billing: number) => [see('tab-profile', 'prop:tabIndex', profile), see('tab-security', 'prop:tabIndex', security), see('tab-billing', 'prop:tabIndex', billing)]
const shown = (profile: boolean, security: boolean, billing: boolean) => [see('panel-profile', 'prop:hidden', !profile), see('panel-security', 'prop:hidden', !security), see('panel-billing', 'prop:hidden', !billing)]
const limits = 'DOM checks run in a sandboxed frame. They establish the authored behavior and attribute contract, not screen-reader output, visual design, or real keyboard use in other browsers. Review those yourself.'

export const domReps: Rep[] = [
  {
    id: 'dom-accessible-form', title: 'Build an accessible form with linked errors', category: 'Frontend accessibility', format: 'frontend',
    context: 'A sign-up form shows an error under each empty field. Sighted users see the red text; people using a screen reader only hear it if the error is programmatically linked to the field and focus moves to the problem.',
    prompt: 'Implement mountAccessibleForm(root, props). Build one form from props.fields; each field has id, label, type, and message. Give every input a visible label tied to it, and a Submit button. On submit, treat a trimmed-empty value as invalid. For each invalid field show its message in a paragraph with id "<id>-error", set aria-invalid="true" on the input, and point the input\'s aria-describedby at that paragraph. Move focus to the first invalid input in field order. Valid fields get no error paragraph, no aria-invalid, and no aria-describedby. When every field is valid, show "Form accepted." in a status paragraph. Never discard what the person typed.',
    example: { input: "submit with name '  ' and email 'ada@example.com'", output: 'Error under Full name, aria-invalid on it, focus on Full name; no error on Email address' },
    note: 'Use data-testid values: form, field-<id> on each input, error-<id> on each error paragraph, submit on the button, and status on the success paragraph. Set the form to novalidate (form.noValidate = true) so the browser does not block your submit handler, and call preventDefault. Render messages as text, not HTML. The checks dispatch a submit event on the form; they do not press the real Submit button or Enter inside a field, so try those yourself. ' + limits,
    acceptanceCriteria: ['Pressing Tab reaches every field and the button in reading order with a visible focus indicator.', 'Clicking a label focuses its input.', 'Resubmitting after fixing a field removes that field\'s error and its ARIA attributes.', 'Test with a real screen reader before claiming it announces the error well.'],
    domPreview: { title: 'Your form implementation', description: 'Submit the empty form, fix one field, and submit again.', props: formProps, review: ['Submit with both fields empty and check that focus lands on the first field.', 'Tab through the form and confirm the focus indicator is always visible.', 'Turn on a screen reader and listen to what is announced for the focused field. Checks cannot judge this.'] },
    vocabulary: [{ term: 'Accessible name', meaning: 'the text assistive technology uses to identify a control, such as its label' }, { term: 'aria-describedby', meaning: 'an attribute naming the element whose text describes this control' }, { term: 'aria-invalid', meaning: 'an attribute telling assistive technology a field\'s value is not acceptable' }],
    planPrompt: 'List the attributes and elements that must change for one invalid field, and the ones that must be removed when it becomes valid. In what order will you validate fields so focus lands on the first invalid one, and where will you keep the typed values?',
    starter: 'type FormProps = { fields: { id: string; label: string; type: string; message: string }[] }\n\nfunction mountAccessibleForm(root: HTMLElement, props: FormProps): void {\n  // Build the form with document.createElement and attach it to root.\n  // Use data-testid values: form, field-<id>, error-<id>, submit, status.\n  root.replaceChildren()\n}\n',
    functionName: 'mountAccessibleForm', preserveInput: true,
    hints: ['Build the form once and update it on submit; rebuilding it would throw away typed values and the element you want to focus.', 'Write one helper that applies or clears the error state for a single field, so the invalid and valid paths cannot drift apart.', 'Collect the invalid fields in order first, update every field, then focus only the first invalid input at the end.'],
    checks: [
      { name: 'Starts with labelled inputs and no errors', ...dom(formProps, [], [see('form', 'prop:noValidate', true), see('field-name', 'label', 'Full name'), see('field-email', 'label', 'Email address'), see('field-email', 'prop:type', 'email'), see('error-name', 'exists', false), see('field-name', 'attr:aria-invalid', null), see('status', 'exists', false)]) },
      { name: 'Empty submit links every error and focuses the first field', ...dom(formProps, [submit('form')], [see('error-name', 'text', 'Enter your full name.'), see('error-email', 'text', 'Enter your email address.'), see('field-name', 'attr:aria-invalid', 'true'), see('field-name', 'describedBy', ['Enter your full name.']), see('field-email', 'describedBy', ['Enter your email address.']), see('field-name', 'focused', true), see('field-email', 'focused', false), see('status', 'exists', false)]) },
      { name: 'Only the invalid field gets an error and focus', ...dom(formProps, [type('field-name', 'Ada'), submit('form')], [see('error-name', 'exists', false), see('field-name', 'attr:aria-invalid', null), see('field-name', 'attr:aria-describedby', null), see('error-email', 'exists', true), see('field-email', 'focused', true), see('field-name', 'prop:value', 'Ada')]) },
      { name: 'Whitespace-only text is invalid and is not rewritten', ...dom(formProps, [type('field-name', '   '), type('field-email', 'ada@example.com'), submit('form')], [see('error-name', 'text', 'Enter your full name.'), see('field-name', 'focused', true), see('field-name', 'prop:value', '   '), see('field-email', 'attr:aria-invalid', null)]) },
      { name: 'Fixing every field clears the errors and reports success', ...dom(formProps, [submit('form'), type('field-name', 'Ada'), type('field-email', 'ada@example.com'), submit('form')], [see('error-name', 'exists', false), see('error-email', 'exists', false), see('field-name', 'attr:aria-invalid', null), see('field-email', 'attr:aria-invalid', null), see('field-email', 'attr:aria-describedby', null), see('status', 'text', 'Form accepted.')]) },
      { name: 'Submitting twice does not duplicate errors', ...dom(formProps, [submit('form'), submit('form')], [see('error-name', 'count', 1), see('error-email', 'count', 1), see('field-name', 'describedBy', ['Enter your full name.']), see('field-name', 'focused', true)]) },
      { name: 'Focus moves to the first field that is still invalid', ...dom(formProps, [submit('form'), type('field-name', 'Ada'), submit('form')], [see('error-name', 'exists', false), see('error-email', 'exists', true), see('field-email', 'focused', true), see('field-name', 'focused', false)]) },
      { name: 'Error messages containing markup remain text', ...dom(markupForm, [submit('form')], [see('error-name', 'text', '<b>Required</b>'), see('error-name', 'prop:childElementCount', 0), see('field-name', 'describedBy', ['<b>Required</b>'])]) },
    ],
  },
  {
    id: 'dom-disclosure', title: 'Build a keyboard-operable disclosure', category: 'Frontend accessibility', format: 'frontend',
    context: 'A "Shipping details" section opens and closes on demand. Clickable divs look right but are skipped by Tab and ignore Enter and Space; a real button gets both for free, and attributes tell assistive technology which panel it controls and whether it is open.',
    prompt: 'Implement mountDisclosure(root, props) with props.label, props.content, and props.open. Render a real button whose text is the label and a panel containing the content as text. The button must have type="button", aria-expanded set to the string "true" or "false", and aria-controls equal to the panel\'s id. When collapsed the panel is hidden (the hidden property); when expanded it is not. Start in the state given by props.open. Each click toggles the state and updates both aria-expanded and the panel. The button keeps its label and stays focused after toggling.',
    example: { input: "label 'Shipping details', open false, one click", output: 'aria-expanded "true" and the panel visible' },
    note: 'Use data-testid="toggle" on the button and data-testid="panel" on the panel; give the panel an id and point aria-controls at it. Render content with textContent. A native button turns Enter and Space into a click, so the checks click the button; they cannot press real keys on it. ' + limits,
    acceptanceCriteria: ['Tab reaches the button; Enter and Space toggle it in a real browser.', 'Focus remains visibly on the button after toggling.', 'Collapsed content is not read or reachable.', 'Try a screen reader to confirm it announces expanded or collapsed.'],
    domPreview: { title: 'Your disclosure implementation', description: 'Toggle the section with the mouse, then with Tab and Enter or Space.', props: disclosureProps, review: ['Reach the button with Tab and toggle it with both Enter and Space.', 'Confirm the focus indicator stays on the button after each toggle.', 'With a screen reader, listen for the expanded or collapsed announcement. Checks cannot judge this.'] },
    vocabulary: [{ term: 'Disclosure', meaning: 'a control that shows or hides a section of content' }, { term: 'aria-expanded', meaning: 'an attribute telling assistive technology whether the controlled content is shown' }, { term: 'aria-controls', meaning: 'an attribute naming the element a control affects' }],
    planPrompt: 'Which element gives you keyboard operation without extra code, and why does that matter here? Name the three things that must change together when the state flips, and say where the single source of truth for open or closed will live.',
    starter: 'type DisclosureProps = { label: string; content: string; open: boolean }\n\nfunction mountDisclosure(root: HTMLElement, props: DisclosureProps): void {\n  // Build a button and a panel. Use data-testid values: toggle and panel.\n  root.replaceChildren()\n}\n',
    functionName: 'mountDisclosure', preserveInput: true,
    hints: ['A real button already handles Tab, Enter, and Space, so you only need a click listener.', 'Keep the open state in one variable and write one function that applies it to aria-expanded and the panel together.', 'Update the existing elements instead of rebuilding them, or the button loses focus after the click.'],
    checks: [
      { name: 'Renders a real button wired to its panel', ...dom(disclosureProps, [], [see('toggle', 'tag', 'button'), see('toggle', 'attr:type', 'button'), see('toggle', 'text', 'Shipping details'), see('toggle', 'prop:tabIndex', 0), see('toggle', 'controls', 'panel'), see('panel', 'text', 'Orders ship within two business days.')]) },
      { name: 'Starts collapsed when open is false', ...dom(disclosureProps, [], [see('toggle', 'attr:aria-expanded', 'false'), see('panel', 'prop:hidden', true)]) },
      { name: 'Starts expanded when open is true', ...dom({ ...disclosureProps, open: true }, [], [see('toggle', 'attr:aria-expanded', 'true'), see('panel', 'prop:hidden', false)]) },
      { name: 'Clicking expands the panel and updates the attribute', ...dom(disclosureProps, [click('toggle')], [see('toggle', 'attr:aria-expanded', 'true'), see('panel', 'prop:hidden', false)]) },
      { name: 'Clicking again collapses it', ...dom(disclosureProps, [click('toggle'), click('toggle')], [see('toggle', 'attr:aria-expanded', 'false'), see('panel', 'prop:hidden', true)]) },
      { name: 'The button keeps focus and its label after toggling', ...dom(disclosureProps, [focus('toggle'), click('toggle'), click('toggle'), click('toggle')], [see('toggle', 'focused', true), see('toggle', 'text', 'Shipping details'), see('toggle', 'count', 1), see('panel', 'count', 1)]) },
      { name: 'Content containing markup remains text', ...dom({ ...disclosureProps, content: '<i>Fast</i>' }, [click('toggle')], [see('panel', 'text', '<i>Fast</i>'), see('panel', 'prop:childElementCount', 0)]) },
    ],
  },
  {
    id: 'dom-tabs', title: 'Build tabs with roving tabindex', category: 'Frontend accessibility', format: 'frontend',
    context: 'A settings page has Profile, Security, and Billing tabs. Keyboard users expect one Tab stop for the whole tab list and arrow keys to move between tabs, with the matching panel shown.',
    prompt: 'Implement mountTabs(root, props) with props.label and props.tabs (id, title, content). Render a container with role="tablist" and aria-label equal to props.label. Each tab is a button with role="tab", type="button", id "tab-<id>", aria-controls "panel-<id>", and aria-selected "true" or "false". Only the selected tab has tabindex 0; the others have -1. Each panel has role="tabpanel", id "panel-<id>", aria-labelledby "tab-<id>", and is hidden unless selected. The first tab starts selected. Clicking a tab selects it. On keydown, ArrowRight and ArrowLeft move to the next or previous tab and wrap around, Home goes to the first, and End to the last; the new tab is selected and receives focus. Other keys do nothing.',
    example: { input: 'Focus Billing (the last tab) and press ArrowRight', output: 'Profile becomes selected and focused; its tabindex is 0 and the other tabs are -1' },
    note: 'Use data-testid values tablist, tab-<id>, and panel-<id> (the same strings as the ids). Render titles and content with textContent. Selecting a tab with the arrow keys is called automatic activation. Checks drive keys by dispatching keydown events on the focused element; they cannot show how a screen reader announces the tabs. ' + limits,
    acceptanceCriteria: ['Tab enters the tab list once and a second Tab leaves it for the panel content.', 'Arrow keys move focus and the visible selection together.', 'Hidden panels cannot be reached or read.', 'Try a screen reader to confirm that tab, position, and selected state are announced.'],
    domPreview: { title: 'Your tabs implementation', description: 'Click a tab, then use Tab, the arrow keys, Home, and End.', props: tabsProps, review: ['Press Tab once to enter the tab list and again to leave it.', 'Use ArrowLeft, ArrowRight, Home, and End and watch focus and selection stay together.', 'With a screen reader, listen for the tab position and selected state. Checks cannot judge this.'] },
    vocabulary: [{ term: 'Roving tabindex', meaning: 'keeping exactly one item in a group at tabindex 0 and moving that stop as focus moves' }, { term: 'Tablist', meaning: 'a role for the container of a set of tabs' }, { term: 'Automatic activation', meaning: 'selecting a tab as soon as it receives focus from the arrow keys' }],
    planPrompt: 'Write the single function that selects tab number n and list everything it updates. How will you compute the next index with wrap-around for ArrowRight and ArrowLeft, and what keeps exactly one tab at tabindex 0?',
    starter: 'type TabsProps = { label: string; tabs: { id: string; title: string; content: string }[] }\n\nfunction mountTabs(root: HTMLElement, props: TabsProps): void {\n  // Build the tablist and panels. Use data-testid values: tablist, tab-<id>, panel-<id>.\n  root.replaceChildren()\n}\n',
    functionName: 'mountTabs', preserveInput: true,
    hints: ['Create all tabs and panels once, then write one select(index) function that updates every tab and panel in a loop.', 'Compute the target index from the focused tab\'s index: add or subtract one with wrap-around, or jump to 0 or the last index.', 'Inside select, set aria-selected, tabindex, and hidden from the same comparison, and call focus on the chosen tab only when the keyboard moved it.'],
    checks: [
      { name: 'Exposes tablist, tab, and tabpanel relationships', ...dom(tabsProps, [], [see('tablist', 'attr:role', 'tablist'), see('tablist', 'attr:aria-label', 'Account settings'), see('tab-profile', 'attr:role', 'tab'), see('tab-profile', 'tag', 'button'), see('tab-profile', 'attr:type', 'button'), see('tab-profile', 'controls', 'panel-profile'), see('tab-billing', 'controls', 'panel-billing'), see('panel-security', 'attr:role', 'tabpanel'), see('panel-security', 'attr:aria-labelledby', 'tab-security')]) },
      { name: 'Selects the first tab and one tab stop initially', ...dom(tabsProps, [], [...selected('true', 'false', 'false'), ...stops(0, -1, -1), ...shown(true, false, false), see('panel-profile', 'text', 'Edit your name.')]) },
      { name: 'Clicking a tab selects it and shows its panel', ...dom(tabsProps, [click('tab-security')], [...selected('false', 'true', 'false'), ...stops(-1, 0, -1), ...shown(false, true, false)]) },
      { name: 'ArrowRight selects and focuses the next tab', ...dom(tabsProps, [focus('tab-profile'), key('ArrowRight')], [...selected('false', 'true', 'false'), ...stops(-1, 0, -1), see('tab-security', 'focused', true), ...shown(false, true, false)]) },
      { name: 'ArrowRight wraps from the last tab to the first', ...dom(tabsProps, [click('tab-billing'), focus('tab-billing'), key('ArrowRight')], [...selected('true', 'false', 'false'), see('tab-profile', 'focused', true), ...stops(0, -1, -1)]) },
      { name: 'ArrowLeft wraps from the first tab to the last', ...dom(tabsProps, [focus('tab-profile'), key('ArrowLeft')], [...selected('false', 'false', 'true'), see('tab-billing', 'focused', true), ...shown(false, false, true)]) },
      { name: 'End jumps to the last tab', ...dom(tabsProps, [focus('tab-profile'), key('End')], [...selected('false', 'false', 'true'), see('tab-billing', 'focused', true), ...stops(-1, -1, 0)]) },
      { name: 'Home jumps to the first tab', ...dom(tabsProps, [click('tab-billing'), focus('tab-billing'), key('Home')], [...selected('true', 'false', 'false'), see('tab-profile', 'focused', true), ...shown(true, false, false)]) },
      { name: 'Other keys leave the selection alone', ...dom(tabsProps, [focus('tab-profile'), key('a'), key('ArrowDown')], [...selected('true', 'false', 'false'), see('tab-profile', 'focused', true), ...stops(0, -1, -1)]) },
      { name: 'Titles and content containing markup remain text', ...dom({ label: 'One', tabs: [{ id: 'a', title: '<b>A</b>', content: '<i>x</i>' }] }, [], [see('tab-a', 'text', '<b>A</b>'), see('panel-a', 'text', '<i>x</i>'), see('tab-a', 'prop:childElementCount', 0)]) },
    ],
  },
  {
    id: 'dom-live-search', title: 'Announce live search results politely', category: 'Frontend accessibility', format: 'frontend',
    context: 'A fruit filter updates the list as you type. A sighted person sees the list change; a screen reader user hears nothing unless a polite live region reports the new result count. The empty state also needs plain words.',
    prompt: 'Implement mountLiveSearch(root, props) with props.items (strings). Render a search input with a visible label "Filter items", a list (ul) with one li per visible item, and a status paragraph that is a polite live region (aria-live="polite"). Create the status paragraph during the first render, not after the first keystroke, and update its text in place. On every input event, filter items by a trimmed, case-insensitive substring of the input value, keeping original labels and order, and leave the typed value as entered. The status reads "<n> results", or "1 result" for exactly one. When nothing matches, also show a paragraph "No items match your search." in addition to the status; remove it when matches return.',
    example: { input: "items Apple, Banana, Pineapple, Apricot; typed ' AP '", output: "list: Apple, Pineapple, Apricot; status: '3 results'" },
    note: 'Use data-testid values: search on the input, item on each li, status on the live region, and empty on the empty-state paragraph. Render items with textContent. Do not replace the status or input elements on each keystroke: a live region that is recreated may not be announced, and a recreated input loses focus. ' + limits,
    acceptanceCriteria: ['Typing keeps focus in the input and the cursor position.', 'The count changes after each keystroke without moving focus.', 'The empty message is visible text, not only color or an icon.', 'Test with a real screen reader before claiming the count is announced well.'],
    domPreview: { title: 'Your live search implementation', description: 'Type to filter, try a query with no matches, then clear it.', props: searchProps, review: ['Type and confirm focus stays in the input and the count changes.', 'Search for something that does not exist and confirm the empty message appears.', 'With a screen reader, listen for the polite announcement of the count. Checks cannot judge this.'] },
    vocabulary: [{ term: 'Live region', meaning: 'an element whose text changes are announced by assistive technology without moving focus' }, { term: 'Polite', meaning: 'announce when the person is idle rather than interrupting them' }, { term: 'Empty state', meaning: 'the message shown when a list has nothing to display' }],
    planPrompt: 'Which elements are created once and which are updated on each input event? Write the exact status text for 0, 1, and several results, and say what you will do to keep the original item labels and order while filtering.',
    starter: 'type SearchProps = { items: string[] }\n\nfunction mountLiveSearch(root: HTMLElement, props: SearchProps): void {\n  // Build the label, input, status, and list once, then update them on input.\n  // Use data-testid values: search, item, status, empty.\n  root.replaceChildren()\n}\n',
    functionName: 'mountLiveSearch', preserveInput: true,
    hints: ['Create the input, status paragraph, and list once, then write a single render function that only changes their contents.', 'Compute the matching items from props.items and the normalized query first; derive the status text and empty message from that same array.', 'Set aria-live on the status element before the first update and keep it in the page; add or remove only the empty-state paragraph.'],
    checks: [
      { name: 'Starts with a labelled input, all items, and a polite status', ...dom(searchProps, [], [see('search', 'tag', 'input'), see('search', 'label', 'Filter items'), see('item', 'texts', allFruit), see('item', 'parentTag', 'ul'), see('status', 'exists', true), see('status', 'text', '4 results'), see('status', 'attr:aria-live', 'polite'), see('empty', 'exists', false)]) },
      { name: 'Filters with a trimmed, case-insensitive query', ...dom(searchProps, [type('search', ' AP ')], [see('item', 'texts', ['Apple', 'Pineapple', 'Apricot']), see('status', 'text', '3 results'), see('search', 'prop:value', ' AP '), see('empty', 'exists', false)]) },
      { name: 'Uses the singular for exactly one result', ...dom(searchProps, [type('search', 'apr')], [see('item', 'texts', ['Apricot']), see('status', 'text', '1 result')]) },
      { name: 'Shows the empty state and a zero count when nothing matches', ...dom(searchProps, [type('search', 'zzz')], [see('item', 'texts', []), see('status', 'text', '0 results'), see('empty', 'text', 'No items match your search.'), see('empty', 'count', 1)]) },
      { name: 'Clearing the search restores the list and removes the empty state', ...dom(searchProps, [type('search', 'zzz'), type('search', '')], [see('item', 'texts', allFruit), see('status', 'text', '4 results'), see('empty', 'exists', false)]) },
      { name: 'Keeps the same live region and input while typing', ...dom(searchProps, [mark('status'), mark('search'), focus('search'), type('search', 'a'), type('search', 'ap'), type('search', 'zzz')], [see('status', 'prop:__marked', true), see('status', 'count', 1), see('status', 'attr:aria-live', 'polite'), see('search', 'prop:__marked', true), see('search', 'focused', true)]) },
      { name: 'Item labels containing markup remain text', ...dom({ items: ['<b>Ada</b>'] }, [], [see('item', 'texts', ['<b>Ada</b>']), see('item', 'prop:childElementCount', 0), see('status', 'text', '1 result')]) },
    ],
  },
]

export const domGuides: Record<string, { plan: string[]; explanation: string[]; example: string }> = {
  'dom-accessible-form': {
    plan: ['List what changes on an invalid field and what is removed when it becomes valid.', 'Validate in field order, update every field, then move focus once.', 'Keep typed values by updating the existing form instead of rebuilding it.'],
    explanation: ['Trace a submit with the second field empty and say which attributes and which focus result.', 'Explain why a visible message alone is not enough for a screen reader user.', 'Say what the checks do not prove: real announcements, visual design, and browser differences.'],
    example: 'I build the form once. A helper sets or clears aria-invalid, aria-describedby, and the error paragraph for one field. On submit I run the helper for each field in order, remember the first invalid input, and focus it at the end. The checks confirm attributes and focus in a sandbox; I still need to listen with a screen reader.',
  },
  'dom-disclosure': {
    plan: ['Choose the element that provides keyboard behavior natively.', 'Keep one open or closed value and apply it in one function.', 'Update existing elements so focus is not lost.'],
    explanation: ['Trace a click from closed to open and name the three things that change.', 'Explain why a div with a click handler is not equivalent to a button.', 'Say what the checks cannot show about real Enter and Space presses or announcements.'],
    example: 'I render a button and a panel once with matching id and aria-controls. A setOpen function writes aria-expanded and the panel\'s hidden property from one boolean, and the click listener flips that boolean. Because the button is native, Tab, Enter, and Space work; I confirm that by hand.',
  },
  'dom-tabs': {
    plan: ['Write one select(index) function and list everything it updates.', 'Derive the next index with wrap-around for each key.', 'Keep exactly one tab at tabindex 0.'],
    explanation: ['Trace ArrowRight from the last tab and show the wrap.', 'Explain roving tabindex and why Tab leaves the tab list after one stop.', 'Say what the checks do not cover: screen-reader announcements and manual activation patterns.'],
    example: 'I create the tablist and panels once. select(index) loops over the tabs setting aria-selected, tabindex, and each panel\'s hidden flag from index equality. A keydown listener maps ArrowRight, ArrowLeft, Home, and End to a target index with modulo wrap and calls select with focus. The DOM checks pass in the sandbox; announcements need manual testing.',
  },
  'dom-live-search': {
    plan: ['Decide which elements are created once and which are updated.', 'Compute the matches once and derive the list, count, and empty state from them.', 'Write the status text for zero, one, and several results.'],
    explanation: ['Trace typing a query that matches one item, then one that matches none.', 'Explain why the live region must exist before the text changes and must not be recreated.', 'Say what the checks do not prove about how a screen reader announces updates.'],
    example: 'I build the label, input, status paragraph with aria-live polite, and list once. An input listener normalizes the query, filters a copy, rewrites the list items, sets the status text, and adds or removes one empty paragraph. The input and status elements are never replaced. I verify the actual announcement manually.',
  },
}

export const domDepth: Record<string, RepDepth> = {
  'dom-accessible-form': {
    reasoning: 'An error is only useful if the field points at it and focus goes where the person must act. The same helper handles both states so a fixed field cannot keep stale attributes.',
    trace: 'Submit with name "Ada" and an empty email: name passes, so its error and ARIA attributes are cleared; email fails, so its paragraph is shown, aria-invalid becomes true, aria-describedby names that paragraph, and focus moves to email because it is the first invalid input.',
    alternative: 'Browser constraint validation (required, pattern) gives built-in bubbles but little control over wording and linking; a single summary list at the top is another pattern that suits long forms. Choose by contract, not by habit.',
    counterexample: 'Focusing the last invalid field, or leaving aria-invalid set after a fix, still renders the right visible text but sends keyboard and screen reader users to the wrong place or reports a valid field as broken.',
    transfer: 'Add a password-confirmation field whose error says the values differ. Decide where it sits in the focus order and which attributes it needs. This changed contract is self-reviewed, not checked.',
  },
  'dom-disclosure': {
    reasoning: 'State, attribute, and visibility must change together, and a native button supplies focusability and keyboard activation without custom key handling.',
    trace: 'Closed: aria-expanded is "false" and the panel is hidden. One click flips the stored boolean to true and setOpen writes "true" and un-hides the panel. A second click reverses both. The button element is never replaced, so focus stays on it.',
    alternative: 'The native details and summary elements provide a disclosure with less code but less control over attributes and styling. A div with role="button" needs tabindex and Enter and Space handling that a button gives for free.',
    counterexample: 'Hiding the panel with only a CSS class while leaving aria-expanded "false" tells a screen reader the section is closed while it is visible. A clickable div is skipped by Tab.',
    transfer: 'Group three disclosures into an accordion where opening one closes the others. Decide which state is shared and how aria-expanded stays consistent. This changed contract is self-reviewed, not checked.',
  },
  'dom-tabs': {
    reasoning: 'Selection is a single index. Every tab and panel attribute is derived from comparing each position to it, and roving tabindex keeps one tab stop for the whole list.',
    trace: 'With Billing (index 2 of 3) focused, ArrowRight computes (2 + 1) % 3 = 0, so select(0) makes Profile aria-selected "true" and tabindex 0, sets the others to "false" and -1, shows the Profile panel, and focuses the Profile tab.',
    alternative: 'Manual activation moves focus with the arrows and selects only on Enter or Space, which suits tabs with expensive panels. Automatic activation, as here, is simpler when panels are cheap.',
    counterexample: 'Leaving every tab at tabindex 0 makes Tab step through each tab instead of entering the list once. Computing the next index without wrap-around makes ArrowRight on the last tab do nothing or crash.',
    transfer: 'Switch to manual activation: arrows move focus only and Enter selects. State which attributes now change on arrow presses. This changed contract is self-reviewed, not checked.',
  },
  'dom-live-search': {
    reasoning: 'The list, count, and empty message are all derived from one filtered array. The live region has to exist before it changes and keep its identity so assistive technology notices the update.',
    trace: 'Typing "zzz" filters the four items to none: the list is cleared, the status text becomes "0 results", and the empty paragraph is added. Clearing the field filters back to four items, resets the status to "4 results", and removes the empty paragraph.',
    alternative: 'Debouncing the announcement avoids a spoken update per keystroke for large lists; role="status" implies a polite live region and is a common alternative to adding aria-live explicitly. The contract here asks for the explicit attribute.',
    counterexample: 'Creating the status paragraph on the first keystroke, or replacing it each time, may produce no announcement because nothing changed inside an existing live region. Rebuilding the input on each event drops focus.',
    transfer: 'Add a "clear" button that restores the list and returns focus to the input. Decide what the status should say afterward. This changed contract is self-reviewed, not checked.',
  },
}
