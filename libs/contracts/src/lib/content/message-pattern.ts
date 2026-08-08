/**
 * Content-service message patterns (the single source FE/BE/gateway share, U3).
 * Request/reply reads + admin writes use `<service>.<resource>.<action>` (MS2); the
 * emitted domain event uses `<entity>.<event>` (MS3). The `media.deleted` event consumed
 * here for reference reconciliation is owned by the media contracts.
 */

// Pages — the flexible Page → Section → Block tree.
export const CONTENT_PAGE_TREE_GET = 'content.page.tree';
/** Admin fetch of the full tree by page id — drafts + unpublished sections visible (the builder). */
export const CONTENT_PAGE_TREE_ADMIN_GET = 'content.page.tree-admin';
export const CONTENT_PAGE_LIST = 'content.page.list';
export const CONTENT_PAGE_UPSERT = 'content.page.upsert';
export const CONTENT_PAGE_DELETE = 'content.page.delete';
export const CONTENT_SECTION_UPSERT = 'content.section.upsert';
export const CONTENT_SECTION_DELETE = 'content.section.delete';
export const CONTENT_BLOCK_UPSERT = 'content.block.upsert';
export const CONTENT_BLOCK_DELETE = 'content.block.delete';

// Services collection.
export const CONTENT_SERVICE_LIST = 'content.service.list';
export const CONTENT_SERVICE_GET = 'content.service.get';
export const CONTENT_SERVICE_CREATE = 'content.service.create';
export const CONTENT_SERVICE_UPDATE = 'content.service.update';
export const CONTENT_SERVICE_DELETE = 'content.service.delete';

// Testimonials collection (no slug — list-only, addressed by id for write).
export const CONTENT_TESTIMONIAL_LIST = 'content.testimonial.list';
export const CONTENT_TESTIMONIAL_CREATE = 'content.testimonial.create';
export const CONTENT_TESTIMONIAL_UPDATE = 'content.testimonial.update';
export const CONTENT_TESTIMONIAL_DELETE = 'content.testimonial.delete';

// Team members collection (multi-word resource → hyphenated segment).
export const CONTENT_TEAM_MEMBER_LIST = 'content.team-member.list';
export const CONTENT_TEAM_MEMBER_GET = 'content.team-member.get';
export const CONTENT_TEAM_MEMBER_CREATE = 'content.team-member.create';
export const CONTENT_TEAM_MEMBER_UPDATE = 'content.team-member.update';
export const CONTENT_TEAM_MEMBER_DELETE = 'content.team-member.delete';

// Portfolio categories (translatable lookup; multi-word resource → hyphenated segment).
export const CONTENT_PORTFOLIO_CATEGORY_LIST =
  'content.portfolio-category.list';
export const CONTENT_PORTFOLIO_CATEGORY_CREATE =
  'content.portfolio-category.create';
export const CONTENT_PORTFOLIO_CATEGORY_UPDATE =
  'content.portfolio-category.update';
export const CONTENT_PORTFOLIO_CATEGORY_DELETE =
  'content.portfolio-category.delete';

// Portfolio projects (case studies). The list filters by `status` (public route forces published).
export const CONTENT_PORTFOLIO_LIST = 'content.portfolio.list';
export const CONTENT_PORTFOLIO_GET = 'content.portfolio.get';
export const CONTENT_PORTFOLIO_CREATE = 'content.portfolio.create';
export const CONTENT_PORTFOLIO_UPDATE = 'content.portfolio.update';
export const CONTENT_PORTFOLIO_DELETE = 'content.portfolio.delete';

// Blog categories (translatable lookup; multi-word resource → hyphenated segment).
export const CONTENT_BLOG_CATEGORY_LIST = 'content.blog-category.list';
export const CONTENT_BLOG_CATEGORY_CREATE = 'content.blog-category.create';
export const CONTENT_BLOG_CATEGORY_UPDATE = 'content.blog-category.update';
export const CONTENT_BLOG_CATEGORY_DELETE = 'content.blog-category.delete';

