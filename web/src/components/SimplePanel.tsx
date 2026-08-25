import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { NAV_BY_KEY, type SectionKey } from '@/lib/nav'

/**
 * Honest placeholder panel for nav items that don't have a first-class screen
 * in this dashboard yet (Databases, Git, Backup, File Manager, Logs, Profile,
 * Security, Subscription). Plesk-style hosting panels link these out to the
 * real tool rather than showing a broken stub, so we mirror that: show what
 * the panel is, what it would contain, and — when an external URL is known —
 * a direct link.
 */
export function SimplePanel({
  section,
  externalHref,
}: {
  section: SectionKey
  externalHref?: string
}) {
  const item = NAV_BY_KEY[section]
  const Icon = item.icon
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-foreground">{item.label}</h1>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="size-10 rounded-lg bg-brand/10 flex items-center justify-center">
            <Icon className="size-5 text-brand" aria-hidden="true" />
          </div>
          <CardTitle className="text-base">{item.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{item.hint ?? 'This area is managed through the hosting stack.'}</p>
          {externalHref ? (
            <a
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              href={externalHref}
              target="_blank"
              rel="noreferrer"
            >
              Open {item.label}
              <ExternalLink className="ml-1.5 size-3.5" aria-hidden="true" />
            </a>
          ) : (
            <p className="text-xs">
              No standalone console is wired into this dashboard yet. The Server section
              provides live control over the underlying services.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
