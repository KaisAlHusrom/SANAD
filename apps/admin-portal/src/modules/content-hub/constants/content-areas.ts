import {
  BookOpen,
  Briefcase,
  FolderKanban,
  HelpCircle,
  LayoutTemplate,
  Menu,
  MessageSquareQuote,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** One content domain surfaced as a card on the content hub (`/content`). */
export interface ContentArea {
  to: string;
  /** i18n key under the `contentHub.areas` tree (title + desc). */
  key: string;
  icon: LucideIcon;
}

/**
 * The content domains an admin manages, surfaced as a card grid on `/content` (the nav/IA
 * decision — one sidebar entry, a hub page routing to each domain). Only **built** areas are
 * listed; later P7.C stages append portfolio/blog/pages/menus as they land (no dead links).
 */
export const CONTENT_AREAS: readonly ContentArea[] = [
  { to: '/content/pages', key: 'pages', icon: LayoutTemplate },
  { to: '/content/services', key: 'services', icon: Briefcase },
  { to: '/content/portfolio', key: 'portfolio', icon: FolderKanban },
  { to: '/content/blog', key: 'blog', icon: BookOpen },
  {
    to: '/content/testimonials',
    key: 'testimonials',
    icon: MessageSquareQuote,
  },
  { to: '/content/faqs', key: 'faqs', icon: HelpCircle },
  { to: '/content/team', key: 'team', icon: Users },
  { to: '/content/menus', key: 'menus', icon: Menu },
];