// Blog tags (translatable lookup).
export const CONTENT_BLOG_TAG_LIST = 'content.blog-tag.list';
export const CONTENT_BLOG_TAG_CREATE = 'content.blog-tag.create';
export const CONTENT_BLOG_TAG_UPDATE = 'content.blog-tag.update';
export const CONTENT_BLOG_TAG_DELETE = 'content.blog-tag.delete';

// Blog posts. The list filters by `status` (public route forces published); embeds category +
// author + tags on read, takes `categoryId`/`authorTeamMemberId`/`tagIds` on write.
export const CONTENT_BLOG_POST_LIST = 'content.blog-post.list';
export const CONTENT_BLOG_POST_GET = 'content.blog-post.get';
/** Admin fetch by id — drafts visible (the edit page; the public get is by slug, published-only). */
export const CONTENT_BLOG_POST_GET_BY_ID = 'content.blog-post.get-by-id';
export const CONTENT_BLOG_POST_CREATE = 'content.blog-post.create';
export const CONTENT_BLOG_POST_UPDATE = 'content.blog-post.update';
export const CONTENT_BLOG_POST_DELETE = 'content.blog-post.delete';

// FAQ collection (no slug — list-only, addressed by id for write).
export const CONTENT_FAQ_LIST = 'content.faq.list';
export const CONTENT_FAQ_CREATE = 'content.faq.create';
export const CONTENT_FAQ_UPDATE = 'content.faq.update';
export const CONTENT_FAQ_DELETE = 'content.faq.delete';

// Menus — keyed nav containers (the menu itself is not translatable).
export const CONTENT_MENU_GET = 'content.menu.get';
export const CONTENT_MENU_LIST = 'content.menu.list';
export const CONTENT_MENU_CREATE = 'content.menu.create';
export const CONTENT_MENU_DELETE = 'content.menu.delete';

// Menu items (multi-word resource → hyphenated segment); managed individually.
export const CONTENT_MENU_ITEM_CREATE = 'content.menu-item.create';
export const CONTENT_MENU_ITEM_UPDATE = 'content.menu-item.update';
export const CONTENT_MENU_ITEM_DELETE = 'content.menu-item.delete';

/**
 * Reorder (atomic batch): renumber `sortOrder` to match a given id order — the admin's
 * drag-and-drop on any orderable list (U21). One pattern per orderable collection; the
 * payload is the shared `reorderRequestSchema` ({ ids }). `<resource>.reorder` (MS2).
 */
export const CONTENT_SERVICE_REORDER = 'content.service.reorder';
export const CONTENT_TESTIMONIAL_REORDER = 'content.testimonial.reorder';
export const CONTENT_TEAM_MEMBER_REORDER = 'content.team-member.reorder';
export const CONTENT_FAQ_REORDER = 'content.faq.reorder';
export const CONTENT_PORTFOLIO_REORDER = 'content.portfolio.reorder';
export const CONTENT_PORTFOLIO_CATEGORY_REORDER =
  'content.portfolio-category.reorder';
export const CONTENT_BLOG_CATEGORY_REORDER = 'content.blog-category.reorder';
export const CONTENT_BLOG_TAG_REORDER = 'content.blog-tag.reorder';
// Pages-builder reorder: sections within a page, blocks within a section, pages in the admin
// list (W6); menu items within a menu/parent. The caller passes the sibling id set in order.
export const CONTENT_PAGE_REORDER = 'content.page.reorder';
export const CONTENT_SECTION_REORDER = 'content.section.reorder';
export const CONTENT_BLOCK_REORDER = 'content.block.reorder';
export const CONTENT_MENU_ITEM_REORDER = 'content.menu-item.reorder';

// Leads — the website contact / request-a-project form.
export const CONTENT_LEAD_SUBMIT = 'content.lead.submit';
export const CONTENT_LEAD_LIST = 'content.lead.list';
export const CONTENT_LEAD_UPDATE = 'content.lead.update';

/**
 * Emitted (Outbox, MS3) when a contact/request form is submitted — the notifications
 * service (P6) and CRM (later) consume it. Uses the `<entity>.<event>` convention.
 */
export const LEAD_CREATED_EVENT = 'lead.created';
