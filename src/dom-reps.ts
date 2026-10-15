import { see } from './rep-helpers.ts'
import type { Rep } from './rep-types.ts'

// Observation and step helpers for the sandboxed DOM checks. Targets are data-testid values.
const type = (target: string, value: string) => ({ do: 'type', target, value })
const click = (target: string) => ({ do: 'click', target })
const focus = (target: string) => ({ do: 'focus', target })
const mark = (target: string) => ({ do: 'mark', target })
const submit = (target: string) => ({ do: 'submit', target })
const key = (name: string) => ({ do: 'key', key: name })
const shiftKey = (name: string) => ({ do: 'key', key: name, shift: true })
const dom = (props: unknown, steps: unknown[], expected: unknown[]) => ({ input: [{ props, steps }], expected })

const formProps = {
  fields: [
    { id: 'name', label: 'Full name', type: 'text', message: 'Enter your full name.' },
    { id: 'email', label: 'Email address', type: 'email', message: 'Enter your email address.' },
  ],
}
const markupForm = { fields: [{ id: 'name', label: 'Full name', type: 'text', message: '<b>Required</b>' }] }
const markupLabel = { fields: [{ id: 'name', label: '<b>Name</b>', type: 'text', message: 'Enter a name.' }] }
const disclosureProps = { label: 'Shipping details', content: 'Orders ship within two business days.', open: false }
const tabsProps = {
  label: 'Account settings',
  tabs: [
    { id: 'profile', title: 'Profile', content: 'Edit your name.' },
    { id: 'security', title: 'Security', content: 'Change your password.' },
    { id: 'billing', title: 'Billing', content: 'Update your card.' },
  ],
}
const searchProps = { items: ['Apple', 'Banana', 'Pineapple', 'Apricot'] }
const allFruit = ['Apple', 'Banana', 'Pineapple', 'Apricot']
const selected = (profile: string, security: string, billing: string) => [
  see('tab-profile', 'attr:aria-selected', profile),
  see('tab-security', 'attr:aria-selected', security),
  see('tab-billing', 'attr:aria-selected', billing),
]
const stops = (profile: number, security: number, billing: number) => [
  see('tab-profile', 'prop:tabIndex', profile),
  see('tab-security', 'prop:tabIndex', security),
  see('tab-billing', 'prop:tabIndex', billing),
]
const shown = (profile: boolean, security: boolean, billing: boolean) => [
  see('panel-profile', 'prop:hidden', !profile),
  see('panel-security', 'prop:hidden', !security),
  see('panel-billing', 'prop:hidden', !billing),
]
const accordionProps = {
  open: 'shipping',
  sections: [
    { id: 'shipping', title: 'Shipping', content: 'Orders ship within two days.' },
    { id: 'returns', title: 'Returns', content: 'Return items within thirty days.' },
    { id: 'warranty', title: 'Warranty', content: 'Repairs are covered for a year.' },
  ],
}
const expanded = (shipping: string, returns: string, warranty: string) => [
  see('header-shipping', 'attr:aria-expanded', shipping),
  see('header-returns', 'attr:aria-expanded', returns),
  see('header-warranty', 'attr:aria-expanded', warranty),
]
const visible = (shipping: boolean, returns: boolean, warranty: boolean) => [
  see('panel-shipping', 'prop:hidden', !shipping),
  see('panel-returns', 'prop:hidden', !returns),
  see('panel-warranty', 'prop:hidden', !warranty),
]
const reorderProps = {
  label: 'Packing order',
  items: [
    { id: 'milk', label: 'Milk' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'bread', label: 'Bread' },
    { id: 'tea', label: 'Tea' },
  ],
}
const dialogProps = {
  openLabel: 'Delete draft',
  title: 'Delete this draft?',
  body: 'The draft will be removed from this device.',
  confirmLabel: 'Delete',
}
const comboProps = { label: 'Fruit', options: ['Apple', 'Banana', 'Apricot', 'Grape', 'Pineapple'] }
const comboClosed = [see('input', 'attr:aria-expanded', 'false'), see('listbox', 'prop:hidden', true)]

const limits =
  'DOM checks run in a sandboxed frame. They establish the authored behavior and attribute contract, not screen-reader output, visual design, or real keyboard use in other browsers. Review those yourself.'

