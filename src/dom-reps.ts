import type { Rep } from './rep.ts'

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
const accordionProps = { open: 'shipping', sections: [
  { id: 'shipping', title: 'Shipping', content: 'Orders ship within two days.' },
  { id: 'returns', title: 'Returns', content: 'Return items within thirty days.' },
  { id: 'warranty', title: 'Warranty', content: 'Repairs are covered for a year.' },
] }
const expanded = (shipping: string, returns: string, warranty: string) => [see('header-shipping', 'attr:aria-expanded', shipping), see('header-returns', 'attr:aria-expanded', returns), see('header-warranty', 'attr:aria-expanded', warranty)]
const visible = (shipping: boolean, returns: boolean, warranty: boolean) => [see('panel-shipping', 'prop:hidden', !shipping), see('panel-returns', 'prop:hidden', !returns), see('panel-warranty', 'prop:hidden', !warranty)]
const limits = 'DOM checks run in a sandboxed frame. They establish the authored behavior and attribute contract, not screen-reader output, visual design, or real keyboard use in other browsers. Review those yourself.'

export const domReps: Rep[] = [
  {
    id: 'dom-accessible-form', title: 'Build an accessible form with linked errors', category: 'Frontend accessibility', format: 'frontend',
    context: 'A sign-up form shows an error under each empty field. Sighted users see the red text; people using a screen reader only hear it if the error is programmatically linked to the field and focus moves to the problem.',
    prompt: 'Implement `mountAccessibleForm(root, props)`. Build one form from props.fields; each field has id, label, type, and message. Give every input a visible label element whose for attribute matches the input id, and a Submit button. Set `form.noValidate` = true when creating the form so browser validation cannot block submission. In the submit handler, call preventDefault to stop navigation. On submit, treat a trimmed-empty value as invalid. For each invalid field show its message in a paragraph with id "<id>-error", set `aria-invalid`="true" on the input, and point the input\'s `aria-describedby` at that paragraph. Move focus to the first invalid input in field order. Valid fields get no error paragraph, no `aria-invalid`, and no `aria-describedby`. When every field is valid, show "Form accepted." in a status paragraph. Never discard what the person typed. Use data-testid values: form, field-<id> on each input, error-<id> on each error paragraph, submit on the button, and status on the success paragraph.',
    example: { input: "submit with name '  ' and email 'ada@example.com'", output: 'Error under Full name, aria-invalid on it, focus on Full name; no error on Email address' },
    note: 'Use data-testid values: form, field-<id> on each input, error-<id> on each error paragraph, submit on the button, and status on the success paragraph. Render messages as text, not HTML. The checks dispatch a submit event on the form; they do not press the real Submit button or Enter inside a field, so try those yourself. ' + limits,
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
    prompt: 'Implement `mountDisclosure(root, props)` with props.label, props.content, and props.open. Render a real button whose text is the label and a panel containing the content as text. The button must have type="button", `aria-expanded` set to the string "true" or "false", and `aria-controls` equal to the panel\'s id. When collapsed the panel is hidden (the hidden property); when expanded it is not. Start in the state given by props.open. Each click toggles the state and updates both `aria-expanded` and the panel. The button keeps its label and stays focused after toggling. Use data-testid="toggle" on the button and data-testid="panel" on the panel; give the panel an id and point `aria-controls` at it.',
    example: { input: "label 'Shipping details', open false, one click", output: 'aria-expanded "true" and the panel visible' },
    note: 'Use data-testid="toggle" on the button and data-testid="panel" on the panel; give the panel an id and point `aria-controls` at it. Render content with `textContent`. A native button turns Enter and Space into a click, so the checks click the button; they cannot press real keys on it. ' + limits,
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
    prompt: 'Implement `mountTabs(root, props)` with props.label and props.tabs (id, title, content). Use data-testid values tablist, tab-<id>, and panel-<id> (the same strings as the ids).',
    example: { input: 'Focus Billing (the last tab) and press ArrowRight', output: 'Profile becomes selected and focused; its tabindex is 0 and the other tabs are -1' },
    note: 'Use data-testid values tablist, tab-<id>, and panel-<id> (the same strings as the ids). Render titles and content with `textContent`. Selecting a tab with the arrow keys is called automatic activation. Checks drive keys by dispatching keydown events on the focused element; they cannot show how a screen reader announces the tabs. ' + limits,
    acceptanceCriteria: [
      'Render a container with role="tablist" and aria-label equal to props.label.',
      'Each tab is a button with role="tab", type="button", id "tab-<id>", aria-controls "panel-<id>", and aria-selected "true" or "false".',
      'Only the selected tab has tabindex 0; the others have -1.',
      'Each panel has role="tabpanel", id "panel-<id>", aria-labelledby "tab-<id>", and is hidden unless selected.',
      'The first tab starts selected.',
      'Clicking a tab selects it.',
      'On keydown, ArrowRight and ArrowLeft move to the next or previous tab and wrap around, Home goes to the first, and End to the last; the new tab is selected and receives focus.',
      'Other keys do nothing.',
      'Tab enters the tab list once and a second Tab leaves it for the panel content.',
      'Arrow keys move focus and the visible selection together.',
      'Hidden panels cannot be reached or read.',
      'Try a screen reader to confirm that tab, position, and selected state are announced.',
    ],
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
    prompt: 'Implement `mountLiveSearch(root, props)` with props.items (strings). Render a search input with a visible label "Filter items", a list (ul) with one li per visible item, and a status paragraph that is a polite live region (aria-live="polite"). Create the status paragraph during the first render, not after the first keystroke, and update its text in place. On every input event, filter items by a trimmed, case-insensitive substring of the input value, keeping original labels and order, and leave the typed value as entered. The status reads "<n> results", or "1 result" for exactly one. When nothing matches, also show a paragraph "No items match your search." in addition to the status; remove it when matches return. Use data-testid values: search on the input, item on each li, status on the live region, and empty on the empty-state paragraph.',
    example: { input: "items Apple, Banana, Pineapple, Apricot; typed ' AP '", output: "list: Apple, Pineapple, Apricot; status: '3 results'" },
    note: 'Use data-testid values: search on the input, item on each li, status on the live region, and empty on the empty-state paragraph. Render items with `textContent`. Do not replace the status or input elements on each keystroke: a live region that is recreated may not be announced, and a recreated input loses focus. ' + limits,
    acceptanceCriteria: ['Typing keeps focus in the input and the cursor position.', 'The count changes after each keystroke without moving focus.', 'The empty message is visible text, not only color or an icon.', 'Test with a real screen reader before claiming the count is announced well.'],
    domPreview: { title: 'Your live search implementation', description: 'Type to filter, try a query with no matches, then clear it.', props: searchProps, review: ['Type and confirm focus stays in the input and the count changes.', 'Search for something that does not exist and confirm the empty message appears.', 'With a screen reader, listen for the polite announcement of the count. Checks cannot judge this.'] },
    vocabulary: [{ term: 'Live region', meaning: 'an element whose text changes are announced by assistive technology without moving focus' }, { term: 'Polite', meaning: 'announce when the person is idle rather than interrupting them' }, { term: 'Empty state', meaning: 'the message shown when a list has nothing to display' }],
    planPrompt: 'Which elements are created once and which are updated on each input event? Write the exact status text for 0, 1, and several results, and say what you will do to keep the original item labels and order while filtering.',
    starter: 'type SearchProps = { items: string[] }\n\nfunction mountLiveSearch(root: HTMLElement, props: SearchProps): void {\n  // Build the label, input, status, and list once, then update them on input.\n  // Use data-testid values: search, item, status, empty.\n  root.replaceChildren()\n}\n',
    functionName: 'mountLiveSearch', preserveInput: true,
    hints: ['Create the input, status paragraph, and list once, then write a single render function that only changes their contents.', 'Compute the matching items from props.items and the query after trimming and lowercasing first; derive the status text and empty message from that same array.', 'Set aria-live on the status element before the first update and keep it in the page; add or remove only the empty-state paragraph.'],
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
  {
    id: 'dom-accordion', title: 'Build an accordion where one section stays open', category: 'Frontend accessibility', format: 'frontend',
    context: 'A help page lists Shipping, Returns, and Warranty. People read one answer at a time, so at most one section shows, and keyboard and screen reader users must be able to tell which.',
    prompt: 'Implement `mountAccordion(root, props)` with props.sections (id, title, content) and props.open, the id of the section that starts open or null. For each section render a header control and a panel. The header has type="button", the title as text, `aria-expanded` "true" or "false", and `aria-controls` naming its panel. The panel has role="region", aria-labelledby naming its header, the content as text, and is hidden unless its section is open. At most one section is open. Activating a closed header opens its section and closes the other. Activating the open header closes it, leaving none open. An open id that matches no section means none start open. Headers are not rebuilt, so they keep focus. Use data-testid header-<id> on each header and panel-<id> on each panel,, with matching element ids.',
    example: { input: "open 'shipping', then click Returns", output: 'Returns is expanded and visible; Shipping is collapsed and hidden' },
    note: 'Use data-testid header-<id> and panel-<id> (the same strings as the element ids). Render titles and content with `textContent`. Checks click the headers. ' + limits,
    acceptanceCriteria: ['Tab reaches every header in order; Enter and Space activate the focused one in a real browser.', 'Focus stays visibly on the header you activated.', 'Try a screen reader to confirm that each header announces whether it is expanded.'],
    domPreview: { title: 'Your accordion implementation', description: 'Open each section in turn, then close the open one.', props: accordionProps, review: ['Tab through the headers and activate each with Enter and Space.', 'Confirm the focus indicator stays on the header you activated.', 'With a screen reader, listen for the expanded or collapsed announcement. Checks cannot judge this.'] },
    vocabulary: [{ term: 'Accordion', meaning: 'a stack of sections where each header shows or hides its own panel' }, { term: 'Region', meaning: 'a role for a named block of content' }],
    planPrompt: 'Decide what the one piece of state is and what every header and panel is computed from. What does a click do to that state when the section is closed, and when it is already open?',
    starter: 'type AccordionProps = { open: string | null; sections: { id: string; title: string; content: string }[] }\n\nfunction mountAccordion(root: HTMLElement, props: AccordionProps): void {\n  // Build a header and panel for each section. header-<id>, panel-<id>.\n  root.replaceChildren()\n}\n',
    functionName: 'mountAccordion', preserveInput: true,
    hints: ['Build every header and panel once, then write one function that sets all of them from the current state.', 'Keep a single value for which section is open, and compare each section to it instead of storing a flag per section.', 'A click should store the clicked section, or nothing when it was already the open one, and then reapply the state without rebuilding any element.'],
    checks: [
      { name: 'Renders headers wired to labelled regions', ...dom(accordionProps, [], [see('header-shipping', 'tag', 'button'), see('header-shipping', 'attr:type', 'button'), see('header-returns', 'text', 'Returns'), see('header-warranty', 'controls', 'panel-warranty'), see('panel-returns', 'attr:role', 'region'), see('panel-returns', 'attr:aria-labelledby', 'header-returns'), see('panel-warranty', 'text', 'Repairs are covered for a year.'), see('header-shipping', 'count', 1), see('panel-shipping', 'count', 1)]) },
      { name: 'Starts with only the requested section open', ...dom(accordionProps, [], [...expanded('true', 'false', 'false'), ...visible(true, false, false)]) },
      { name: 'Starts with every section closed when open is null', ...dom({ ...accordionProps, open: null }, [], [...expanded('false', 'false', 'false'), ...visible(false, false, false)]) },
      { name: 'An unknown open id starts with every section closed', ...dom({ ...accordionProps, open: 'missing' }, [], [...expanded('false', 'false', 'false'), ...visible(false, false, false)]) },
      { name: 'Opening another section closes the open one', ...dom(accordionProps, [click('header-returns')], [...expanded('false', 'true', 'false'), ...visible(false, true, false)]) },
      { name: 'Clicking the open header closes it and leaves none open', ...dom(accordionProps, [click('header-shipping')], [...expanded('false', 'false', 'false'), ...visible(false, false, false)]) },
      { name: 'A closed accordion opens the clicked section', ...dom({ ...accordionProps, open: null }, [click('header-warranty')], [...expanded('false', 'false', 'true'), ...visible(false, false, true)]) },
      { name: 'Headers keep identity and focus across several clicks', ...dom(accordionProps, [mark('header-returns'), focus('header-returns'), click('header-returns'), click('header-warranty'), click('header-returns')], [see('header-returns', 'prop:__marked', true), see('header-returns', 'focused', true), see('header-returns', 'count', 1), ...expanded('false', 'true', 'false'), ...visible(false, true, false)]) },
      { name: 'Titles and content containing markup remain text', ...dom({ open: 'a', sections: [{ id: 'a', title: '<b>A</b>', content: '<i>x</i>' }] }, [], [see('header-a', 'text', '<b>A</b>'), see('panel-a', 'text', '<i>x</i>'), see('header-a', 'prop:childElementCount', 0), see('panel-a', 'prop:childElementCount', 0)]) },
    ],
  },
]
