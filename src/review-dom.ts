import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const domGuides: Record<string, ReflectionGuide> = {
  'dom-form-fields': {
    plan: [
      'List the elements one field needs and the order they appear in.',
      'Decide which two form settings put your own submit handler in charge.',
      'Build the form once so later checkpoints can update it.',
    ],
    explanation: [
      'Trace one field from props to its label and input, naming the value that links them.',
      'Explain why a placeholder cannot replace a label.',
      'Say what the checks do not prove: preventDefault being called, real clicks and Enter, and screen-reader names.',
    ],
    example:
      'I create the form, turn off browser validation, and loop over the fields. Each pass creates a label whose for matches the input id, sets the type, and adds a test id. The Submit button comes last and the submit listener only prevents the default action. I click the real button and press Enter to confirm nothing reloads.',
  },
  'dom-form-errors': {
    plan: [
      'List what changes on an invalid field and what is removed when it becomes valid.',
      'Decide how a second submit finds the existing error instead of adding another.',
      'Keep one helper for both states so they cannot drift apart.',
    ],
    explanation: [
      'Trace a submit with the second field empty and name each attribute that changes.',
      'Explain why a visible message alone is not enough for a screen reader user.',
      'Say what the checks do not prove: real announcements, visual design, and browser differences.',
    ],
    example:
      'I keep each field with its wrapper, input, and optional error paragraph. A helper creates or reuses the paragraph and sets aria-invalid and aria-describedby, or removes all three when the field is valid. On submit I run it for every field using the trimmed value. Checks confirm attributes in a sandbox; I still listen with a screen reader.',
  },
  'dom-form-submit': {
    plan: [
      'Validate every field before moving focus, remembering the first invalid one.',
      'Write the two outcomes: problem means focus and no status, success means status.',
      'Decide where the status is created and how a later invalid submit removes it.',
    ],
    explanation: [
      'Trace a submit where only the second field is empty and say where focus ends up.',
      'Explain why focus moves once, at the end, rather than inside the loop.',
      'Say what the checks do not prove: real announcement of the status, focus visibility, and screen-reader behavior.',
    ],
    example:
      'I run the error helper for each field in order and remember the first invalid input. If one exists I remove the status and focus it; otherwise I set the status text and add it once. Re-submitting reuses the same paragraph, so it never duplicates. The sandbox checks confirm focus and text; announcements need manual testing.',
  },
  'dom-accessible-form': {
    plan: [
      'List what changes on an invalid field and what is removed when it becomes valid.',
      'Validate in field order, update every field, then move focus once.',
      'Keep typed values by updating the existing form instead of rebuilding it.',
    ],
    explanation: [
      'Trace a submit with the second field empty and say which attributes and which focus result.',
      'Explain why a visible message alone is not enough for a screen reader user.',
      'Say what the checks do not prove: real announcements, visual design, and browser differences.',
    ],
    example:
      'I build the form once. A helper sets or clears aria-invalid, aria-describedby, and the error paragraph for one field. On submit I run the helper for each field in order, remember the first invalid input, and focus it at the end. The checks confirm attributes and focus in a sandbox; I still need to listen with a screen reader.',
  },
  'dom-disclosure': {
    plan: [
      'Choose the element that provides keyboard behavior natively.',
      'Keep one open or closed value and apply it in one function.',
      'Update existing elements so focus is not lost.',
    ],
    explanation: [
      'Trace a click from closed to open and name the three things that change.',
      'Explain why a div with a click handler is not equivalent to a button.',
      'Say what the checks cannot show about real Enter and Space presses or announcements.',
    ],
    example:
      "I render a button and a panel once with matching id and aria-controls. A setOpen function writes aria-expanded and the panel's hidden property from one boolean, and the click listener flips that boolean. Because the button is native, Tab, Enter, and Space work; I confirm that by hand.",
  },
  'dom-tabs': {
    plan: [
      'Write one select(index) function and list everything it updates.',
      'Derive the next index with wrap-around for each key.',
      'Keep exactly one tab at tabindex 0.',
    ],
    explanation: [
      'Trace ArrowRight from the last tab and show the wrap.',
      'Explain roving tabindex and why Tab leaves the tab list after one stop.',
      'Say what the checks do not cover: screen-reader announcements and manual activation patterns.',
    ],
    example:
      "I create the tablist and panels once. select(index) loops over the tabs setting aria-selected, tabindex, and each panel's hidden flag from index equality. A keydown listener maps ArrowRight, ArrowLeft, Home, and End to a target index with modulo wrap and calls select with focus. The DOM checks pass in the sandbox; announcements need manual testing.",
  },
  'dom-live-search': {
    plan: [
      'Decide which elements are created once and which are updated.',
      'Compute the matches once and derive the list, count, and empty state from them.',
      'Write the status text for zero, one, and several results.',
    ],
    explanation: [
      'Trace typing a query that matches one item, then one that matches none.',
      'Explain why the live region must exist before the text changes and must not be recreated.',
      'Say what the checks do not prove about how a screen reader announces updates.',
    ],
    example:
      'I build the label, input, status paragraph with aria-live polite, and list once. An input listener normalizes the query, filters a copy, rewrites the list items, sets the status text, and adds or removes one empty paragraph. The input and status elements are never replaced. I verify the actual announcement manually.',
  },
  'dom-accordion': {
    plan: [
      'Name the single value every header and panel is computed from.',
      'Write what a click does when the section is closed and when it is open.',
      'Decide what an open id that matches nothing should do.',
    ],
    explanation: [
      'Trace opening a second section while the first is open and name each attribute that changes.',
      'Explain why storing a flag per section can leave two sections open.',
      'Say what the checks do not show about real key presses and announcements.',
    ],
    example:
      'I create every header and panel once and keep one current id. One function loops over the sections and sets aria-expanded and hidden from whether each id equals the current one. A click stores the clicked id, or null when that section was already open, then calls the function. The checks confirm the attributes in a sandbox; I still listen with a screen reader.',
  },
  'dom-reorder-list': {
    plan: [
      'Where does the order live, and how do the list, the disabled states, and the status follow from it?',
      'Decide where focus goes when an item reaches the top.',
    ],
    explanation: [
      'Explain how one move updates the order, the list, every disabled state, and the status together.',
      'Explain where focus lands after each move and why.',
      'State what the checks cannot establish about screen-reader announcements.',
    ],
    example:
      'I keep my own copy of the order and create each item’s row once. A move splices the order, re-appends the rows in that order, and recomputes every disabled state. Focus returns to the clicked button, or to the item’s other button when the clicked one became disabled, and the status names the new position. I still listen with a screen reader.',
  },
  'dom-modal-dialog': {
    plan: [
      'Which element should have focus after opening, Tab on the last button, Escape, and Confirm?',
      'Decide where you listen for keys so every button is covered.',
    ],
    explanation: [
      'Explain how focus is kept inside the dialog and why only the edges need code.',
      'Explain how every way of closing returns focus to the opener.',
      'State what a real browser adds that the checks do not establish.',
    ],
    example:
      'Opening shows the dialog and focuses Confirm. One keydown listener on the dialog closes on Escape and wraps Tab from Cancel to Confirm and Shift+Tab from Confirm to Cancel, cancelling the default each time. One close function hides the dialog, writes the result, and focuses the opener, so every exit behaves the same.',
  },
  'dom-combobox': {
    plan: [
      'List the state the widget needs: the typed text, the matches, the active option, and whether the list is open.',
      'Name the attributes that change when each piece of state changes.',
    ],
    explanation: [
      'Explain how aria-activedescendant lets the active option change while focus stays in the input.',
      'Explain how the arrow keys wrap and what clears the active option.',
      'State what the checks cannot establish about announcements and pointer use.',
    ],
    example:
      'I keep the matching option indexes, the active position, and whether the list is open, and one render function applies them to the options, hidden, aria-expanded, and aria-activedescendant. Typing recomputes matches and clears the active position; the arrow keys move it with wrapping; Enter fills the input and closes; Escape closes and keeps the text.',
  },
}

