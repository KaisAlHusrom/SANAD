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
  | { type: 'media.asset.uploaded'; assetId: string }
  | { type: 'media.asset.deleted'; assetId: string };

export type DomainEventType = DomainEvent['type'];

/** Narrow a `DomainEvent` to the variant matching a given `type`. */
export type DomainEventOf<T extends DomainEventType> = Extract<
  DomainEvent,
  { type: T }
>;
