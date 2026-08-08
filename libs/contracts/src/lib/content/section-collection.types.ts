import type { BlogPostItem } from './blog-post.types.js';
import type { FaqItem } from './faq.types.js';
import type { PortfolioProjectItem } from './portfolio.types.js';
import type { ServiceItem } from './service.types.js';
import type { TeamMemberItem } from './team-member.types.js';
import type { TestimonialItem } from './testimonial.types.js';

/**
 * The collection records a section is linked to, hydrated in-service by the content-service
 * (same DB, no RMQ — MS5) from `section.config` and attached onto `SectionNode.collection`
 * (`null` when the section links no collection — F7). A discriminated union on `collection`
 * so a shared component narrows to a concrete item type with NO `any` (U4) — the same item
 * DTOs the gateway list endpoints return (single source of truth, U3/U15). Pure shape (U16).
 *
 * The union grows one member at a time as each collection-backed section is unified into
 * `@sanad/web-ui` (services first — MS9, non-speculative). `faq`/`team` land in Phase 5 with
 * the marketing-page conversion (the `/faq` accordion + the `/about` team roster).
 */
export type HydratedCollection =
  | { collection: 'services'; items: ServiceItem[] }
  | { collection: 'portfolio'; items: PortfolioProjectItem[] }
  | { collection: 'testimonials'; items: TestimonialItem[] }
  | { collection: 'blog'; items: BlogPostItem[] }
  | { collection: 'faq'; items: FaqItem[] }
  | { collection: 'team'; items: TeamMemberItem[] };