export const domDepth: Record<string, RepDepth> = {
  'dom-form-fields': {
    reasoning:
      'The structure is the contract: each input needs a visible label linked by id, and the form must let your own handler decide what happens on submit rather than the browser.',
    trace:
      'With fields name and email, the loop creates a label for name tied to input name, then the same for email, and the Submit button is appended last. Typing Ada then submitting leaves the value intact because the submit handler only prevents the default action.',
    alternative:
      'Wrapping each input inside its label also links them without ids, and aria-label can name a control with no visible text. The visible linked label is simplest and keeps click-to-focus.',
    counterexample:
      'Placeholder text with no label looks fine but gives the input no accessible name once typing starts, and leaving browser validation on can block your handler for an email field before it runs.',
    transfer:
      'Add a required hint such as "(required)" to each label without breaking the linked name. Decide whether it belongs inside the label. This changed contract is self-reviewed, not checked.',
  },
  'dom-form-errors': {
    reasoning:
      'An error is only useful if the field points at it. One helper sets or clears the paragraph, aria-invalid, and aria-describedby together so a fixed field cannot keep stale attributes.',
    trace:
      'Submit with name "Ada" and an empty email: name passes, so its error and ARIA attributes are cleared; email fails, so its paragraph is created with id email-error, aria-invalid becomes true, and aria-describedby names that paragraph. A second submit reuses the paragraph.',
    alternative:
      'A summary list of errors at the top suits long forms, and browser constraint validation gives built-in bubbles with less control over wording and linking. Choose by contract, not by habit.',
    counterexample:
      'Setting only the visible text leaves a screen reader user unaware of the problem, while leaving aria-invalid set after a fix reports a valid field as broken. Appending a new paragraph on every submit duplicates messages.',
    transfer:
      'Add a password-confirmation field whose error says the values differ. Decide which attributes it needs and when it is validated. This changed contract is self-reviewed, not checked.',
  },
  'dom-form-submit': {
    reasoning:
      'After validating every field, focus goes to the first problem once and success is confirmed once. The two outcomes are exclusive, so the status is removed whenever a problem returns.',
    trace:
      'Submit with name "Ada" and an empty email: both fields are validated, the email error appears, the status is removed, and focus moves to email because it is the first invalid input. After typing an email and submitting again, no field is invalid, so the status reads "Form accepted." and focus stays put.',
    alternative:
      'Moving focus to an error summary heading is another pattern for long forms, and role="alert" can announce errors immediately. The contract here asks for focus on the first invalid field and a polite status.',
    counterexample:
      'Focusing inside the loop lands on the last invalid field, and leaving the old status visible after a failed submit tells people the form was accepted while it is not.',
    transfer:
      'Disable the Submit button while a simulated request runs and restore it afterwards. State where focus should be and what the status says. This changed contract is self-reviewed, not checked.',
  },
  'dom-accessible-form': {
    reasoning:
      'An error is only useful if the field points at it and focus goes where the person must act. The same helper handles both states so a fixed field cannot keep stale attributes.',
    trace:
      'Submit with name "Ada" and an empty email: name passes, so its error and ARIA attributes are cleared; email fails, so its paragraph is shown, aria-invalid becomes true, aria-describedby names that paragraph, and focus moves to email because it is the first invalid input.',
    alternative:
      'Browser constraint validation (required, pattern) gives built-in bubbles but little control over wording and linking; a single summary list at the top is another pattern that suits long forms. Choose by contract, not by habit.',
    counterexample:
      'Focusing the last invalid field, or leaving aria-invalid set after a fix, still renders the right visible text but sends keyboard and screen reader users to the wrong place or reports a valid field as broken.',
    transfer:
      'Add a password-confirmation field whose error says the values differ. Decide where it sits in the focus order and which attributes it needs. This changed contract is self-reviewed, not checked.',
  },
  'dom-disclosure': {
    reasoning:
      'State, attribute, and visibility must change together, and a native button supplies focusability and keyboard activation without custom key handling.',
    trace:
      'Closed: aria-expanded is "false" and the panel is hidden. One click flips the stored boolean to true and setOpen writes "true" and un-hides the panel. A second click reverses both. The button element is never replaced, so focus stays on it.',
    alternative:
      'The native details and summary elements provide a disclosure with less code but less control over attributes and styling. A div with role="button" needs tabindex and Enter and Space handling that a button gives for free.',
    counterexample:
      'Hiding the panel with only a CSS class while leaving aria-expanded "false" tells a screen reader the section is closed while it is visible. A clickable div is skipped by Tab.',
    transfer:
      'Group three disclosures into an accordion where opening one closes the others. Decide which state is shared and how aria-expanded stays consistent. This changed contract is self-reviewed, not checked.',
  },
  'dom-tabs': {
    reasoning:
      'Selection is a single index. Every tab and panel attribute is derived from comparing each position to it, and roving tabindex keeps one tab stop for the whole list.',
    trace:
      'With Billing (index 2 of 3) focused, ArrowRight computes (2 + 1) % 3 = 0, so select(0) makes Profile aria-selected "true" and tabindex 0, sets the others to "false" and -1, shows the Profile panel, and focuses the Profile tab.',
    alternative:
      'Manual activation moves focus with the arrows and selects only on Enter or Space, which suits tabs with expensive panels. Automatic activation, as here, is simpler when panels are cheap.',
    counterexample:
      'Leaving every tab at tabindex 0 makes Tab step through each tab instead of entering the list once. Computing the next index without wrap-around makes ArrowRight on the last tab do nothing or crash.',
    transfer:
      'Switch to manual activation: arrows move focus only and Enter selects. State which attributes now change on arrow presses. This changed contract is self-reviewed, not checked.',
  },
  'dom-live-search': {
    reasoning:
      'The list, count, and empty message are all derived from one filtered array. The live region has to exist before it changes and keep its identity so assistive technology notices the update.',
    trace:
      'Typing "zzz" filters the four items to none: the list is cleared, the status text becomes "0 results", and the empty paragraph is added. Clearing the field filters back to four items, resets the status to "4 results", and removes the empty paragraph.',
    alternative:
      'Debouncing the announcement avoids a spoken update per keystroke for large lists; role="status" implies a polite live region and is a common alternative to adding aria-live explicitly. The contract here asks for the explicit attribute.',
    counterexample:
      'Creating the status paragraph on the first keystroke, or replacing it each time, may produce no announcement because nothing changed inside an existing live region. Rebuilding the input on each event drops focus.',
    transfer:
      'Add a "clear" button that restores the list and returns focus to the input. Decide what the status should say afterward. This changed contract is self-reviewed, not checked.',
  },
  'dom-accordion': {
    reasoning:
      'One current id decides every header and panel. Deriving all sections from it in one pass means opening a section closes the others without any extra bookkeeping.',
    trace:
      'Shipping is open. Clicking Returns stores "returns", so the pass sets Shipping to aria-expanded "false" and hidden, and Returns to "true" and visible. Clicking Returns again stores null, so every section is collapsed and hidden.',
    alternative:
      'Allowing several sections open needs a set of open ids instead of one value. Native details elements with a shared name attribute give single-open behavior with less code but less control over the attributes.',
    counterexample:
      'Toggling only the clicked section leaves the previously open one expanded, so two answers show at once and the one-open rule fails. Setting hidden without aria-expanded tells a screen reader the visible section is collapsed.',
    transfer:
      'Let the accordion allow any number of open sections but add an expand-all button. Decide what the state becomes and when the button should say collapse all. This changed contract is self-reviewed, not checked.',
  },
  'dom-reorder-list': {
    reasoning:
      'The order array is the single source of truth: after each move, the list order, every button’s disabled state, and the status text are all recomputed from it, so they cannot disagree. Moving existing row elements keeps each button the same element, so a test or an assistive technology tracking it is not confused, and focusing the clicked button again, or its sibling when it has just become disabled, keeps the keyboard user next to the item they moved.',
    trace:
      'Eggs is second. Clicking Move Eggs up splices it to position 0 and re-appends the rows. Move Eggs up is now disabled, so focus moves to Move Eggs down, and the status reads “Eggs moved to position 1 of 4.” Milk’s Move up becomes enabled because Milk is now second.',
    alternative:
      'Rebuilding the whole list after each move is simpler, but every button becomes a new element and focus is lost unless you track which one to restore. Drag and drop with keyboard support, through grab and drop keys, is more powerful but much harder to make accessible; buttons are the dependable baseline.',
    counterexample:
      'Leaving focus on a button that has just become disabled drops focus to the page body in most browsers, so the next Tab starts from the top. Naming every button only “Move up” gives a screen-reader user a list of identical controls. Updating the order without the status leaves screen-reader users guessing whether anything moved.',
    transfer:
      'Add Move to top and Move to bottom buttons. Decide which buttons become disabled at each end and where focus goes after each one. This changed contract is self-reviewed, not checked.',
  },
  'dom-modal-dialog': {
    reasoning:
      'A real browser already moves focus between the two buttons with Tab, so code only has to handle the edges: Tab on the last button and Shift+Tab on the first would otherwise leave the dialog, so both are cancelled and redirected. A single close function guarantees that Escape, Cancel, and Confirm all hide the dialog, record a result, and return focus to the opener the same way.',
    trace:
      'Opening focuses Delete. Shift+Tab on Delete is an edge, so the default is cancelled and Cancel is focused. Escape then calls close with Cancelled., which hides the dialog and focuses Delete draft, where the user started.',
    alternative:
      'The native dialog element with showModal makes the page behind inert and handles Escape for you, which is the better choice in production; this rep builds the behavior by hand so you can see each piece. The inert attribute on the rest of the page blocks focus and clicks without any key handling.',
    counterexample:
      'Listening for keys on the document instead of the dialog can trap Tab even after the dialog closes. Forgetting to return focus leaves keyboard users on a hidden button, so the next Tab starts from the top of the page. Hiding the dialog with CSS but leaving it in the tab order lets Tab reach invisible buttons.',
    transfer:
      'Add a text field above the buttons that must be filled before Delete is enabled. Decide which element is first and last for the wrap, and where focus starts when the dialog opens. This changed contract is self-reviewed, not checked.',
  },
  'dom-combobox': {
    reasoning:
      'Focus never leaves the input, so assistive technology learns which option is active from aria-activedescendant, and aria-selected marks it in the list. Keeping the matches, the active position, and the open flag as state, and deriving every attribute from them in one render function, keeps the list, aria-expanded, and the active descendant consistent after typing, arrow keys, Enter, and Escape.',
    trace:
      'Typing ap matches Apple and Apricot, so the list opens with no active option. ArrowUp from none goes to the last match, Apricot, and the input points at option-2. Enter copies Apricot into the input, closes the list, and removes aria-activedescendant.',
    alternative:
      'Moving real focus onto each option is simpler to style but makes typing awkward, because focus has left the input. Native datalist gives suggestions with no code, but its keyboard and screen-reader behavior varies across browsers and cannot be styled or controlled like this.',
    counterexample:
      'Matching with includes shows Pineapple for ap. Forgetting to clear the active option when typing leaves aria-activedescendant pointing at an option that no longer exists. Clearing the input on Escape throws away what the user typed.',
    transfer:
      'Let a mouse click on an option pick it, and keep focus in the input afterwards. Decide which event to use so the input does not lose focus first. This changed contract is self-reviewed, not checked.',
  },
}
