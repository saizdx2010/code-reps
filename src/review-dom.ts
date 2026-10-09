import type { RepDepth } from './rep-depth.ts'

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
