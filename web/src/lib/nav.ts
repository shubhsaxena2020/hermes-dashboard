import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import {
  Globe,
  Database,
  GitBranch,
  ShieldCheck,
  Cloud,
  FolderOpen,
  Mail,
  Server,
  BarChart3,
  ScrollText,
  KeyRound,
  User,
  CreditCard,
} from 'lucide-react'

export type SectionKey =
  | 'domains'
  | 'databases'
  | 'git'
  | 'ssl'
  | 'backup'
  | 'files'
  | 'mail'
  | 'server'
  | 'statistics'
  | 'logs'
  | 'profile'
  | 'security'
  | 'subscription'

export interface NavItem {
  key: SectionKey
  label: string
  icon: ComponentType<LucideProps>
  /** External link (opened in a new tab) — for items we don't host here. */
  href?: string
  /** Short helper text shown under the label in the domain overview quick-action grid. */
  hint?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

// Maps each nav item to the screen it should show. `panel` items render an
// honest "handled elsewhere / coming soon" panel instead of a broken stub.
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Hosting Services',
    items: [
      { key: 'domains', label: 'Domains', icon: Globe, hint: 'Manage your domain names and DNS' },
      { key: 'databases', label: 'Databases', icon: Database, hint: 'MySQL, MariaDB & PostgreSQL' },
      { key: 'git', label: 'Git', icon: GitBranch, hint: 'Deploy from a repository' },
      { key: 'ssl', label: 'SSL/TLS', icon: ShieldCheck, hint: 'Manage certificates' },
      { key: 'backup', label: 'Backup Manager', icon: Cloud, hint: 'Create and schedule backups' },
      { key: 'files', label: 'File Manager', icon: FolderOpen, hint: 'Browse website files' },
      { key: 'mail', label: 'Mail', icon: Mail, href: 'https://leads.shubhbuilds.com', hint: 'Email accounts' },
    ],
  },
  {
    title: 'Server Management',
    items: [
      { key: 'server', label: 'Server', icon: Server, hint: 'Containers, hardware & logs' },
      { key: 'statistics', label: 'Statistics', icon: BarChart3, hint: 'CPU, memory, disk & uptime' },
      { key: 'logs', label: 'Logs', icon: ScrollText, hint: 'System & access logs' },
    ],
  },
  {
    title: 'My Profile',
    items: [
      { key: 'profile', label: 'Profile', icon: User, hint: 'Your account details' },
      { key: 'security', label: 'Security', icon: KeyRound, hint: 'Password & 2FA' },
      { key: 'subscription', label: 'Subscription', icon: CreditCard, hint: 'Plan & renewal' },
    ],
  },
]

// Flat lookup for resolving a key quickly.
export const NAV_BY_KEY: Record<SectionKey, NavItem> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items).map((i) => [i.key, i]),
) as Record<SectionKey, NavItem>

// Items that open elsewhere (real, reachable tools).
export const EXTERNAL_ITEMS = new Set<SectionKey>(
  NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.href).map((i) => i.key),
)
