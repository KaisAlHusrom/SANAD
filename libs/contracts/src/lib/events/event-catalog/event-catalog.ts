import {
  leadCreatedEvent,
  mediaDeletedEvent,
  settingsChangedEvent,
  userRegisteredEvent,
} from '../broker/index.js';
import {
  authLoggedInEvent,
  authLoggedOutEvent,
  contentBlogCategoryChangedEvent,
  contentBlogChangedEvent,
  contentBlogTagChangedEvent,
  contentFaqChangedEvent,
  contentMenuChangedEvent,
  contentPageChangedEvent,
  contentPortfolioCategoryChangedEvent,
  contentPortfolioChangedEvent,
  contentServiceChangedEvent,
  contentTeamMemberChangedEvent,
  contentTestimonialChangedEvent,
  identityUserChangedEvent,
  leadUpdatedEvent,
  mediaAssetDeletedEvent,
  mediaAssetUploadedEvent,
  mediaAssetsMovedEvent,
  mediaFolderChangedEvent,
  mediaFolderCreatedEvent,
  notificationReadEvent,
  settingsUpdatedEvent,
} from '../client-bus/index.js';
import { defineCatalog } from '../define-catalog/index.js';

/**
 * THE EVENT CATALOG (U27c) — every event this platform emits, on either bus, declared once with
 * its producer and its consumers. Keyed by wire name: a duplicate key does not compile, and
 * `defineCatalog` proves each key equals its entry's own `name`. Adding an event means adding a
 * `*.event.ts` and a line here — the publish paths derive their allowed names from this map, so
 * an un-catalogued event is a typecheck failure rather than a runtime surprise.
 */
export const EVENT_CATALOG = defineCatalog({
  // ---- broker: RabbitMQ, always through the transactional Outbox (MS3) ----
  'lead.created': leadCreatedEvent,
  'media.deleted': mediaDeletedEvent,
  'settings.changed': settingsChangedEvent,
  'user.registered': userRegisteredEvent,
  // ---- admin-portal client bus (W4) ----
  'auth.loggedIn': authLoggedInEvent,
  'auth.loggedOut': authLoggedOutEvent,
  'settings.updated': settingsUpdatedEvent,
  'media.asset.uploaded': mediaAssetUploadedEvent,
  'media.asset.deleted': mediaAssetDeletedEvent,
  'media.folder.created': mediaFolderCreatedEvent,
  'media.folder.changed': mediaFolderChangedEvent,
  'media.assets.moved': mediaAssetsMovedEvent,
  'content.service.changed': contentServiceChangedEvent,
  'content.blog.changed': contentBlogChangedEvent,
  'content.testimonial.changed': contentTestimonialChangedEvent,
  'content.faq.changed': contentFaqChangedEvent,
  'content.team-member.changed': contentTeamMemberChangedEvent,
  'content.portfolio.changed': contentPortfolioChangedEvent,
  'content.portfolio-category.changed': contentPortfolioCategoryChangedEvent,
  'content.blog-category.changed': contentBlogCategoryChangedEvent,
  'content.blog-tag.changed': contentBlogTagChangedEvent,
  'content.page.changed': contentPageChangedEvent,
  'content.menu.changed': contentMenuChangedEvent,
  'lead.updated': leadUpdatedEvent,
  'notification.read': notificationReadEvent,
  'identity.user.changed': identityUserChangedEvent,
});
