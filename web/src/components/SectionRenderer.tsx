import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DomainOverview } from '@/components/DomainOverview'
import { OracleSection } from '@/components/OracleSection'
import { SimplePanel } from '@/components/SimplePanel'
import { SslPanel, GitPanel, FilesPanel, BackupPanel, DatabasesPanel, StatisticsPanel } from '@/components/ServicePanels'
import { NAV_BY_KEY, type SectionKey } from '@/lib/nav'
import type { StatusResponse } from '@/lib/api'
import { useDomains } from '@/hooks/useDomains'

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
  const { data: domainsData } = useDomains()

  let body: React.ReactNode
  switch (section) {
    case 'domains':
      body = (
        <DomainOverview
          data={data}
          domains={domainsData?.domains ?? []}
          onNavigate={onNavigate}
        />
      )
      break
    case 'server':
      body = <OracleSection oracle={data.oracle} refresh={() => {}} />
      break
    case 'statistics':
      body = <StatisticsPanel data={data} />
      break
    case 'logs':
    case 'profile':
    case 'security':
    case 'subscription':
    case 'mail':
      body = <SimplePanel section={section} externalHref={NAV_BY_KEY[section]?.href} />
      break
    case 'databases':
      body = <DatabasesPanel />
      break
    case 'git':
      body = <GitPanel />
      break
    case 'backup':
      body = <BackupPanel />
      break
    case 'files':
      body = <FilesPanel />
      break
    case 'ssl':
      body = <SslPanel data={data} />
      break
    default:
      body = (
        <DomainOverview
          data={data}
          domains={domainsData?.domains ?? []}
          onNavigate={onNavigate}
        />
      )
  }

  return (
    <ErrorBoundary key={section} sectionLabel={label}>
      {body}
    </ErrorBoundary>
  )
}
