export const domSolutions = {
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
}
