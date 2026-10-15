export const domSolutions = {
  'dom-form-fields': `
function mountFormFields(root: HTMLElement, props: {fields: {id:string;label:string;type:string;message:string}[]}) {
  root.replaceChildren()
  const form = document.createElement('form')
  form.noValidate = true
  form.setAttribute('data-testid', 'form')
  props.fields.forEach(field => {
    const wrap = document.createElement('div')
    wrap.className = 'field'
    const label = document.createElement('label')
    label.htmlFor = field.id
    label.textContent = field.label
    const input = document.createElement('input')
    input.id = field.id
    input.type = field.type
    input.setAttribute('data-testid', 'field-' + field.id)
    wrap.append(label, input)
    form.append(wrap)
  })
  const button = document.createElement('button')
  button.type = 'submit'
  button.textContent = 'Submit'
  button.setAttribute('data-testid', 'submit')
  form.append(button)
  form.addEventListener('submit', event => event.preventDefault())
  root.append(form)
}`,
  'dom-form-errors': `
function mountFormErrors(root: HTMLElement, props: {fields: {id:string;label:string;type:string;message:string}[]}) {
  root.replaceChildren()
  const form = document.createElement('form')
  form.noValidate = true
  form.setAttribute('data-testid', 'form')
  const rows = props.fields.map(field => {
    const wrap = document.createElement('div')
    wrap.className = 'field'
    const label = document.createElement('label')
    label.htmlFor = field.id
    label.textContent = field.label
    const input = document.createElement('input')
    input.id = field.id
    input.type = field.type
    input.setAttribute('data-testid', 'field-' + field.id)
    wrap.append(label, input)
    form.append(wrap)
    return { field, wrap, input, error: null as HTMLElement | null }
  })
  const button = document.createElement('button')
  button.type = 'submit'
  button.textContent = 'Submit'
  button.setAttribute('data-testid', 'submit')
  form.append(button)
  function setError(row: typeof rows[number], invalid: boolean) {
    if (!invalid) {
      row.error?.remove()
      row.error = null
      row.input.removeAttribute('aria-invalid')
      row.input.removeAttribute('aria-describedby')
      return
    }
    if (!row.error) {
      row.error = document.createElement('p')
      row.error.id = row.field.id + '-error'
      row.error.setAttribute('data-testid', 'error-' + row.field.id)
      row.wrap.append(row.error)
    }
    row.error.textContent = row.field.message
    row.input.setAttribute('aria-invalid', 'true')
    row.input.setAttribute('aria-describedby', row.error.id)
  }
  form.addEventListener('submit', event => {
    event.preventDefault()
    for (const row of rows) setError(row, row.input.value.trim() === '')
  })
  root.append(form)
}`,
  'dom-form-submit': `
function mountFormSubmit(root: HTMLElement, props: {fields: {id:string;label:string;type:string;message:string}[]}) {
  root.replaceChildren()
  const form = document.createElement('form')
  form.noValidate = true
  form.setAttribute('data-testid', 'form')
  const rows = props.fields.map(field => {
    const wrap = document.createElement('div')
    wrap.className = 'field'
    const label = document.createElement('label')
    label.htmlFor = field.id
    label.textContent = field.label
    const input = document.createElement('input')
    input.id = field.id
    input.type = field.type
    input.setAttribute('data-testid', 'field-' + field.id)
    wrap.append(label, input)
    form.append(wrap)
    return { field, wrap, input, error: null as HTMLElement | null }
  })
  const button = document.createElement('button')
  button.type = 'submit'
  button.textContent = 'Submit'
  button.setAttribute('data-testid', 'submit')
  form.append(button)
  const status = document.createElement('p')
  status.setAttribute('role', 'status')
  status.setAttribute('data-testid', 'status')
  function setError(row: typeof rows[number], invalid: boolean) {
    if (!invalid) {
      row.error?.remove()
      row.error = null
      row.input.removeAttribute('aria-invalid')
      row.input.removeAttribute('aria-describedby')
      return
    }
    if (!row.error) {
      row.error = document.createElement('p')
      row.error.id = row.field.id + '-error'
      row.error.setAttribute('data-testid', 'error-' + row.field.id)
      row.wrap.append(row.error)
    }
    row.error.textContent = row.field.message
    row.input.setAttribute('aria-invalid', 'true')
    row.input.setAttribute('aria-describedby', row.error.id)
  }
  form.addEventListener('submit', event => {
    event.preventDefault()
    let first: HTMLInputElement | null = null
    for (const row of rows) {
      const invalid = row.input.value.trim() === ''
      setError(row, invalid)
      if (invalid && !first) first = row.input
    }
    if (first) { status.remove(); first.focus() }
    else { status.textContent = 'Form accepted.'; form.append(status) }
  })
  root.append(form)
}`,
  'dom-accessible-form': `
function mountAccessibleForm(root: HTMLElement, props: {fields: {id:string;label:string;type:string;message:string}[]}) {
  root.replaceChildren()
  const form = document.createElement('form')
  form.noValidate = true
  form.setAttribute('data-testid', 'form')
  const rows = props.fields.map(field => {
    const wrap = document.createElement('div')
    wrap.className = 'field'
    const label = document.createElement('label')
    label.htmlFor = field.id
    label.textContent = field.label
    const input = document.createElement('input')
    input.id = field.id
    input.type = field.type
    input.setAttribute('data-testid', 'field-' + field.id)
    wrap.append(label, input)
    form.append(wrap)
    return { field, wrap, input, error: null as HTMLElement | null }
  })
  const button = document.createElement('button')
  button.type = 'submit'
  button.textContent = 'Submit'
  button.setAttribute('data-testid', 'submit')
  form.append(button)
  const status = document.createElement('p')
  status.setAttribute('role', 'status')
  status.setAttribute('data-testid', 'status')
  function setError(row: typeof rows[number], invalid: boolean) {
    if (!invalid) {
      row.error?.remove()
      row.error = null
      row.input.removeAttribute('aria-invalid')
      row.input.removeAttribute('aria-describedby')
      return
    }
    if (!row.error) {
      row.error = document.createElement('p')
      row.error.id = row.field.id + '-error'
      row.error.setAttribute('data-testid', 'error-' + row.field.id)
      row.wrap.append(row.error)
    }
    row.error.textContent = row.field.message
    row.input.setAttribute('aria-invalid', 'true')
    row.input.setAttribute('aria-describedby', row.error.id)
  }
  form.addEventListener('submit', event => {
    event.preventDefault()
    let first: HTMLInputElement | null = null
    for (const row of rows) {
      const invalid = row.input.value.trim() === ''
      setError(row, invalid)
      if (invalid && !first) first = row.input
    }
    if (first) { status.remove(); first.focus() }
    else { status.textContent = 'Form accepted.'; form.append(status) }
  })
  root.append(form)
}`,
  'dom-disclosure': `
function mountDisclosure(root: HTMLElement, props: {label:string;content:string;open:boolean}) {
  root.replaceChildren()
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = props.label
  button.setAttribute('data-testid', 'toggle')
  button.setAttribute('aria-controls', 'details-panel')
  const panel = document.createElement('div')
  panel.id = 'details-panel'
  panel.setAttribute('data-testid', 'panel')
  panel.textContent = props.content
  let open = props.open
  function apply() {
    button.setAttribute('aria-expanded', String(open))
    panel.hidden = !open
  }
  button.addEventListener('click', () => { open = !open; apply() })
  apply()
  root.append(button, panel)
}`,
  'dom-tabs': `
function mountTabs(root: HTMLElement, props: {label:string;tabs:{id:string;title:string;content:string}[]}) {
  root.replaceChildren()
  const list = document.createElement('div')
  list.setAttribute('role', 'tablist')
  list.setAttribute('aria-label', props.label)
  list.setAttribute('data-testid', 'tablist')
  const tabs: HTMLButtonElement[] = []
  const panels: HTMLElement[] = []
  props.tabs.forEach((item, index) => {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.id = 'tab-' + item.id
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-controls', 'panel-' + item.id)
    tab.setAttribute('data-testid', 'tab-' + item.id)
    tab.textContent = item.title
    tab.addEventListener('click', () => select(index, false))
    const panel = document.createElement('div')
    panel.id = 'panel-' + item.id
    panel.setAttribute('role', 'tabpanel')
    panel.setAttribute('aria-labelledby', tab.id)
    panel.setAttribute('data-testid', 'panel-' + item.id)
    panel.textContent = item.content
    tabs.push(tab)
    panels.push(panel)
    list.append(tab)
  })
  function select(selected: number, moveFocus: boolean) {
    tabs.forEach((tab, index) => {
      tab.setAttribute('aria-selected', String(index === selected))
      tab.tabIndex = index === selected ? 0 : -1
      panels[index].hidden = index !== selected
    })
    if (moveFocus) tabs[selected].focus()
  }
  list.addEventListener('keydown', event => {
    const current = tabs.indexOf(event.target as HTMLButtonElement)
    if (current === -1) return
    const last = tabs.length - 1
    const next: Record<string, number> = { ArrowRight: current === last ? 0 : current + 1, ArrowLeft: current === 0 ? last : current - 1, Home: 0, End: last }
    if (!(event.key in next)) return
    event.preventDefault()
    select(next[event.key], true)
  })
  if (tabs.length) select(0, false)
  root.append(list, ...panels)
}`,
  'dom-live-search': `
function mountLiveSearch(root: HTMLElement, props: {items:string[]}) {
  root.replaceChildren()
  const label = document.createElement('label')
  label.htmlFor = 'item-search'
  label.textContent = 'Filter items'
  const input = document.createElement('input')
  input.id = 'item-search'
  input.type = 'search'
  input.setAttribute('data-testid', 'search')
  const status = document.createElement('p')
  status.setAttribute('aria-live', 'polite')
  status.setAttribute('data-testid', 'status')
  const list = document.createElement('ul')
  const empty = document.createElement('p')
  empty.setAttribute('data-testid', 'empty')
  empty.textContent = 'No items match your search.'
  function render() {
    const query = input.value.trim().toLowerCase()
    const matches = props.items.filter(item => item.toLowerCase().includes(query))
    list.replaceChildren(...matches.map(text => {
      const li = document.createElement('li')
      li.setAttribute('data-testid', 'item')
      li.textContent = text
      return li
    }))
    status.textContent = matches.length + (matches.length === 1 ? ' result' : ' results')
    if (matches.length === 0) list.after(empty)
    else empty.remove()
  }
  input.addEventListener('input', render)
  root.append(label, input, status, list)
  render()
}`,
  'dom-accordion': `
function mountAccordion(root: HTMLElement, props: {open: string | null; sections: {id:string;title:string;content:string}[]}) {
  root.replaceChildren()
  let current = props.sections.some(section => section.id === props.open) ? props.open : null
  const parts = props.sections.map(section => {
    const header = document.createElement('button')
    header.type = 'button'
    header.id = 'header-' + section.id
    header.textContent = section.title
    header.setAttribute('data-testid', 'header-' + section.id)
    header.setAttribute('aria-controls', 'panel-' + section.id)
    const panel = document.createElement('div')
    panel.id = 'panel-' + section.id
    panel.setAttribute('role', 'region')
    panel.setAttribute('aria-labelledby', header.id)
    panel.setAttribute('data-testid', 'panel-' + section.id)
    panel.textContent = section.content
    header.addEventListener('click', () => { current = current === section.id ? null : section.id; apply() })
    root.append(header, panel)
    return { section, header, panel }
  })
  function apply() {
    for (const part of parts) {
      const isOpen = part.section.id === current
      part.header.setAttribute('aria-expanded', String(isOpen))
      part.panel.hidden = !isOpen
    }
  }
  apply()
}`,
}

