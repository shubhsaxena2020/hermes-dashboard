import { forwardRef } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'oracle', label: 'VPS' },
] as const

export type SectionKey = (typeof NAV_ITEMS)[number]['key']

interface SidebarProps {
  section: SectionKey
  onSectionChange: (key: SectionKey) => void
  theme: string | undefined
  onThemeToggle: () => void
  version: { commit: string | null; date: string | null } | null
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar = forwardRef<HTMLButtonElement, SidebarProps>(
  function Sidebar({ section, onSectionChange, theme, onThemeToggle, version, isOpen, onClose }, closeButtonRef) {
    return (
      <nav
        className={cn(
          'w-48 shrink-0 border-r bg-card py-5 flex flex-col',
          // Mobile: fixed overlay, hidden by default
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 -translate-x-full',
          // Mobile: show when isOpen
          isOpen && 'translate-x-0',
          // Desktop: sticky sidebar, always visible
          'md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-none',
        )}
        aria-label="Main navigation"
      >
        <h1 className="px-5 text-sm font-semibold mb-5">VPS Control</h1>
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => {
              onSectionChange(item.key)
              onClose?.()
            }}
            className={cn(
              'px-5 py-2.5 text-sm cursor-pointer border-l-2 border-transparent text-left text-muted-foreground hover:bg-accent',
              section === item.key && 'border-primary text-foreground bg-accent',
            )}
            aria-current={section === item.key ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onThemeToggle}
          className="px-5 py-2.5 text-sm cursor-pointer text-muted-foreground hover:bg-accent flex items-center gap-2 mt-auto"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {version?.commit && (
          <div className="px-5 text-xs text-muted-foreground" title={version.date || undefined}>
            {version.commit}
          </div>
        )}
      </nav>
    )
  },
)
