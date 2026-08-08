import type { SectionType } from '@sanad/contracts';
import type { ComponentType } from 'react';
import { BlogSection } from './blog/blog-section.js';
import { CtaSection } from './cta/cta-section.js';
import { FaqSection } from './faq/faq-section.js';
import { HeroSection } from './hero/hero-section.js';
import { ProcessSection } from './process/process-section.js';
import { RichTextSection } from './richtext/rich-text-section.js';
import type { SectionComponentProps } from './section-component.types.js';
import { ServicesSection } from './services/services-section.js';
import { StatsSection } from './stats/stats-section.js';
import { TeamSection } from './team/team-section.js';
import { TestimonialsSection } from './testimonials/testimonials-section.js';
import { TrustSection } from './trust/trust-section.js';
import { WorksSection } from './works/works-section.js';

export type SectionComponent = ComponentType<SectionComponentProps>;

/**
 * The per-`section.type` layout registry — completes the `SectionBlock` `// P8` seam. A type with an
 * entry renders its bespoke shared component (the SAME one the website uses live); a type without one
 * falls back to the generic eyebrow/title/subtitle + blocks body. Grown type-by-type (Phase 2).
 */
export const SECTION_REGISTRY: Partial<Record<SectionType, SectionComponent>> =
  {
    hero: HeroSection,
    stats: StatsSection,
    process: ProcessSection,
    services: ServicesSection,
    trust: TrustSection,
    work: WorksSection,
    testimonials: TestimonialsSection,
    blog: BlogSection,
    cta: CtaSection,
    richtext: RichTextSection,
    faq: FaqSection,
    team: TeamSection,
  };

export function sectionComponentFor(
  type: SectionType,
): SectionComponent | undefined {
  return SECTION_REGISTRY[type];
}
