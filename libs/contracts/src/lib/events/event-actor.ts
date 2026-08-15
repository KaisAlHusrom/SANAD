/**
 * Every surface that can produce or consume a domain event (U27c). A closed union, never a
 * free string, so a catalog entry can never name a service that does not exist.
 * `client-portal` joins in P8.21.
 */
export const EVENT_ACTORS = [
  'api-gateway',
  'identity-service',
  'settings-service',
  'media-service',
  'content-service',
  'notifications-service',
  'admin-portal',
  'website',
] as const;

export type EventActor = (typeof EVENT_ACTORS)[number];
