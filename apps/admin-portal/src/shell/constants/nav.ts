import {
  BarChart3,
  FileText,
  Image,
  Inbox,
  LayoutDashboard,
  Plug,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** A sidebar navigation entry; `labelKey` resolves in the `common` i18n namespace. */
export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  /** Permission required to see the entry (omitted = always visible). */
  permission?: string;
}

/** Admin nav inventory (design-spec §4). */
export const ADMIN_NAV: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  {
    to: '/content',
    labelKey: 'nav.content',
    icon: FileText,
    permission: 'content.read',
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    permission: 'settings.manage',
  },
  {
    to: '/settings/tracking',
    labelKey: 'nav.tracking',
    icon: BarChart3,
    permission: 'settings.manage',
  },
  {
    to: '/settings/integrations',
    labelKey: 'nav.integrations',
    icon: Plug,
    permission: 'settings.secrets.read',
  },
  {
    to: '/media',
    labelKey: 'nav.media',
    icon: Image,
    permission: 'media.read',
  },
  {
    to: '/leads',
    labelKey: 'nav.leads',
    icon: Inbox,
    permission: 'content.manage',
  },
  {
    to: '/users',
    labelKey: 'nav.users',
    icon: Users,
    permission: 'identity.users.read',
  },
];
