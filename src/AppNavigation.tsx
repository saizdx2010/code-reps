import { Icon } from './Icon'
import { Input } from './Input'
import { useLayoutEffect, useState } from 'react'
import { SearchDrawer } from './Experience'
import { useSessionPreference } from './useSessionPreference'
import { navigationArea, navigationSections, sectionView } from './ui-navigation'
import type { View } from './ui-navigation'
import { Tooltip } from './Tooltip'
import { flushSync } from 'react-dom'
import { reducedMotion } from './ui-motion'
import type { ReactNode } from 'react'

/**
 * The dark-mode toggle crossfades where the browser supports view transitions; otherwise it applies immediately.
 * Colour-scheme radios apply immediately so their checked state never lags the click.
 */
function crossfade(update: () => void) {
  const start = (document as Document & { startViewTransition?: (callback: () => void) => unknown }).startViewTransition
  if (!start || reducedMotion()) { update(); return }
  start.call(document, () => flushSync(update))
}

type Props = {
  view: View
  profileName: string
  saveState: string
  onNavigate: (view: View) => void
  onManageProfiles?: () => void
  onCommands: () => void
  /** A milestone notice shown inside the section bar, so it stays in the page frame and does not move the heading. */
  notice?: ReactNode
}

type Palette = 'sage' | 'ocean' | 'plum'
const mainAreas = [
  { area: 'trail', label: 'Trail', view: 'home' },
  { area: 'library', label: 'Library', view: 'catalog' },
  { area: 'progress', label: 'Progress', view: 'progress' },
] as const
const paletteLabels: Record<Palette, string> = { sage: 'Sage', ocean: 'Ocean', plum: 'Plum' }
const favicon = (palette: Palette) => palette === 'sage' ? '/favicon.svg' : `/favicon-${palette}.svg`

export function AppNavigation({ view, profileName, saveState, onNavigate, onManageProfiles, onCommands, notice }: Props) {
  const root = document.documentElement
  const [theme, setTheme] = useSessionPreference<'light' | 'dark'>('theme', root.dataset.theme === 'dark' ? 'dark' : 'light', 'device')
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const [palette, setPalette] = useSessionPreference<Palette>('palette', (root.dataset.palette as Palette) || 'sage', 'device')
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  useLayoutEffect(() => {
    document.documentElement.dataset.palette = palette
    document.querySelector<HTMLLinkElement>('link[rel=icon]')?.setAttribute('href', favicon(palette))
  }, [palette])
  const area = navigationArea(view)
  const workspace = view === 'workspace'
  const mainNavigation = <nav className="top-nav" aria-label="Main navigation">
    {mainAreas.map(item => <button
      key={item.area} type="button" aria-current={area === item.area ? 'page' : undefined} onClick={() => onNavigate(item.view)}
    >{item.label}</button>)}
  </nav>
  return <>
    <a className="skip-link" href="#main-content" onClick={event => {
      event.preventDefault()
      document.querySelector<HTMLElement>('main h1')?.focus()
    }}>Skip to content</a>
    <header className={`topbar ${workspace ? 'workspace-topbar' : ''}`}>
      <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="Code Reps home">
        <img className="brand-mark" src={favicon(palette)} alt="" /><span>code reps</span>
      </button>
      {!workspace && mainNavigation}
      <div className="topbar-right">
        <button className="theme-trigger" type="button" aria-label="Appearance" aria-haspopup="dialog" onClick={() => setAppearanceOpen(true)}>
          <span aria-hidden="true" className="theme-symbol" />
        </button>
        {workspace && <details className="site-menu" onKeyDown={event => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          event.currentTarget.open = false
          event.currentTarget.querySelector('summary')?.focus()
        }}><summary>Navigate</summary>{mainNavigation}</details>}
        <button className="commands-trigger" type="button" onClick={onCommands} aria-label="Open commands and keyboard shortcuts">
          <Icon name="search" />
          <span className="commands-label">Search</span> <kbd>⌘ / Ctrl K</kbd>
        </button>
        {onManageProfiles && <Tooltip text={`Local profile: ${profileName}`}>
          <button className="profile-trigger" type="button" aria-label="Manage profiles" onClick={onManageProfiles}>
            <span>{profileName}</span>
            <Icon name="chevron" />
          </button>
        </Tooltip>}
      </div>
    </header>
    {appearanceOpen && <SearchDrawer title="Appearance" className="appearance-dialog" onClose={() => setAppearanceOpen(false)}>
      <p>Choose the colors that feel right for your practice.</p>
      <button
        className="appearance-mode" type="button" aria-label="Dark mode" aria-pressed={theme === 'dark'}
        onClick={() => crossfade(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
      >
        <span>Dark mode</span>
        <span>{theme === 'dark' ? 'On' : 'Off'}</span>
      </button>
      <fieldset className="palette-options">
        <legend>Color scheme</legend>
        {(['sage', 'ocean', 'plum'] as const).map(option => <label key={option}>
          <Input type="radio" name="colour-scheme" value={option} checked={palette === option} onChange={() => setPalette(option)} />
          <span className={`palette-swatch swatch-${option}`} aria-hidden="true" />
          <span>{paletteLabels[option]}</span>
          {palette === option && <Icon name="check" />}
        </label>)}
      </fieldset>
    </SearchDrawer>}
    {!workspace && <div className="section-bar">
      <nav className="section-nav" aria-label={`${area === 'library' ? 'Library' : area === 'progress' ? 'Progress' : 'Trail'} pages`}>
        {navigationSections[area].map(item => <button
          key={item.view} type="button" aria-current={sectionView(view) === item.view ? 'page' : undefined}
          onClick={() => onNavigate(item.view)}
        >
          {item.label}
        </button>)}
      </nav>
      {notice}
      <span className={`save-status${saveState === 'Saving…' ? ' is-loading' : ''}`} role="status">{saveState}</span>
    </div>}
  </>
}