Object.assign(domSolutions, {
  'dom-reorder-list': `
function mountReorderList(root: HTMLElement, props: { label: string; items: { id: string; label: string }[] }) {
  root.replaceChildren()
  const order = [...props.items]
  const list = document.createElement('ol')
  list.setAttribute('data-testid', 'list')
  list.setAttribute('aria-label', props.label)
  const status = document.createElement('p')
  status.setAttribute('role', 'status')
  status.setAttribute('data-testid', 'status')
  const rows = new Map<string, { li: HTMLLIElement; up: HTMLButtonElement; down: HTMLButtonElement }>()
  const apply = () => {
    order.forEach((item, index) => {
      const row = rows.get(item.id)!
      list.append(row.li)
      row.up.disabled = index === 0
      row.down.disabled = index === order.length - 1
    })
  }
  const move = (id: string, delta: number, clicked: 'up' | 'down') => {
    const from = order.findIndex(item => item.id === id)
    const to = from + delta
    if (to < 0 || to >= order.length) return
    const [item] = order.splice(from, 1)
    order.splice(to, 0, item)
    apply()
    const row = rows.get(id)!
    const target = row[clicked].disabled ? row[clicked === 'up' ? 'down' : 'up'] : row[clicked]
    target.focus()
    status.textContent = item.label + ' moved to position ' + (to + 1) + ' of ' + order.length + '.'
  }
  const button = (text: string, label: string, testid: string, onClick: () => void) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.textContent = text
    element.setAttribute('aria-label', label)
    element.setAttribute('data-testid', testid)
    element.addEventListener('click', onClick)
    return element
  }
  for (const item of props.items) {
    const li = document.createElement('li')
    const name = document.createElement('span')
    name.setAttribute('data-testid', 'name')
    name.textContent = item.label
    const up = button('Move up', 'Move ' + item.label + ' up', 'up-' + item.id, () => move(item.id, -1, 'up'))
    const down = button('Move down', 'Move ' + item.label + ' down', 'down-' + item.id, () => move(item.id, 1, 'down'))
    li.append(name, ' ', up, ' ', down)
    rows.set(item.id, { li, up, down })
  }
  apply()
  root.append(list, status)
}`,
  'dom-modal-dialog': `
function mountDialog(root: HTMLElement, props: { openLabel: string; title: string; body: string; confirmLabel: string }) {
  root.replaceChildren()
  const button = (text: string, testid: string) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.textContent = text
    element.setAttribute('data-testid', testid)
    return element
  }
  const open = button(props.openLabel, 'open')
  const result = document.createElement('p')
  result.setAttribute('data-testid', 'result')
  const dialog = document.createElement('div')
  dialog.setAttribute('role', 'dialog')
  dialog.setAttribute('aria-modal', 'true')
  dialog.setAttribute('aria-labelledby', 'dialog-title')
  dialog.setAttribute('data-testid', 'dialog')
  dialog.hidden = true
  const title = document.createElement('h2')
  title.id = 'dialog-title'
  title.setAttribute('data-testid', 'title')
  title.textContent = props.title
  const body = document.createElement('p')
  body.textContent = props.body
  const confirm = button(props.confirmLabel, 'confirm')
  const cancel = button('Cancel', 'cancel')
  dialog.append(title, body, confirm, cancel)
  const close = (message: string) => {
    dialog.hidden = true
    result.textContent = message
    open.focus()
  }
  open.addEventListener('click', () => {
    dialog.hidden = false
    confirm.focus()
  })
  confirm.addEventListener('click', () => close('Confirmed.'))
  cancel.addEventListener('click', () => close('Cancelled.'))
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close('Cancelled.')
    } else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === cancel) {
      event.preventDefault()
      confirm.focus()
    } else if (event.key === 'Tab' && event.shiftKey && document.activeElement === confirm) {
      event.preventDefault()
      cancel.focus()
    }
  })
  root.append(open, result, dialog)
}`,
  'dom-combobox': `
function mountCombobox(root: HTMLElement, props: { label: string; options: string[] }) {
  root.replaceChildren()
  const label = document.createElement('label')
  label.htmlFor = 'combo-input'
  label.textContent = props.label
  const input = document.createElement('input')
  input.id = 'combo-input'
  input.type = 'text'
  input.setAttribute('data-testid', 'input')
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-controls', 'combo-listbox')
  const listbox = document.createElement('ul')
  listbox.id = 'combo-listbox'
  listbox.setAttribute('role', 'listbox')
  listbox.setAttribute('data-testid', 'listbox')
  let matches: number[] = []
  let active = -1
  let open = false
  const render = () => {
    listbox.replaceChildren(
      ...matches.map((index, position) => {
        const option = document.createElement('li')
        option.id = 'option-' + index
        option.setAttribute('role', 'option')
        option.setAttribute('data-testid', 'option')
        option.setAttribute('aria-selected', String(position === active))
        option.textContent = props.options[index]
        return option
      }),
    )
    listbox.hidden = !open
    input.setAttribute('aria-expanded', String(open))
    if (open && active >= 0) input.setAttribute('aria-activedescendant', 'option-' + matches[active])
    else input.removeAttribute('aria-activedescendant')
  }
  const close = () => {
    open = false
    active = -1
    render()
  }
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase()
    matches = query ? props.options.flatMap((option, index) => (option.toLowerCase().startsWith(query) ? [index] : [])) : []
    active = -1
    open = matches.length > 0
    render()
  })
  input.addEventListener('keydown', event => {
    if (!open) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      active = active < 0 ? (step > 0 ? 0 : matches.length - 1) : (active + step + matches.length) % matches.length
      render()
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      input.value = props.options[matches[active]]
      close()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  })
  render()
  root.append(label, input, listbox)
}`,
})
