import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DomainOverview } from '@/components/DomainOverview'
import { OracleSection } from '@/components/OracleSection'
import { SimplePanel } from '@/components/SimplePanel'
import { NAV_BY_KEY, type SectionKey } from '@/lib/nav'
import type { StatusResponse } from '@/lib/api'

export function SectionRenderer({
  section,
  data,
  onNavigate,
}: {
  section: SectionKey
  data: StatusResponse
  onNavigate: (key: SectionKey) => void
}) {
  const label = NAV_BY_KEY[section]?.label ?? section

  let body: React.ReactNode
  switch (section) {
    case 'domains':
      body = <DomainOverview data={data} onNavigate={onNavigate} />
      break
    case 'server':
      body = <OracleSection oracle={data.oracle} refresh={() => {}} />
      break
    case 'statistics':
    case 'logs':
    case 'profile':
    case 'security':
    case 'subscription':
    case 'databases':
    case 'git':
    case 'backup':
    case 'files':
    case 'mail':
      body = <SimplePanel section={section} externalHref={NAV_BY_KEY[section]?.href} />
      break
    default:
      body = <DomainOverview data={data} onNavigate={onNavigate} />
  }

  return (
    <ErrorBoundary key={section} sectionLabel={label}>
      {body}
    </ErrorBoundary>
  )
}
