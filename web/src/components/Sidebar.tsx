import { forwardRef } from 'react'
import { Sun, Moon, ChevronRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_GROUPS, type SectionKey } from '@/lib/nav'

export interface SidebarProps {
  section: SectionKey
  onSectionChange: (key: SectionKey) => void
  theme: string | undefined
  onThemeToggle: () => void
  version: { commit: string | null; date: string | null } | null
  isOpen?: boolean
  onClose?: () => void
  /** Count of down containers, surfaced as a badge on the Server item. */
  downCount?: number
}

export const Sidebar = forwardRef<HTMLButtonElement, SidebarProps>(function Sidebar(
  { section, onSectionChange, theme, onThemeToggle, version, isOpen, onClose, downCount },
  closeButtonRef,
) {
  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'w-60 shrink-0 flex flex-col bg-sidebar text-sidebar-foreground',
        // Mobile: fixed slide-in overlay
        'fixed inset-y-0 left-0 z-50 transition-transform duration-200 -translate-x-full',
        isOpen && 'translate-x-0',
        // Desktop: sticky rail, always visible
        'md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-none',
      )}
    >
      <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border">
        <div className="size-7 rounded-md bg-brand flex items-center justify-center text-brand-foreground font-bold text-sm">
          H
        </div>
        <span className="text-base font-semibold text-white tracking-tight">Hosting</span>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-2">
            <h2 className="px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              {group.title}
            </h2>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = section === item.key && !item.href
                const isExternal = !!item.href
                return (
                  <li key={item.key}>
                    {isExternal ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between gap-2 px-5 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="nav-item-icon size-[18px] text-sidebar-muted group-hover:text-sidebar-foreground" aria-hidden="true" />
                          {item.label}
                        </span>
                        <ExternalLink className="size-3 text-sidebar-muted" aria-hidden="true" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSectionChange(item.key)
                          onClose?.()
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 px-5 py-2 text-sm text-left text-sidebar-foreground hover:bg-sidebar-accent',
                          active && 'nav-item-active',
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              'nav-item-icon size-[18px]',
                              active ? 'text-sidebar-ring' : 'text-sidebar-muted',
                            )}
                            aria-hidden="true"
                          />
                          {item.label}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {item.key === 'server' && (downCount ?? 0) > 0 && (
                            <span
                              className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground"
                              aria-label={`${downCount} container${downCount !== 1 ? 's' : ''} down`}
                            >
                              {downCount}
                            </span>
                          )}
                          <ChevronRight
                            className={cn(
                              'size-3 transition-opacity',
                              active ? 'opacity-100 text-sidebar-ring' : 'opacity-0',
                            )}
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onThemeToggle}
        className="flex items-center gap-3 border-t border-sidebar-border px-5 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun className="size-[18px] text-sidebar-muted" aria-hidden="true" /> : <Moon className="size-[18px] text-sidebar-muted" aria-hidden="true" />}
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>
      {version?.commit && (
        <div className="px-5 pb-3 text-xs text-sidebar-muted" title={version.commit || undefined}>
          build {version.commit?.slice(0, 7)}
        </div>
      )}
    </nav>
  )
})
