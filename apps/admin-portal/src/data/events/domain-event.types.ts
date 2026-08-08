/**
 * The typed client event bus payloads (W4/F5). Mutations publish a domain event in
 * `onQueryStarted` after success; cross-module reads subscribe and invalidate. Later
 * modules extend this union (e.g. `content.updated`, `lead.updated`, `media.deleted`,
 * `branding.updated`) — one discriminated union keeps publish/subscribe type-safe.
 */
export type DomainEvent =
  | { type: 'auth.loggedIn'; userId: string }
  | { type: 'auth.loggedOut' }
  | { type: 'settings.branding.updated' }
  | { type: 'settings.updated' }
  | { type: 'media.asset.uploaded'; assetId: string }
  | { type: 'media.asset.deleted'; assetId: string }
  | { type: 'media.folder.created'; folderId: string }
  /** Renamed, re-parented or deleted — the tree must be re-read, wherever it is rendered. */
  | { type: 'media.folder.changed'; folderId: string }
  /** Assets moved into `folderId` (null = the root) — both the tree counts and lists shift. */
  | { type: 'media.assets.moved'; folderId: string | null }
  | { type: 'content.service.changed' }
  | { type: 'content.testimonial.changed' }
  | { type: 'content.faq.changed' }
  | { type: 'content.team-member.changed' }
  | { type: 'content.portfolio.changed' }
  | { type: 'content.portfolio-category.changed' }
  | { type: 'content.blog.changed' }
  | { type: 'content.blog-category.changed' }
  | { type: 'content.blog-tag.changed' }
  | { type: 'content.page.changed' }
  | { type: 'content.menu.changed' }
  | { type: 'lead.updated' }
  | { type: 'notification.read' }
  | { type: 'identity.user.changed' };

export type DomainEventType = DomainEvent['type'];

/** Narrow a `DomainEvent` to the variant matching a given `type`. */
export type DomainEventOf<T extends DomainEventType> = Extract<
  DomainEvent,
  { type: T }
>;