export const domReps: Rep[] = [
  {
    id: 'dom-form-fields',
    title: 'Build the labelled form fields',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'The accessible sign-up form starts with its structure. A placeholder is not a label: a visible label element tied to its input gives every field a name that clicks, focuses, and is announced.',
    prompt:
      'Implement `mountFormFields(root, props)`. Build one form from props.fields; each field has id, label, type, and message (messages are used in the next checkpoint). Set `form.noValidate` = true so browser validation cannot block submission, and call preventDefault in a submit handler. In field order, give every input a visible label element whose for attribute matches the input id, then add a Submit button. Show no errors yet. Use data-testid values: form, field-<id> on each input, and submit on the button.',
    brief: {
      summary:
        'Implement `mountFormFields(root, props)`. Build one form from props.fields; each field has id, label, type, and message (messages are used in the next checkpoint).',
      rules: [
        'Create the form with `form.noValidate` = true so browser validation cannot block submission, and call preventDefault in a submit handler.',
        'In field order, give every input a visible label element whose for attribute matches the input id.',
        'Add a Submit button after the last field.',
      ],
      edgeCases: [
        'Show no errors and no status yet.',
        'Render labels as text, not HTML.',
        'Use data-testid values: form, field-<id> on each input, and submit on the button.',
      ],
    },
    example: { input: 'fields name (text) and email (email)', output: 'Two labelled inputs in order, then a Submit button; no error text' },
    note:
      'The checks dispatch a submit event on the form; they cannot observe whether you called preventDefault, so review that yourself, and press the real Submit button and Enter in a field to try it. ' +
      limits,
    acceptanceCriteria: [
      'Clicking a label focuses its input.',
      'Pressing Tab reaches every field and the button in reading order with a visible focus indicator.',
      'Submitting the form does not navigate away or reload the page.',
    ],
    domPreview: {
      title: 'Your form fields',
      description: 'Click each label, Tab through the form, and press Submit.',
      props: formProps,
      review: [
        'Click a label and confirm its input receives focus.',
        'Tab through the form and confirm the focus indicator is always visible.',
        'Press Submit and confirm the page does not reload.',
      ],
    },
    vocabulary: [
      { term: 'Accessible name', meaning: 'the text assistive technology uses to identify a control, such as its label' },
      { term: 'noValidate', meaning: "a form property that turns off the browser's built-in validation so your own handler decides" },
      { term: 'preventDefault', meaning: "an event method that stops the browser's default action, here navigating on submit" },
    ],
    planPrompt:
      'List the elements the form needs for one field and in what order they appear. Which two properties must be set so your own submit handler is in charge?',
    starter:
      'type FormProps = { fields: { id: string; label: string; type: string; message: string }[] }\n\nfunction mountFormFields(root: HTMLElement, props: FormProps): void {\n  // Build the form with document.createElement and attach it to root.\n  // Use data-testid values: form, field-<id>, submit.\n  root.replaceChildren()\n}\n',
    functionName: 'mountFormFields',
    preserveInput: true,
    hints: [
      'Create the form first and set its validation property before adding anything to it.',
      'For each field, create a label and an input, link them with the same id value, then add both to the form.',
      'Add the Submit button after the loop so it comes last in reading order.',
    ],
    checks: [
      {
        name: 'Builds a form with browser validation off',
        ...dom(formProps, [], [see('form', 'tag', 'form'), see('form', 'prop:noValidate', true)]),
      },
      {
        name: 'Each input has a linked visible label',
        ...dom(formProps, [], [see('field-name', 'label', 'Full name'), see('field-email', 'label', 'Email address')]),
      },
      {
        name: 'Inputs use the requested types',
        ...dom(formProps, [], [see('field-name', 'prop:type', 'text'), see('field-email', 'prop:type', 'email')]),
      },
      {
        name: 'Has a Submit button of type submit',
        ...dom(formProps, [], [see('submit', 'tag', 'button'), see('submit', 'prop:type', 'submit'), see('submit', 'text', 'Submit')]),
      },
      {
        name: 'Shows no errors or status before submission',
        ...dom(
          formProps,
          [],
          [
            see('error-name', 'exists', false),
            see('error-email', 'exists', false),
            see('field-name', 'attr:aria-invalid', null),
            see('field-name', 'attr:aria-describedby', null),
            see('status', 'exists', false),
          ],
        ),
      },
      {
        name: 'Renders one input per field and keeps typed text on submit',
        ...dom(
          formProps,
          [type('field-name', 'Ada'), submit('form')],
          [
            see('field-name', 'count', 1),
            see('field-email', 'count', 1),
            see('field-name', 'prop:value', 'Ada'),
            see('error-name', 'exists', false),
          ],
        ),
      },
      {
        name: 'Label text stays text',
        ...dom(markupLabel, [], [see('field-name', 'label', '<b>Name</b>'), see('field-name', 'prop:type', 'text')]),
      },
    ],
  },
  {
    id: 'dom-form-errors',
    title: 'Link an error to each empty field',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'The labelled form now needs to report problems. A visible message only helps screen reader users if the field points at it, and a fixed field must not keep stale error state. Your earlier draft is not copied; the starter carries forward a working form to extend.',
    prompt:
      'Implement `mountFormErrors(root, props)`; the starter already builds the labelled form. On submit, treat a trimmed-empty value as invalid. For each invalid field show its message in a paragraph with id "<id>-error", set `aria-invalid`="true" on the input, and point `aria-describedby` at that paragraph. Valid fields get none of these, and fixing a field clears them. Do not move focus or report success yet.',
    brief: {
      summary: 'Implement `mountFormErrors(root, props)`; the starter already builds the labelled form.',
      rules: [
        'On submit, treat a trimmed-empty value as invalid.',
        'For each invalid field show its message in a paragraph with id "<id>-error", set `aria-invalid`="true" on the input, and point `aria-describedby` at that paragraph.',
        'Valid fields get no error paragraph, no `aria-invalid`, and no `aria-describedby`; fixing a field clears all three.',
      ],
      edgeCases: [
        'Resubmitting must not duplicate an error paragraph.',
        'Never discard or rewrite what the person typed.',
        'Use data-testid="error-<id>" on each error paragraph. Do not move focus or report success yet.',
      ],
    },
    example: {
      input: "submit with name '  ' and email 'ada@example.com'",
      output: 'Error under Full name with aria-invalid and aria-describedby; Email address untouched',
    },
    note:
      'Render messages as text, not HTML. The checks dispatch a submit event on the form; they do not press the real Submit button or Enter inside a field, so try those yourself. ' +
      limits,
    acceptanceCriteria: [
      "Resubmitting after fixing a field removes that field's error and its ARIA attributes.",
      'Pressing Enter inside a field shows the same errors as clicking Submit.',
      'Test with a real screen reader before claiming it announces the error well.',
    ],
    domPreview: {
      title: 'Your form errors',
      description: 'Submit the empty form, fix one field, and submit again.',
      props: formProps,
      review: [
        'Submit with both fields empty and read each error under its field.',
        'Fix one field, submit again, and confirm only the other error remains.',
        'Listen with a screen reader to what is announced for a field with an error. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'aria-describedby', meaning: 'an attribute naming the element whose text describes this control' },
      { term: 'aria-invalid', meaning: "an attribute telling assistive technology a field's value is not acceptable" },
    ],
    planPrompt:
      'List the attributes and elements that must change for one invalid field, and the ones that must be removed when it becomes valid. Where will one helper apply or clear them?',
    starter:
      "type FormProps = { fields: { id: string; label: string; type: string; message: string }[] }\n\nfunction mountFormErrors(root: HTMLElement, props: FormProps): void {\n  root.replaceChildren()\n  const form = document.createElement('form')\n  form.noValidate = true\n  form.setAttribute('data-testid', 'form')\n  for (const field of props.fields) {\n    const wrap = document.createElement('div')\n    const label = document.createElement('label')\n    label.htmlFor = field.id\n    label.textContent = field.label\n    const input = document.createElement('input')\n    input.id = field.id\n    input.type = field.type\n    input.setAttribute('data-testid', 'field-' + field.id)\n    wrap.append(label, input)\n    form.append(wrap)\n  }\n  const button = document.createElement('button')\n  button.type = 'submit'\n  button.textContent = 'Submit'\n  button.setAttribute('data-testid', 'submit')\n  form.append(button)\n  form.addEventListener('submit', event => {\n    event.preventDefault()\n    // Validate each field here and show or clear its error.\n  })\n  root.append(form)\n}\n",
    functionName: 'mountFormErrors',
    preserveInput: true,
    hints: [
      'Keep the form you built once and update it on submit; rebuilding it would throw away typed values.',
      'Write one helper that applies or clears the error state for a single field, so the invalid and valid paths cannot drift apart.',
      "Remember each field's error paragraph so a second submit updates it instead of adding another.",
    ],
    checks: [
      {
        name: 'Starts with no errors',
        ...dom(
          formProps,
          [],
          [see('error-name', 'exists', false), see('error-email', 'exists', false), see('field-name', 'attr:aria-invalid', null)],
        ),
      },
      {
        name: 'Empty submit links every error',
        ...dom(
          formProps,
          [submit('form')],
          [
            see('error-name', 'text', 'Enter your full name.'),
            see('error-email', 'text', 'Enter your email address.'),
            see('field-name', 'attr:aria-invalid', 'true'),
            see('field-name', 'describedBy', ['Enter your full name.']),
            see('field-email', 'describedBy', ['Enter your email address.']),
          ],
        ),
      },
      {
        name: 'Error paragraphs use the id pattern',
        ...dom(
          formProps,
          [submit('form')],
          [
            see('error-name', 'attr:id', 'name-error'),
            see('error-email', 'attr:id', 'email-error'),
            see('field-name', 'attr:aria-describedby', 'name-error'),
          ],
        ),
      },
      {
        name: 'Only the invalid field gets an error',
        ...dom(
          formProps,
          [type('field-name', 'Ada'), submit('form')],
          [
            see('error-name', 'exists', false),
            see('field-name', 'attr:aria-invalid', null),
            see('field-name', 'attr:aria-describedby', null),
            see('error-email', 'exists', true),
            see('field-name', 'prop:value', 'Ada'),
          ],
        ),
      },
      {
        name: 'Whitespace-only text is invalid and is not rewritten',
        ...dom(
          formProps,
          [type('field-name', '   '), type('field-email', 'ada@example.com'), submit('form')],
          [
            see('error-name', 'text', 'Enter your full name.'),
            see('field-name', 'prop:value', '   '),
            see('field-email', 'attr:aria-invalid', null),
          ],
        ),
      },
      {
        name: 'Fixing a field clears its error and attributes',
        ...dom(
          formProps,
          [submit('form'), type('field-name', 'Ada'), type('field-email', 'ada@example.com'), submit('form')],
          [
            see('error-name', 'exists', false),
            see('error-email', 'exists', false),
            see('field-name', 'attr:aria-invalid', null),
            see('field-email', 'attr:aria-invalid', null),
            see('field-email', 'attr:aria-describedby', null),
          ],
        ),
      },
      {
        name: 'Submitting twice does not duplicate errors',
        ...dom(
          formProps,
          [submit('form'), submit('form')],
          [see('error-name', 'count', 1), see('error-email', 'count', 1), see('field-name', 'describedBy', ['Enter your full name.'])],
        ),
      },
      {
        name: 'Error messages containing markup remain text',
        ...dom(
          markupForm,
          [submit('form')],
          [
            see('error-name', 'text', '<b>Required</b>'),
            see('error-name', 'prop:childElementCount', 0),
            see('field-name', 'describedBy', ['<b>Required</b>']),
          ],
        ),
      },
    ],
  },
  {
    id: 'dom-form-submit',
    title: 'Focus the first problem and confirm success',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'Linked errors are not enough on their own: keyboard and screen reader users also need focus to move to the first problem, and a clear confirmation once everything is valid. Your earlier draft is not copied; the starter carries forward a working form with linked errors to extend.',
    prompt:
      'Implement `mountFormSubmit(root, props)`; the starter already links errors. After validating every field, move focus to the first invalid input in field order. When every field is valid, show "Form accepted." in a status paragraph, and remove that status whenever a later submit finds a problem. Use data-testid="status" on the status paragraph.',
    brief: {
      summary: 'Implement `mountFormSubmit(root, props)`; the starter already links errors.',
      rules: [
        'After validating every field, move focus to the first invalid input in field order.',
        'When every field is valid, show "Form accepted." in a status paragraph.',
        'Remove the status whenever a later submit finds a problem.',
      ],
      edgeCases: [
        'Submitting twice must not duplicate the status.',
        'Never discard what the person typed.',
        'Use data-testid="status" on the status paragraph.',
      ],
    },
    example: { input: "submit with name 'Ada' and email ''", output: 'Error under Email address and focus on Email address; no status' },
    note:
      'The checks dispatch a submit event on the form; they do not press the real Submit button, so try it and watch where focus lands. ' +
      limits,
    acceptanceCriteria: [
      'After a failed submit, focus is visibly on the first invalid field.',
      'Fixing the first field and submitting again moves focus to the next invalid one.',
      'Use a real screen reader to confirm the confirmation is announced; checks cannot.',
    ],
    domPreview: {
      title: 'Your complete form',
      description: 'Submit empty, fix one field at a time, and finish with a valid form.',
      props: formProps,
      review: [
        'Submit with both fields empty and check that focus lands on the first field.',
        'Fill every field and confirm the confirmation appears.',
        'Listen to what a screen reader announces for the confirmation. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Focus', meaning: 'the element that receives keyboard input right now' },
      { term: 'Status message', meaning: 'text that confirms a result to every user, including those using assistive technology' },
    ],
    planPrompt:
      'In what order will you validate fields so you can remember the first invalid one? When exactly do you move focus, and when do you show or remove the confirmation?',
    starter:
      "type FormProps = { fields: { id: string; label: string; type: string; message: string }[] }\n\nfunction mountFormSubmit(root: HTMLElement, props: FormProps): void {\n  root.replaceChildren()\n  const form = document.createElement('form')\n  form.noValidate = true\n  form.setAttribute('data-testid', 'form')\n  const rows = props.fields.map(field => {\n    const wrap = document.createElement('div')\n    const label = document.createElement('label')\n    label.htmlFor = field.id\n    label.textContent = field.label\n    const input = document.createElement('input')\n    input.id = field.id\n    input.type = field.type\n    input.setAttribute('data-testid', 'field-' + field.id)\n    wrap.append(label, input)\n    form.append(wrap)\n    return { field, wrap, input, error: null as HTMLElement | null }\n  })\n  const button = document.createElement('button')\n  button.type = 'submit'\n  button.textContent = 'Submit'\n  button.setAttribute('data-testid', 'submit')\n  form.append(button)\n  function setError(row: typeof rows[number], invalid: boolean) {\n    if (!invalid) {\n      row.error?.remove()\n      row.error = null\n      row.input.removeAttribute('aria-invalid')\n      row.input.removeAttribute('aria-describedby')\n      return\n    }\n    if (!row.error) {\n      row.error = document.createElement('p')\n      row.error.id = row.field.id + '-error'\n      row.error.setAttribute('data-testid', 'error-' + row.field.id)\n      row.wrap.append(row.error)\n    }\n    row.error.textContent = row.field.message\n    row.input.setAttribute('aria-invalid', 'true')\n    row.input.setAttribute('aria-describedby', row.error.id)\n  }\n  form.addEventListener('submit', event => {\n    event.preventDefault()\n    for (const row of rows) setError(row, row.input.value.trim() === '')\n    // Move focus to the first invalid input, or show the confirmation.\n  })\n  root.append(form)\n}\n",
    functionName: 'mountFormSubmit',
    preserveInput: true,
    hints: [
      'Remember the first invalid input while you validate, but wait until every field has been updated before you move focus.',
      'Create the status paragraph once, give it its test id, and add or remove it rather than rebuilding it.',
      'The two outcomes are exclusive: a problem means focus and no status; no problem means a status and no focus move.',
    ],
    checks: [
      {
        name: 'Starts with no status and no focus move',
        ...dom(formProps, [], [see('status', 'exists', false), see('field-name', 'focused', false)]),
      },
      {
        name: 'Empty submit focuses the first field and shows no status',
        ...dom(
          formProps,
          [submit('form')],
          [
            see('field-name', 'focused', true),
            see('field-email', 'focused', false),
            see('status', 'exists', false),
            see('error-name', 'exists', true),
          ],
        ),
      },
      {
        name: 'Focus lands on the first invalid field even when it is later',
        ...dom(
          formProps,
          [type('field-name', 'Ada'), submit('form')],
          [see('field-email', 'focused', true), see('field-name', 'focused', false), see('error-name', 'exists', false)],
        ),
      },
      {
        name: 'Focus moves to the field that is still invalid',
        ...dom(
          formProps,
          [submit('form'), type('field-name', 'Ada'), submit('form')],
          [see('field-email', 'focused', true), see('field-name', 'focused', false), see('error-email', 'exists', true)],
        ),
      },
      {
        name: 'All valid fields report success',
        ...dom(
          formProps,
          [type('field-name', 'Ada'), type('field-email', 'ada@example.com'), submit('form')],
          [see('status', 'text', 'Form accepted.'), see('error-name', 'exists', false), see('error-email', 'exists', false)],
        ),
      },
      {
        name: 'Fixing every field clears errors and reports success',
        ...dom(
          formProps,
          [submit('form'), type('field-name', 'Ada'), type('field-email', 'ada@example.com'), submit('form')],
          [see('error-name', 'exists', false), see('field-email', 'attr:aria-invalid', null), see('status', 'text', 'Form accepted.')],
        ),
      },
      {
        name: 'Submitting twice does not duplicate the status',
        ...dom(
          formProps,
          [type('field-name', 'Ada'), type('field-email', 'ada@example.com'), submit('form'), submit('form')],
          [see('status', 'count', 1), see('status', 'text', 'Form accepted.')],
        ),
      },
      {
        name: 'A later invalid submit removes the status and keeps typed text',
        ...dom(
          formProps,
          [type('field-name', 'Ada'), type('field-email', 'ada@example.com'), submit('form'), type('field-name', '  '), submit('form')],
          [
            see('status', 'exists', false),
            see('field-name', 'focused', true),
            see('field-name', 'prop:value', '  '),
            see('field-email', 'prop:value', 'ada@example.com'),
          ],
        ),
      },
    ],
  },
  {
    id: 'dom-accessible-form',
    title: 'Build an accessible form with linked errors',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A sign-up form shows an error under each empty field. Sighted users see the red text; people using a screen reader only hear it if the error is programmatically linked to the field and focus moves to the problem.',
    prompt:
      'Implement `mountAccessibleForm(root, props)`. Build one form from props.fields; each field has id, label, type, and message. Give every input a visible label element whose for attribute matches the input id, and a Submit button. Set `form.noValidate` = true when creating the form so browser validation cannot block submission. In the submit handler, call preventDefault to stop navigation. On submit, treat a trimmed-empty value as invalid. For each invalid field show its message in a paragraph with id "<id>-error", set `aria-invalid`="true" on the input, and point the input\'s `aria-describedby` at that paragraph. Move focus to the first invalid input in field order. Valid fields get no error paragraph, no `aria-invalid`, and no `aria-describedby`. When every field is valid, show "Form accepted." in a status paragraph. Never discard what the person typed. Use data-testid values: form, field-<id> on each input, error-<id> on each error paragraph, submit on the button, and status on the success paragraph.',
    brief: {
      summary:
        'Implement `mountAccessibleForm(root, props)`. Build one form from props.fields; each field has id, label, type, and message.',
      rules: [
        'Create the form with `form.noValidate` = true so browser validation cannot block submission, and call preventDefault in the submit handler to stop navigation.',
        'Give every input a visible label element whose for attribute matches the input id, and add a Submit button.',
        'On submit, treat a trimmed-empty value as invalid.',
        'For each invalid field show its message in a paragraph with id "<id>-error", set `aria-invalid`="true" on the input, and point the input\'s `aria-describedby` at that paragraph.',
        'Move focus to the first invalid input in field order.',
        'When every field is valid, show "Form accepted." in a status paragraph.',
      ],
      edgeCases: [
        'Valid fields get no error paragraph, no `aria-invalid`, and no `aria-describedby`.',
        'Never discard what the person typed.',
        'Use data-testid values: form, field-<id> on each input, error-<id> on each error paragraph, submit on the button, and status on the success paragraph.',
      ],
    },
    example: {
      input: "submit with name '  ' and email 'ada@example.com'",
      output: 'Error under Full name, aria-invalid on it, focus on Full name; no error on Email address',
    },
    note:
      'Use data-testid values: form, field-<id> on each input, error-<id> on each error paragraph, submit on the button, and status on the success paragraph. Render messages as text, not HTML. The checks dispatch a submit event on the form; they do not press the real Submit button or Enter inside a field, so try those yourself. ' +
      limits,
    acceptanceCriteria: [
      'Pressing Tab reaches every field and the button in reading order with a visible focus indicator.',
      'Clicking a label focuses its input.',
      "Resubmitting after fixing a field removes that field's error and its ARIA attributes.",
      'Test with a real screen reader before claiming it announces the error well.',
    ],
    domPreview: {
      title: 'Your form implementation',
      description: 'Submit the empty form, fix one field, and submit again.',
      props: formProps,
      review: [
        'Submit with both fields empty and check that focus lands on the first field.',
        'Tab through the form and confirm the focus indicator is always visible.',
        'Turn on a screen reader and listen to what is announced for the focused field. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Accessible name', meaning: 'the text assistive technology uses to identify a control, such as its label' },
      { term: 'aria-describedby', meaning: 'an attribute naming the element whose text describes this control' },
      { term: 'aria-invalid', meaning: "an attribute telling assistive technology a field's value is not acceptable" },
    ],
    planPrompt:
      'List the attributes and elements that must change for one invalid field, and the ones that must be removed when it becomes valid. In what order will you validate fields so focus lands on the first invalid one, and where will you keep the typed values?',
    starter:
      'type FormProps = { fields: { id: string; label: string; type: string; message: string }[] }\n\nfunction mountAccessibleForm(root: HTMLElement, props: FormProps): void {\n  // Build the form with document.createElement and attach it to root.\n  // Use data-testid values: form, field-<id>, error-<id>, submit, status.\n  root.replaceChildren()\n}\n',
    functionName: 'mountAccessibleForm',
    preserveInput: true,
    hints: [
      'Build the form once and update it on submit; rebuilding it would throw away typed values and the element you want to focus.',
      'Write one helper that applies or clears the error state for a single field, so the invalid and valid paths cannot drift apart.',
      'Collect the invalid fields in order first, update every field, then focus only the first invalid input at the end.',
    ],
    checks: [
      {
        name: 'Starts with labelled inputs and no errors',
        ...dom(
          formProps,
          [],
          [
            see('form', 'prop:noValidate', true),
            see('field-name', 'label', 'Full name'),
            see('field-email', 'label', 'Email address'),
            see('field-email', 'prop:type', 'email'),
            see('error-name', 'exists', false),
            see('field-name', 'attr:aria-invalid', null),
            see('status', 'exists', false),
          ],
        ),
      },
      {
        name: 'Empty submit links every error and focuses the first field',
        ...dom(
          formProps,
          [submit('form')],
          [
            see('error-name', 'text', 'Enter your full name.'),
            see('error-email', 'text', 'Enter your email address.'),
            see('field-name', 'attr:aria-invalid', 'true'),
            see('field-name', 'describedBy', ['Enter your full name.']),
            see('field-email', 'describedBy', ['Enter your email address.']),
            see('field-name', 'focused', true),
            see('field-email', 'focused', false),
            see('status', 'exists', false),
          ],
        ),
      },
      {
        name: 'Only the invalid field gets an error and focus',
        ...dom(
          formProps,
          [type('field-name', 'Ada'), submit('form')],
          [
            see('error-name', 'exists', false),
            see('field-name', 'attr:aria-invalid', null),
            see('field-name', 'attr:aria-describedby', null),
            see('error-email', 'exists', true),
            see('field-email', 'focused', true),
            see('field-name', 'prop:value', 'Ada'),
          ],
        ),
      },
      {
        name: 'Whitespace-only text is invalid and is not rewritten',
        ...dom(
          formProps,
          [type('field-name', '   '), type('field-email', 'ada@example.com'), submit('form')],
          [
            see('error-name', 'text', 'Enter your full name.'),
            see('field-name', 'focused', true),
            see('field-name', 'prop:value', '   '),
            see('field-email', 'attr:aria-invalid', null),
          ],
        ),
      },
      {
        name: 'Fixing every field clears the errors and reports success',
        ...dom(
          formProps,
          [submit('form'), type('field-name', 'Ada'), type('field-email', 'ada@example.com'), submit('form')],
          [
            see('error-name', 'exists', false),
            see('error-email', 'exists', false),
            see('field-name', 'attr:aria-invalid', null),
            see('field-email', 'attr:aria-invalid', null),
            see('field-email', 'attr:aria-describedby', null),
            see('status', 'text', 'Form accepted.'),
          ],
        ),
      },
      {
        name: 'Submitting twice does not duplicate errors',
        ...dom(
          formProps,
          [submit('form'), submit('form')],
          [
            see('error-name', 'count', 1),
            see('error-email', 'count', 1),
            see('field-name', 'describedBy', ['Enter your full name.']),
            see('field-name', 'focused', true),
          ],
        ),
      },
      {
        name: 'Focus moves to the first field that is still invalid',
        ...dom(
          formProps,
          [submit('form'), type('field-name', 'Ada'), submit('form')],
          [
            see('error-name', 'exists', false),
            see('error-email', 'exists', true),
            see('field-email', 'focused', true),
            see('field-name', 'focused', false),
          ],
        ),
      },
      {
        name: 'Error messages containing markup remain text',
        ...dom(
          markupForm,
          [submit('form')],
          [
            see('error-name', 'text', '<b>Required</b>'),
            see('error-name', 'prop:childElementCount', 0),
            see('field-name', 'describedBy', ['<b>Required</b>']),
          ],
        ),
      },
    ],
  },
  {
    id: 'dom-disclosure',
    title: 'Build a keyboard-operable disclosure',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A "Shipping details" section opens and closes on demand. Clickable divs look right but are skipped by Tab and ignore Enter and Space; a real button gets both for free, and attributes tell assistive technology which panel it controls and whether it is open.',
    prompt:
      'Implement `mountDisclosure(root, props)` with props.label, props.content, and props.open. Render a real button whose text is the label and a panel containing the content as text. The button must have type="button", `aria-expanded` set to the string "true" or "false", and `aria-controls` equal to the panel\'s id. When collapsed the panel is hidden (the hidden property); when expanded it is not. Start in the state given by props.open. Each click toggles the state and updates both `aria-expanded` and the panel. The button keeps its label and stays focused after toggling. Use data-testid="toggle" on the button and data-testid="panel" on the panel; give the panel an id and point `aria-controls` at it.',
    brief: {
      summary: 'Implement `mountDisclosure(root, props)` with props.label, props.content, and props.open.',
      rules: [
        'Render a real button whose text is the label and a panel containing the content as text.',
        'The button must have type="button", `aria-expanded` set to the string "true" or "false", and `aria-controls` equal to the panel\'s id.',
        'When collapsed the panel is hidden (the hidden property); when expanded it is not. Start in the state given by props.open.',
        'Each click toggles the state and updates both `aria-expanded` and the panel.',
      ],
      edgeCases: [
        'The button keeps its label and stays focused after toggling.',
        'Use data-testid="toggle" on the button and data-testid="panel" on the panel; give the panel an id and point `aria-controls` at it.',
      ],
    },
    example: { input: "label 'Shipping details', open false, one click", output: 'aria-expanded "true" and the panel visible' },
    note:
      'Use data-testid="toggle" on the button and data-testid="panel" on the panel; give the panel an id and point `aria-controls` at it. Render content with `textContent`. A native button turns Enter and Space into a click, so the checks click the button; they cannot press real keys on it. ' +
      limits,
    acceptanceCriteria: [
      'Tab reaches the button; Enter and Space toggle it in a real browser.',
      'Focus remains visibly on the button after toggling.',
      'Collapsed content is not read or reachable.',
      'Try a screen reader to confirm it announces expanded or collapsed.',
    ],
    domPreview: {
      title: 'Your disclosure implementation',
      description: 'Toggle the section with the mouse, then with Tab and Enter or Space.',
      props: disclosureProps,
      review: [
        'Reach the button with Tab and toggle it with both Enter and Space.',
        'Confirm the focus indicator stays on the button after each toggle.',
        'With a screen reader, listen for the expanded or collapsed announcement. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Disclosure', meaning: 'a control that shows or hides a section of content' },
      { term: 'aria-expanded', meaning: 'an attribute telling assistive technology whether the controlled content is shown' },
      { term: 'aria-controls', meaning: 'an attribute naming the element a control affects' },
    ],
    planPrompt:
      'Which element gives you keyboard operation without extra code, and why does that matter here? Name the three things that must change together when the state flips, and say where the single source of truth for open or closed will live.',
    starter:
      'type DisclosureProps = { label: string; content: string; open: boolean }\n\nfunction mountDisclosure(root: HTMLElement, props: DisclosureProps): void {\n  // Build a button and a panel. Use data-testid values: toggle and panel.\n  root.replaceChildren()\n}\n',
    functionName: 'mountDisclosure',
    preserveInput: true,
    hints: [
      'A real button already handles Tab, Enter, and Space, so you only need a click listener.',
      'Keep the open state in one variable and write one function that applies it to aria-expanded and the panel together.',
      'Update the existing elements instead of rebuilding them, or the button loses focus after the click.',
    ],
    checks: [
      {
        name: 'Renders a real button wired to its panel',
        ...dom(
          disclosureProps,
          [],
          [
            see('toggle', 'tag', 'button'),
            see('toggle', 'attr:type', 'button'),
            see('toggle', 'text', 'Shipping details'),
            see('toggle', 'prop:tabIndex', 0),
            see('toggle', 'controls', 'panel'),
            see('panel', 'text', 'Orders ship within two business days.'),
          ],
        ),
      },
      {
        name: 'Starts collapsed when open is false',
        ...dom(disclosureProps, [], [see('toggle', 'attr:aria-expanded', 'false'), see('panel', 'prop:hidden', true)]),
      },
      {
        name: 'Starts expanded when open is true',
        ...dom({ ...disclosureProps, open: true }, [], [see('toggle', 'attr:aria-expanded', 'true'), see('panel', 'prop:hidden', false)]),
      },
      {
        name: 'Clicking expands the panel and updates the attribute',
        ...dom(disclosureProps, [click('toggle')], [see('toggle', 'attr:aria-expanded', 'true'), see('panel', 'prop:hidden', false)]),
      },
      {
        name: 'Clicking again collapses it',
        ...dom(
          disclosureProps,
          [click('toggle'), click('toggle')],
          [see('toggle', 'attr:aria-expanded', 'false'), see('panel', 'prop:hidden', true)],
        ),
      },
      {
        name: 'The button keeps focus and its label after toggling',
        ...dom(
          disclosureProps,
          [focus('toggle'), click('toggle'), click('toggle'), click('toggle')],
          [see('toggle', 'focused', true), see('toggle', 'text', 'Shipping details'), see('toggle', 'count', 1), see('panel', 'count', 1)],
        ),
      },
      {
        name: 'Content containing markup remains text',
        ...dom(
          { ...disclosureProps, content: '<i>Fast</i>' },
          [click('toggle')],
          [see('panel', 'text', '<i>Fast</i>'), see('panel', 'prop:childElementCount', 0)],
        ),
      },
    ],
  },
  {
    id: 'dom-tabs',
    title: 'Build tabs with roving tabindex',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A settings page has Profile, Security, and Billing tabs. Keyboard users expect one Tab stop for the whole tab list and arrow keys to move between tabs, with the matching panel shown.',
    prompt:
      'Implement `mountTabs(root, props)` with props.label and props.tabs (id, title, content). Use data-testid values tablist, tab-<id>, and panel-<id> (the same strings as the ids).',
    example: {
      input: 'Focus Billing (the last tab) and press ArrowRight',
      output: 'Profile becomes selected and focused; its tabindex is 0 and the other tabs are -1',
    },
    note:
      'Use data-testid values tablist, tab-<id>, and panel-<id> (the same strings as the ids). Render titles and content with `textContent`. Selecting a tab with the arrow keys is called automatic activation. Checks drive keys by dispatching keydown events on the focused element; they cannot show how a screen reader announces the tabs. ' +
      limits,
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
    domPreview: {
      title: 'Your tabs implementation',
      description: 'Click a tab, then use Tab, the arrow keys, Home, and End.',
      props: tabsProps,
      review: [
        'Press Tab once to enter the tab list and again to leave it.',
        'Use ArrowLeft, ArrowRight, Home, and End and watch focus and selection stay together.',
        'With a screen reader, listen for the tab position and selected state. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Roving tabindex', meaning: 'keeping exactly one item in a group at tabindex 0 and moving that stop as focus moves' },
      { term: 'Tablist', meaning: 'a role for the container of a set of tabs' },
      { term: 'Automatic activation', meaning: 'selecting a tab as soon as it receives focus from the arrow keys' },
    ],
    planPrompt:
      'Write the single function that selects tab number n and list everything it updates. How will you compute the next index with wrap-around for ArrowRight and ArrowLeft, and what keeps exactly one tab at tabindex 0?',
    starter:
      'type TabsProps = { label: string; tabs: { id: string; title: string; content: string }[] }\n\nfunction mountTabs(root: HTMLElement, props: TabsProps): void {\n  // Build the tablist and panels. Use data-testid values: tablist, tab-<id>, panel-<id>.\n  root.replaceChildren()\n}\n',
    functionName: 'mountTabs',
    preserveInput: true,
    hints: [
      'Create all tabs and panels once, then write one select(index) function that updates every tab and panel in a loop.',
      "Compute the target index from the focused tab's index: add or subtract one with wrap-around, or jump to 0 or the last index.",
      'Inside select, set aria-selected, tabindex, and hidden from the same comparison, and call focus on the chosen tab only when the keyboard moved it.',
    ],
    checks: [
      {
        name: 'Exposes tablist, tab, and tabpanel relationships',
        ...dom(
          tabsProps,
          [],
          [
            see('tablist', 'attr:role', 'tablist'),
            see('tablist', 'attr:aria-label', 'Account settings'),
            see('tab-profile', 'attr:role', 'tab'),
            see('tab-profile', 'tag', 'button'),
            see('tab-profile', 'attr:type', 'button'),
            see('tab-profile', 'controls', 'panel-profile'),
            see('tab-billing', 'controls', 'panel-billing'),
            see('panel-security', 'attr:role', 'tabpanel'),
            see('panel-security', 'attr:aria-labelledby', 'tab-security'),
          ],
        ),
      },
      {
        name: 'Selects the first tab and one tab stop initially',
        ...dom(
          tabsProps,
          [],
          [
            ...selected('true', 'false', 'false'),
            ...stops(0, -1, -1),
            ...shown(true, false, false),
            see('panel-profile', 'text', 'Edit your name.'),
          ],
        ),
      },
      {
        name: 'Clicking a tab selects it and shows its panel',
        ...dom(
          tabsProps,
          [click('tab-security')],
          [...selected('false', 'true', 'false'), ...stops(-1, 0, -1), ...shown(false, true, false)],
        ),
      },
      {
        name: 'ArrowRight selects and focuses the next tab',
        ...dom(
          tabsProps,
          [focus('tab-profile'), key('ArrowRight')],
          [...selected('false', 'true', 'false'), ...stops(-1, 0, -1), see('tab-security', 'focused', true), ...shown(false, true, false)],
        ),
      },
      {
        name: 'ArrowRight wraps from the last tab to the first',
        ...dom(
          tabsProps,
          [click('tab-billing'), focus('tab-billing'), key('ArrowRight')],
          [...selected('true', 'false', 'false'), see('tab-profile', 'focused', true), ...stops(0, -1, -1)],
        ),
      },
      {
        name: 'ArrowLeft wraps from the first tab to the last',
        ...dom(
          tabsProps,
          [focus('tab-profile'), key('ArrowLeft')],
          [...selected('false', 'false', 'true'), see('tab-billing', 'focused', true), ...shown(false, false, true)],
        ),
      },
      {
        name: 'End jumps to the last tab',
        ...dom(
          tabsProps,
          [focus('tab-profile'), key('End')],
          [...selected('false', 'false', 'true'), see('tab-billing', 'focused', true), ...stops(-1, -1, 0)],
        ),
      },
      {
        name: 'Home jumps to the first tab',
        ...dom(
          tabsProps,
          [click('tab-billing'), focus('tab-billing'), key('Home')],
          [...selected('true', 'false', 'false'), see('tab-profile', 'focused', true), ...shown(true, false, false)],
        ),
      },
      {
        name: 'Other keys leave the selection alone',
        ...dom(
          tabsProps,
          [focus('tab-profile'), key('a'), key('ArrowDown')],
          [...selected('true', 'false', 'false'), see('tab-profile', 'focused', true), ...stops(0, -1, -1)],
        ),
      },
      {
        name: 'Titles and content containing markup remain text',
        ...dom(
          { label: 'One', tabs: [{ id: 'a', title: '<b>A</b>', content: '<i>x</i>' }] },
          [],
          [see('tab-a', 'text', '<b>A</b>'), see('panel-a', 'text', '<i>x</i>'), see('tab-a', 'prop:childElementCount', 0)],
        ),
      },
    ],
  },
  {
    id: 'dom-live-search',
    title: 'Announce live search results politely',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A fruit filter updates the list as you type. A sighted person sees the list change; a screen reader user hears nothing unless a polite live region reports the new result count. The empty state also needs plain words.',
    prompt:
      'Implement `mountLiveSearch(root, props)` with props.items (strings). Render a search input with a visible label "Filter items", a list (ul) with one li per visible item, and a status paragraph that is a polite live region (aria-live="polite"). Create the status paragraph during the first render, not after the first keystroke, and update its text in place. On every input event, filter items by a trimmed, case-insensitive substring of the input value, keeping original labels and order, and leave the typed value as entered. The status reads "<n> results", or "1 result" for exactly one. When nothing matches, also show a paragraph "No items match your search." in addition to the status; remove it when matches return. Use data-testid values: search on the input, item on each li, status on the live region, and empty on the empty-state paragraph.',
    brief: {
      summary: 'Implement `mountLiveSearch(root, props)` with props.items (strings).',
      rules: [
        'Render a search input with a visible label "Filter items", a list (ul) with one li per visible item, and a status paragraph that is a polite live region (aria-live="polite").',
        'Create the status paragraph during the first render, not after the first keystroke, and update its text in place.',
        'On every input event, filter items by a trimmed, case-insensitive substring of the input value, keeping original labels and order, and leave the typed value as entered.',
        'The status reads "<n> results", or "1 result" for exactly one.',
      ],
      edgeCases: [
        'When nothing matches, also show a paragraph "No items match your search." in addition to the status; remove it when matches return.',
        'Use data-testid values: search on the input, item on each li, status on the live region, and empty on the empty-state paragraph.',
      ],
    },
    example: {
      input: "items Apple, Banana, Pineapple, Apricot; typed ' AP '",
      output: "list: Apple, Pineapple, Apricot; status: '3 results'",
    },
    note:
      'Use data-testid values: search on the input, item on each li, status on the live region, and empty on the empty-state paragraph. Render items with `textContent`. Do not replace the status or input elements on each keystroke: a live region that is recreated may not be announced, and a recreated input loses focus. ' +
      limits,
    acceptanceCriteria: [
      'Typing keeps focus in the input and the cursor position.',
      'The count changes after each keystroke without moving focus.',
      'The empty message is visible text, not only color or an icon.',
      'Test with a real screen reader before claiming the count is announced well.',
    ],
    domPreview: {
      title: 'Your live search implementation',
      description: 'Type to filter, try a query with no matches, then clear it.',
      props: searchProps,
      review: [
        'Type and confirm focus stays in the input and the count changes.',
        'Search for something that does not exist and confirm the empty message appears.',
        'With a screen reader, listen for the polite announcement of the count. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Live region', meaning: 'an element whose text changes are announced by assistive technology without moving focus' },
      { term: 'Polite', meaning: 'announce when the person is idle rather than interrupting them' },
      { term: 'Empty state', meaning: 'the message shown when a list has nothing to display' },
    ],
    planPrompt:
      'Which elements are created once and which are updated on each input event? Write the exact status text for 0, 1, and several results, and say what you will do to keep the original item labels and order while filtering.',
    starter:
      'type SearchProps = { items: string[] }\n\nfunction mountLiveSearch(root: HTMLElement, props: SearchProps): void {\n  // Build the label, input, status, and list once, then update them on input.\n  // Use data-testid values: search, item, status, empty.\n  root.replaceChildren()\n}\n',
    functionName: 'mountLiveSearch',
    preserveInput: true,
    hints: [
      'Create the input, status paragraph, and list once, then write a single render function that only changes their contents.',
      'Compute the matching items from props.items and the query after trimming and lowercasing first; derive the status text and empty message from that same array.',
      'Set aria-live on the status element before the first update and keep it in the page; add or remove only the empty-state paragraph.',
    ],
    checks: [
      {
        name: 'Starts with a labelled input, all items, and a polite status',
        ...dom(
          searchProps,
          [],
          [
            see('search', 'tag', 'input'),
            see('search', 'label', 'Filter items'),
            see('item', 'texts', allFruit),
            see('item', 'parentTag', 'ul'),
            see('status', 'exists', true),
            see('status', 'text', '4 results'),
            see('status', 'attr:aria-live', 'polite'),
            see('empty', 'exists', false),
          ],
        ),
      },
      {
        name: 'Filters with a trimmed, case-insensitive query',
        ...dom(
          searchProps,
          [type('search', ' AP ')],
          [
            see('item', 'texts', ['Apple', 'Pineapple', 'Apricot']),
            see('status', 'text', '3 results'),
            see('search', 'prop:value', ' AP '),
            see('empty', 'exists', false),
          ],
        ),
      },
      {
        name: 'Uses the singular for exactly one result',
        ...dom(searchProps, [type('search', 'apr')], [see('item', 'texts', ['Apricot']), see('status', 'text', '1 result')]),
      },
      {
        name: 'Shows the empty state and a zero count when nothing matches',
        ...dom(
          searchProps,
          [type('search', 'zzz')],
          [
            see('item', 'texts', []),
            see('status', 'text', '0 results'),
            see('empty', 'text', 'No items match your search.'),
            see('empty', 'count', 1),
          ],
        ),
      },
      {
        name: 'Clearing the search restores the list and removes the empty state',
        ...dom(
          searchProps,
          [type('search', 'zzz'), type('search', '')],
          [see('item', 'texts', allFruit), see('status', 'text', '4 results'), see('empty', 'exists', false)],
        ),
      },
      {
        name: 'Keeps the same live region and input while typing',
        ...dom(
          searchProps,
          [mark('status'), mark('search'), focus('search'), type('search', 'a'), type('search', 'ap'), type('search', 'zzz')],
          [
            see('status', 'prop:__marked', true),
            see('status', 'count', 1),
            see('status', 'attr:aria-live', 'polite'),
            see('search', 'prop:__marked', true),
            see('search', 'focused', true),
          ],
        ),
      },
      {
        name: 'Item labels containing markup remain text',
        ...dom(
          { items: ['<b>Ada</b>'] },
          [],
          [see('item', 'texts', ['<b>Ada</b>']), see('item', 'prop:childElementCount', 0), see('status', 'text', '1 result')],
        ),
      },
    ],
  },
  {
    id: 'dom-accordion',
    title: 'Build an accordion where one section stays open',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A help page lists Shipping, Returns, and Warranty. People read one answer at a time, so at most one section shows, and keyboard and screen reader users must be able to tell which.',
    prompt:
      'Implement `mountAccordion(root, props)` with props.sections (id, title, content) and props.open, the id of the section that starts open or null. For each section render a header control and a panel. The header has type="button", the title as text, `aria-expanded` "true" or "false", and `aria-controls` naming its panel. The panel has role="region", aria-labelledby naming its header, the content as text, and is hidden unless its section is open. At most one section is open. Activating a closed header opens its section and closes the other. Activating the open header closes it, leaving none open. An open id that matches no section means none start open. Headers are not rebuilt, so they keep focus. Use data-testid header-<id> on each header and panel-<id> on each panel,, with matching element ids.',
    brief: {
      summary:
        'Implement `mountAccordion(root, props)` with props.sections (id, title, content) and props.open, the id of the section that starts open or null.',
      rules: [
        'For each section render a header control and a panel.',
        'The header has type="button", the title as text, `aria-expanded` "true" or "false", and `aria-controls` naming its panel.',
        'The panel has role="region", aria-labelledby naming its header, the content as text, and is hidden unless its section is open.',
        'At most one section is open. Activating a closed header opens its section and closes the other; activating the open header closes it, leaving none open.',
      ],
      edgeCases: [
        'An open id that matches no section means none start open.',
        'Headers are not rebuilt, so they keep focus.',
        'Use data-testid header-<id> on each header and panel-<id> on each panel, with matching element ids.',
      ],
    },
    example: { input: "open 'shipping', then click Returns", output: 'Returns is expanded and visible; Shipping is collapsed and hidden' },
    note:
      'Use data-testid header-<id> and panel-<id> (the same strings as the element ids). Render titles and content with `textContent`. Checks click the headers. ' +
      limits,
    acceptanceCriteria: [
      'Tab reaches every header in order; Enter and Space activate the focused one in a real browser.',
      'Focus stays visibly on the header you activated.',
      'Try a screen reader to confirm that each header announces whether it is expanded.',
    ],
    domPreview: {
      title: 'Your accordion implementation',
      description: 'Open each section in turn, then close the open one.',
      props: accordionProps,
      review: [
        'Tab through the headers and activate each with Enter and Space.',
        'Confirm the focus indicator stays on the header you activated.',
        'With a screen reader, listen for the expanded or collapsed announcement. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Accordion', meaning: 'a stack of sections where each header shows or hides its own panel' },
      { term: 'Region', meaning: 'a role for a named block of content' },
    ],
    planPrompt:
      'Decide what the one piece of state is and what every header and panel is computed from. What does a click do to that state when the section is closed, and when it is already open?',
    starter:
      'type AccordionProps = { open: string | null; sections: { id: string; title: string; content: string }[] }\n\nfunction mountAccordion(root: HTMLElement, props: AccordionProps): void {\n  // Build a header and panel for each section. header-<id>, panel-<id>.\n  root.replaceChildren()\n}\n',
    functionName: 'mountAccordion',
    preserveInput: true,
    hints: [
      'Build every header and panel once, then write one function that sets all of them from the current state.',
      'Keep a single value for which section is open, and compare each section to it instead of storing a flag per section.',
      'A click should store the clicked section, or nothing when it was already the open one, and then reapply the state without rebuilding any element.',
    ],
    checks: [
      {
        name: 'Renders headers wired to labelled regions',
        ...dom(
          accordionProps,
          [],
          [
            see('header-shipping', 'tag', 'button'),
            see('header-shipping', 'attr:type', 'button'),
            see('header-returns', 'text', 'Returns'),
            see('header-warranty', 'controls', 'panel-warranty'),
            see('panel-returns', 'attr:role', 'region'),
            see('panel-returns', 'attr:aria-labelledby', 'header-returns'),
            see('panel-warranty', 'text', 'Repairs are covered for a year.'),
            see('header-shipping', 'count', 1),
            see('panel-shipping', 'count', 1),
          ],
        ),
      },
      {
        name: 'Starts with only the requested section open',
        ...dom(accordionProps, [], [...expanded('true', 'false', 'false'), ...visible(true, false, false)]),
      },
      {
        name: 'Starts with every section closed when open is null',
        ...dom({ ...accordionProps, open: null }, [], [...expanded('false', 'false', 'false'), ...visible(false, false, false)]),
      },
      {
        name: 'An unknown open id starts with every section closed',
        ...dom({ ...accordionProps, open: 'missing' }, [], [...expanded('false', 'false', 'false'), ...visible(false, false, false)]),
      },
      {
        name: 'Opening another section closes the open one',
        ...dom(accordionProps, [click('header-returns')], [...expanded('false', 'true', 'false'), ...visible(false, true, false)]),
      },
      {
        name: 'Clicking the open header closes it and leaves none open',
        ...dom(accordionProps, [click('header-shipping')], [...expanded('false', 'false', 'false'), ...visible(false, false, false)]),
      },
      {
        name: 'A closed accordion opens the clicked section',
        ...dom(
          { ...accordionProps, open: null },
          [click('header-warranty')],
          [...expanded('false', 'false', 'true'), ...visible(false, false, true)],
        ),
      },
      {
        name: 'Headers keep identity and focus across several clicks',
        ...dom(
          accordionProps,
          [mark('header-returns'), focus('header-returns'), click('header-returns'), click('header-warranty'), click('header-returns')],
          [
            see('header-returns', 'prop:__marked', true),
            see('header-returns', 'focused', true),
            see('header-returns', 'count', 1),
            ...expanded('false', 'true', 'false'),
            ...visible(false, true, false),
          ],
        ),
      },
      {
        name: 'Titles and content containing markup remain text',
        ...dom(
          { open: 'a', sections: [{ id: 'a', title: '<b>A</b>', content: '<i>x</i>' }] },
          [],
          [
            see('header-a', 'text', '<b>A</b>'),
            see('panel-a', 'text', '<i>x</i>'),
            see('header-a', 'prop:childElementCount', 0),
            see('panel-a', 'prop:childElementCount', 0),
          ],
        ),
      },
    ],
  },

  {
    id: 'dom-reorder-list',
    title: 'Reorder a list with keyboard-friendly buttons',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A packing list lets people drag items into order, but dragging needs a pointer. Move up and Move down buttons give keyboard and switch users the same power, as long as focus and announcements follow the item that moved.',
    prompt:
      'Implement `mountReorderList(root, props)` with props.label and props.items, a list of {id, label}. Render an ordered list labelled by props.label with one item per entry, in order. Each item shows its label in an element with data-testid="name" and has two real buttons: Move up (data-testid="up-ID") and Move down (data-testid="down-ID"), where ID is the item’s id. Name each button for its item with aria-label, for example "Move Milk up". Disable Move up on the first item and Move down on the last. Clicking a button moves its item one place and updates the disabled states. Focus stays on the button that was clicked; if that button has just become disabled, focus moves to the item’s other button. A status element (role="status", data-testid="status") starts empty and then says, for example, "Milk moved to position 2 of 4." Do not change props.',
    brief: {
      summary: 'Implement `mountReorderList(root, props)`: an ordered list whose items move with Move up and Move down buttons.',
      rules: [
        'Render an ordered list (data-testid="list") labelled by props.label, with one item per entry and its label in data-testid="name".',
        'Each item has real buttons data-testid="up-ID" and "down-ID", named with aria-label such as "Move Milk up".',
        'Disable Move up on the first item and Move down on the last. A click moves the item one place and updates the disabled states.',
        'Focus stays on the clicked button; if it has just become disabled, focus moves to the item’s other button.',
        'A status element (role="status", data-testid="status") starts empty, then says, for example, "Milk moved to position 2 of 4."',
      ],
      edgeCases: ['Do not change props or its items array.', 'Labels may contain markup characters: render them as text.'],
    },
    example: {
      input: 'items Milk, Eggs, Bread, Tea; click Move Milk down',
      output: 'Eggs, Milk, Bread, Tea and the status "Milk moved to position 2 of 4."',
    },
    note:
      'Use the data-testid values above. Render labels with `textContent`. Checks click buttons and read focus; they cannot judge whether a screen reader announces the status politely. ' +
      limits,
    acceptanceCriteria: [
      'Tab reaches every enabled button, and disabled buttons are skipped.',
      'After moving an item, focus is still on a button of that item.',
      'With a screen reader, each move is announced once without stealing focus.',
    ],
    domPreview: {
      title: 'Your reorderable list',
      description: 'Move items with the buttons, first with the mouse and then with Tab and Enter or Space.',
      props: reorderProps,
      review: [
        'Move an item to the top with the keyboard and confirm focus lands on its Move down button.',
        'Confirm each button’s accessible name says which item it moves.',
        'With a screen reader, listen for the status after each move. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Reorder', meaning: 'change the position of an item within a list' },
      { term: 'Status message', meaning: 'text in a role="status" element that assistive technology announces without moving focus' },
      { term: 'Accessible name', meaning: 'the text assistive technology reads to identify a control' },
    ],
    planPrompt:
      'Where does the order live, and how do the list, the disabled states, and the status follow from it? Decide where focus goes when an item reaches the top.',
    starter:
      'type Item = { id: string; label: string }\ntype ReorderProps = { label: string; items: Item[] }\n\nfunction mountReorderList(root: HTMLElement, props: ReorderProps): void {\n  // Render an ordered list with Move up and Move down buttons for each item.\n  root.replaceChildren()\n}\n',
    functionName: 'mountReorderList',
    preserveInput: true,
    hints: [
      'Keep your own copy of the order and treat the screen as a view of it.',
      'Move the existing list item elements instead of rebuilding them, so each button stays the same element. Moving an element can still drop focus in some browsers, so set focus again after every move.',
      'After each move, recompute every button’s disabled state from the new positions, then decide where focus belongs and write the status text.',
    ],
    checks: [
      {
        name: 'Renders a labelled ordered list',
        ...dom(
          reorderProps,
          [],
          [
            see('list', 'tag', 'ol'),
            see('list', 'attr:aria-label', 'Packing order'),
            see('name', 'texts', ['Milk', 'Eggs', 'Bread', 'Tea']),
            see('status', 'attr:role', 'status'),
            see('status', 'text', ''),
          ],
        ),
      },
      {
        name: 'Buttons are real and named for their item',
        ...dom(
          reorderProps,
          [],
          [
            see('up-eggs', 'tag', 'button'),
            see('up-eggs', 'attr:type', 'button'),
            see('up-eggs', 'attr:aria-label', 'Move Eggs up'),
            see('down-eggs', 'attr:aria-label', 'Move Eggs down'),
          ],
        ),
      },
      {
        name: 'Edge buttons start disabled',
        ...dom(
          reorderProps,
          [],
          [
            see('up-milk', 'prop:disabled', true),
            see('down-milk', 'prop:disabled', false),
            see('up-tea', 'prop:disabled', false),
            see('down-tea', 'prop:disabled', true),
          ],
        ),
      },
      {
        name: 'Moving down changes the order and the status',
        ...dom(
          reorderProps,
          [click('down-milk')],
          [see('name', 'texts', ['Eggs', 'Milk', 'Bread', 'Tea']), see('status', 'text', 'Milk moved to position 2 of 4.')],
        ),
      },
      {
        name: 'Disabled states follow the new order',
        ...dom(
          reorderProps,
          [click('down-milk')],
          [see('up-milk', 'prop:disabled', false), see('up-eggs', 'prop:disabled', true), see('down-eggs', 'prop:disabled', false)],
        ),
      },
      {
        name: 'Focus stays on the clicked button',
        ...dom(reorderProps, [focus('down-milk'), click('down-milk')], [see('down-milk', 'focused', true)]),
      },
      {
        name: 'Reaching the top moves focus to the other button',
        ...dom(
          reorderProps,
          [focus('up-eggs'), click('up-eggs')],
          [
            see('name', 'texts', ['Eggs', 'Milk', 'Bread', 'Tea']),
            see('up-eggs', 'prop:disabled', true),
            see('down-eggs', 'focused', true),
          ],
        ),
      },
      {
        name: 'Several moves keep one item per entry',
        ...dom(
          reorderProps,
          [click('up-tea'), click('up-tea'), click('up-tea')],
          [
            see('name', 'texts', ['Tea', 'Milk', 'Eggs', 'Bread']),
            see('name', 'count', 4),
            see('status', 'text', 'Tea moved to position 1 of 4.'),
          ],
        ),
      },
      {
        name: 'Labels containing markup remain text',
        ...dom(
          { label: 'List', items: [{ id: 'a', label: '<b>A</b>' }] },
          [],
          [
            see('name', 'text', '<b>A</b>'),
            see('name', 'prop:childElementCount', 0),
            see('up-a', 'prop:disabled', true),
            see('down-a', 'prop:disabled', true),
          ],
        ),
      },
    ],
  },
  {
    id: 'dom-modal-dialog',
    title: 'Build a modal dialog that keeps focus inside',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A “Delete draft” button asks for confirmation in a modal dialog. While it is open, keyboard users must not wander into the page behind it, and when it closes they should land back where they started.',
    prompt:
      'Implement `mountDialog(root, props)` with props.openLabel, props.title, props.body, and props.confirmLabel. Render an opener button (data-testid="open") with the text openLabel, a result element (data-testid="result") that starts empty, and a dialog (data-testid="dialog") that starts hidden. The dialog has role="dialog", aria-modal="true", and aria-labelledby="dialog-title"; inside it are a heading with id="dialog-title" and data-testid="title" holding the title text, a paragraph with the body, then a confirm button (data-testid="confirm", text confirmLabel) and a Cancel button (data-testid="cancel"). Opening shows the dialog and focuses the confirm button. While open, Tab on the last button moves focus to the first, and Shift+Tab on the first moves focus to the last. Escape or Cancel closes the dialog with the result "Cancelled."; confirm closes it with "Confirmed.". Closing hides the dialog and returns focus to the opener. Do not change props.',
    brief: {
      summary: 'Implement `mountDialog(root, props)`: an opener button and a modal dialog that keeps focus inside while open.',
      rules: [
        'Render an opener (data-testid="open", text openLabel), a result element (data-testid="result") that starts empty, and a hidden dialog (data-testid="dialog").',
        'The dialog has role="dialog", aria-modal="true", and aria-labelledby="dialog-title"; it holds a heading (id="dialog-title", data-testid="title"), the body, a confirm button (data-testid="confirm", text confirmLabel), then Cancel (data-testid="cancel").',
        'Opening shows the dialog and focuses the confirm button.',
        'While open, Tab on the last button moves focus to the first, and Shift+Tab on the first moves focus to the last.',
        'Escape or Cancel closes with the result "Cancelled."; confirm closes with "Confirmed.". Closing hides the dialog and returns focus to the opener.',
      ],
      edgeCases: ['The dialog can be opened again after closing.', 'Render every prop as text, and do not change props.'],
    },
    example: { input: 'click Delete draft, press Escape', output: 'dialog hidden, result "Cancelled.", focus back on Delete draft' },
    note:
      'Use the data-testid values and ids above. Checks dispatch key events and do not move focus themselves, so Tab and Shift+Tab at the edges must move focus in your code. ' +
      limits,
    acceptanceCriteria: [
      'In a real browser, Tab and Shift+Tab cycle between the two buttons and never reach the page behind.',
      'Focus returns to the opener after every way of closing.',
      'A screen reader announces the dialog with its title when it opens.',
    ],
    domPreview: {
      title: 'Your modal dialog',
      description: 'Open the dialog, then try Tab, Shift+Tab, Escape, and both buttons.',
      props: dialogProps,
      review: [
        'Cycle focus with Tab and Shift+Tab and confirm it never leaves the dialog.',
        'Close the dialog each way and confirm focus returns to the opener.',
        'With a screen reader, confirm the dialog is announced with its title. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Modal dialog', meaning: 'a window that blocks the page behind it until it is closed' },
      { term: 'Focus trap', meaning: 'keeping keyboard focus inside one region while it is open' },
      { term: 'Focus return', meaning: 'moving focus back to the control that opened something once it closes' },
    ],
    planPrompt:
      'Which element should have focus after each of these: opening, Tab on the last button, Escape, and Confirm? Where do you listen for keys so every button is covered?',
    starter:
      'type DialogProps = { openLabel: string; title: string; body: string; confirmLabel: string }\n\nfunction mountDialog(root: HTMLElement, props: DialogProps): void {\n  // Render the opener, the result, and a hidden dialog. Use the data-testid values from the brief.\n  root.replaceChildren()\n}\n',
    functionName: 'mountDialog',
    preserveInput: true,
    hints: [
      'One key listener on the dialog itself sees Tab, Shift+Tab, and Escape from every button inside it.',
      'Only the edges need code: when focus is on the last button and Tab is pressed, cancel the default action and focus the first; Shift+Tab on the first does the reverse.',
      'Write one close function that hides the dialog, writes the result, and focuses the opener, and call it from Escape, Cancel, and confirm.',
    ],
    checks: [
      {
        name: 'Starts closed with a real opener',
        ...dom(
          dialogProps,
          [],
          [
            see('dialog', 'prop:hidden', true),
            see('open', 'tag', 'button'),
            see('open', 'text', 'Delete draft'),
            see('result', 'text', ''),
          ],
        ),
      },
      {
        name: 'The dialog is labelled and modal',
        ...dom(
          dialogProps,
          [click('open')],
          [
            see('dialog', 'attr:role', 'dialog'),
            see('dialog', 'attr:aria-modal', 'true'),
            see('dialog', 'attr:aria-labelledby', 'dialog-title'),
            see('dialog', 'prop:hidden', false),
            see('title', 'text', 'Delete this draft?'),
            see('title', 'attr:id', 'dialog-title'),
            see('confirm', 'text', 'Delete'),
            see('cancel', 'text', 'Cancel'),
          ],
        ),
      },
      { name: 'Opening focuses the confirm button', ...dom(dialogProps, [click('open')], [see('confirm', 'focused', true)]) },
      {
        name: 'Tab on the last button wraps to the first',
        ...dom(dialogProps, [click('open'), focus('cancel'), key('Tab')], [see('confirm', 'focused', true)]),
      },
      {
        name: 'Shift+Tab on the first button wraps to the last',
        ...dom(dialogProps, [click('open'), shiftKey('Tab')], [see('cancel', 'focused', true)]),
      },
      {
        name: 'Escape closes and returns focus',
        ...dom(
          dialogProps,
          [click('open'), key('Escape')],
          [see('dialog', 'prop:hidden', true), see('open', 'focused', true), see('result', 'text', 'Cancelled.')],
        ),
      },
      {
        name: 'Cancel closes and returns focus',
        ...dom(
          dialogProps,
          [click('open'), click('cancel')],
          [see('dialog', 'prop:hidden', true), see('open', 'focused', true), see('result', 'text', 'Cancelled.')],
        ),
      },
      {
        name: 'Confirm closes with its own result',
        ...dom(
          dialogProps,
          [click('open'), click('confirm')],
          [see('dialog', 'prop:hidden', true), see('open', 'focused', true), see('result', 'text', 'Confirmed.')],
        ),
      },
      {
        name: 'The dialog opens again after closing',
        ...dom(
          dialogProps,
          [click('open'), key('Escape'), click('open')],
          [see('dialog', 'prop:hidden', false), see('confirm', 'focused', true)],
        ),
      },
      {
        name: 'Text containing markup stays text',
        ...dom(
          { ...dialogProps, title: '<b>T</b>' },
          [click('open')],
          [see('title', 'text', '<b>T</b>'), see('title', 'prop:childElementCount', 0)],
        ),
      },
    ],
  },
  {
    id: 'dom-combobox',
    title: 'Build a search box with arrow-key suggestions',
    category: 'Frontend accessibility',
    format: 'frontend',
    context:
      'A fruit picker suggests matches as you type. Mouse users click a suggestion; keyboard users need the arrow keys, Enter, and Escape, and screen-reader users need to hear which suggestion is active while focus stays in the text box.',
    prompt:
      'Implement `mountCombobox(root, props)` with props.label and props.options. Render an input (data-testid="input") labelled by props.label, with role="combobox", aria-autocomplete="list", aria-expanded, and aria-controls pointing at a list (data-testid="listbox", role="listbox", with an id). Typing shows the options that start with the typed text, ignoring case and surrounding spaces, each as an element with role="option", data-testid="option", and id="option-N", where N is its position in props.options. With no text or no match, hide the list and set aria-expanded to "false"; otherwise show it and set "true". ArrowDown makes the next shown option active, ArrowUp the previous, both wrapping around; from no active option, ArrowDown goes to the first and ArrowUp to the last. The active option has aria-selected="true", the others "false", and the input’s aria-activedescendant names it. Enter with an active option puts its text in the input and closes the list; Escape closes the list and keeps the typed text. Closing or typing again clears the active option and removes aria-activedescendant. Focus stays on the input throughout. Do not change props.',
    brief: {
      summary:
        'Implement `mountCombobox(root, props)`: a labelled input with a list of matching suggestions you can pick with the keyboard.',
      rules: [
        'The input (data-testid="input") has role="combobox", aria-autocomplete="list", aria-expanded, and aria-controls pointing at the list (data-testid="listbox", role="listbox").',
        'Typing shows the options that start with the typed text, ignoring case and surrounding spaces. Each is role="option", data-testid="option", id="option-N" for its position N in props.options.',
        'With no text or no match, hide the list and set aria-expanded to "false"; otherwise show it and set "true".',
        'ArrowDown and ArrowUp move the active option, wrapping around; from none, ArrowDown goes to the first and ArrowUp to the last. The active option has aria-selected="true" and is named by the input’s aria-activedescendant.',
        'Enter with an active option puts its text in the input and closes the list. Escape closes the list and keeps the typed text.',
      ],
      edgeCases: [
        'Closing or typing again clears the active option and removes aria-activedescendant.',
        'Focus stays on the input throughout. Do not change props.',
      ],
    },
    example: { input: "type 'ap', press ArrowDown twice, then Enter", output: "input value 'Apricot' and the list closed" },
    note:
      'Use the data-testid values and ids above, and render option text with `textContent`. Checks type by setting the value and dispatching input events, and dispatch key events to the focused input. ' +
      limits,
    acceptanceCriteria: [
      'Arrow keys never move focus out of the input.',
      'A screen reader announces the active suggestion as it changes.',
      'Clicking a suggestion is a sensible addition, but it is not checked here.',
    ],
    domPreview: {
      title: 'Your combobox',
      description: 'Type part of a fruit name, then use the arrow keys, Enter, and Escape.',
      props: comboProps,
      review: [
        'Type, then move through the suggestions with the arrow keys and confirm the active one is visible.',
        'Confirm Enter fills the input and Escape keeps what you typed.',
        'With a screen reader, listen for the active suggestion as it changes. Checks cannot judge this.',
      ],
    },
    vocabulary: [
      { term: 'Combobox', meaning: 'a text input combined with a list of suggestions to choose from' },
      { term: 'aria-activedescendant', meaning: 'an attribute naming the option that is active while focus stays on the input' },
      { term: 'Listbox', meaning: 'a list of options that one can be chosen from' },
    ],
    planPrompt:
      'List the state the widget needs, such as the typed text, the matches, the active option, and whether the list is open. Which attributes change when each piece of state changes?',
    starter:
      'type ComboboxProps = { label: string; options: string[] }\n\nfunction mountCombobox(root: HTMLElement, props: ComboboxProps): void {\n  // Render a labelled combobox input and a listbox. Use the data-testid values from the brief.\n  root.replaceChildren()\n}\n',
    functionName: 'mountCombobox',
    preserveInput: true,
    hints: [
      'Keep the matches and the index of the active match as state, and write one function that applies that state to the list and every attribute.',
      'The options are not focused: the input keeps focus and points at the active option with aria-activedescendant.',
      'Typing recomputes the matches and clears the active index. The arrow keys change only the index, using the remainder after dividing by the number of matches to wrap around.',
    ],
    checks: [
      {
        name: 'Renders a labelled, closed combobox',
        ...dom(
          comboProps,
          [],
          [
            see('input', 'tag', 'input'),
            see('input', 'label', 'Fruit'),
            see('input', 'attr:role', 'combobox'),
            see('input', 'attr:aria-autocomplete', 'list'),
            see('input', 'controls', 'listbox'),
            see('listbox', 'attr:role', 'listbox'),
            ...comboClosed,
          ],
        ),
      },
      {
        name: 'Typing shows options that start with the text',
        ...dom(
          comboProps,
          [type('input', 'ap')],
          [see('option', 'texts', ['Apple', 'Apricot']), see('input', 'attr:aria-expanded', 'true'), see('listbox', 'prop:hidden', false)],
        ),
      },
      {
        name: 'Matching ignores case and surrounding spaces',
        ...dom(comboProps, [type('input', '  BA ')], [see('option', 'texts', ['Banana']), see('option', 'attr:role', 'option')]),
      },
      { name: 'No match closes the list', ...dom(comboProps, [type('input', 'zz')], comboClosed) },
      {
        name: 'ArrowDown activates the first option without moving focus',
        ...dom(
          comboProps,
          [type('input', 'ap'), focus('input'), key('ArrowDown')],
          [
            see('input', 'activeText', 'Apple'),
            see('input', 'attr:aria-activedescendant', 'option-0'),
            see('option', 'selectedTexts', ['Apple']),
            see('input', 'focused', true),
          ],
        ),
      },
      {
        name: 'ArrowDown wraps from the last option to the first',
        ...dom(
          comboProps,
          [type('input', 'ap'), focus('input'), key('ArrowDown'), key('ArrowDown'), key('ArrowDown')],
          [see('input', 'activeText', 'Apple'), see('option', 'selectedTexts', ['Apple'])],
        ),
      },
      {
        name: 'ArrowUp from no active option goes to the last',
        ...dom(
          comboProps,
          [type('input', 'ap'), focus('input'), key('ArrowUp')],
          [see('input', 'activeText', 'Apricot'), see('input', 'attr:aria-activedescendant', 'option-2')],
        ),
      },
      {
        name: 'Enter picks the active option and closes the list',
        ...dom(
          comboProps,
          [type('input', 'ap'), focus('input'), key('ArrowDown'), key('ArrowDown'), key('Enter')],
          [see('input', 'prop:value', 'Apricot'), see('input', 'attr:aria-activedescendant', null), ...comboClosed],
        ),
      },
      {
        name: 'Escape closes the list and keeps the typed text',
        ...dom(
          comboProps,
          [type('input', 'ap'), focus('input'), key('ArrowDown'), key('Escape')],
          [see('input', 'prop:value', 'ap'), see('input', 'attr:aria-activedescendant', null), ...comboClosed],
        ),
      },
      {
        name: 'Typing again clears the active option',
        ...dom(
          comboProps,
          [type('input', 'ap'), focus('input'), key('ArrowDown'), type('input', 'apr')],
          [see('option', 'texts', ['Apricot']), see('input', 'attr:aria-activedescendant', null), see('option', 'selectedTexts', [])],
        ),
      },
      {
        name: 'Options containing markup remain text',
        ...dom(
          { label: 'Tag', options: ['<b>bold</b>'] },
          [type('input', '<b')],
          [see('option', 'texts', ['<b>bold</b>']), see('option', 'prop:childElementCount', 0)],
        ),
      },
    ],
  },
]
