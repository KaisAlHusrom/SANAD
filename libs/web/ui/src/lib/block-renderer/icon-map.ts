import {
  Award,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Gauge,
  Layers,
  LifeBuoy,
  type LucideIcon,
  MessageSquare,
  Rocket,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

/**
 * Maps a block's `icon` data key (a lucide component name stored by the admin) to its component.
 * A curated, browser-safe subset — the keys the content team is offered for `step`/`feature`
 * blocks — with `Sparkles` as the fallback so an unknown key still renders something.
 */
const ICONS: Record<string, LucideIcon> = {
  Award,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Gauge,
  Layers,
  LifeBuoy,
  MessageSquare,
  Rocket,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
};

const FALLBACK_ICON: LucideIcon = Sparkles;

/** Resolve an icon key to a lucide component, falling back when the key is empty/unknown. */
export function resolveIcon(key: string): LucideIcon {
  return ICONS[key] ?? FALLBACK_ICON;
}
