import { navigationArea, navigationSections } from './ui-navigation'
import type { View } from './ui-navigation'
import { Tooltip } from './Tooltip'

type Props = {
  view: View
  profileName: string
  saveState: string
  onNavigate: (view: View) => void
  onManageProfiles?: () => void
  onCommands: () => void
}

export function AppNavigation({ view, profileName, saveState, onNavigate, onManageProfiles, onCommands }: Props) {
  const area = navigationArea(view)
  const workspace = view === 'workspace'
  const mainNavigation = <nav className="top-nav" aria-label="Main navigation">
    {([{ area: 'home', label: 'Home', view: 'home' }, { area: 'practice', label: 'Practice', view: 'catalog' }, { area: 'learn', label: 'Learn', view: 'knowledge' }, { area: 'progress', label: 'Progress', view: 'progress' }] as const).map(item =>
      <button key={item.area} type="button" aria-current={area === item.area ? 'page' : undefined} onClick={() => onNavigate(item.view)}>{item.label}</button>)}
  </nav>
  return <>
    <a className="skip-link" href="#main-content" onClick={event => {
      event.preventDefault()
      document.querySelector<HTMLElement>('main h1')?.focus()
    }}>Skip to content</a>
    <header className={`topbar ${workspace ? 'workspace-topbar' : ''}`}>
      <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="Code Reps home">
        <img className="brand-mark" src="/favicon.svg" alt="" /><span>code reps</span>
      </button>
      {!workspace && mainNavigation}
      <div className="topbar-right">
        {workspace && <details className="site-menu" onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() }
        }}><summary>Navigate</summary>{mainNavigation}</details>}
        <button className="commands-trigger" type="button" onClick={onCommands} aria-label="Open commands and keyboard shortcuts">Search <kbd>⌘ / Ctrl K</kbd></button>
        {onManageProfiles && <Tooltip text={`Local profile: ${profileName}`}><button className="profile-trigger" type="button" aria-label="Manage profiles" onClick={onManageProfiles}><span>{profileName}</span><span aria-hidden="true">⌄</span></button></Tooltip>}
      </div>
    </header>
    {!workspace && <div className="section-bar">
      <nav className="section-nav" aria-label={`${area === 'learn' ? 'Learning' : area === 'practice' ? 'Practice' : area === 'progress' ? 'Progress' : 'Home'} pages`}>
        {navigationSections[area].map(item => <button key={item.view} type="button" aria-current={view === item.view || view === 'learn' && item.view === 'knowledge' ? 'page' : undefined} onClick={() => onNavigate(item.view)}>{item.label}</button>)}
      </nav>
      <span className="save-status" role="status">{saveState}</span>
    </div>}
  </>
}
