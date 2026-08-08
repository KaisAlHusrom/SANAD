import type { Locale, SectionNode } from '@sanad/contracts';
import type { RenderMode } from '../mode/render-mode.js';
import type { SectionSlots } from './section-slots.js';

/** The common props every per-`section.type` component accepts (dispatched by `SectionBlock`). */
export interface SectionComponentProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /** Website injects motion for `live`; admin omits it (faithful-static preview). */
  slots?: SectionSlots;
  /** Resolve a block's `imageMediaId` to a CDN url (image-bearing sections). */
  resolveImageUrl?: (imageMediaId: string) => string;
}
