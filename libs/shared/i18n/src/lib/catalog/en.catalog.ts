import type { MessageKey } from './ar.catalog.js';

/**
 * The English catalog. Typed as `Record<MessageKey, string>` against the Arabic source of
 * truth, so a key added there and forgotten here fails the build — parity is a compile
 * error first and a test second (U8/U24).
 */
export const EN_CATALOG: Record<MessageKey, string> = {
  // ── common ────────────────────────────────────────────────────────────────────────
  'common.ok': 'OK',
  'common.created': 'Created successfully',
  'common.updated': 'Saved successfully',
  'common.deleted': 'Deleted successfully',
  'common.notFound': 'The requested resource was not found.',
  'common.internalError':
    'An unexpected server error occurred. Please try again.',
  'common.requestFailed': 'The request could not be completed.',
  'common.upstreamError':
    'The service is unavailable right now. Please try again shortly.',
  'common.duplicate': 'This item already exists.',
  'common.relatedConstraint':
    "This item is linked to others and can't be changed that way.",
  'common.requiredFieldMissing': 'A required field is missing.',
  'common.checkConstraint': 'A value failed a validation constraint.',

  // ── validation ────────────────────────────────────────────────────────────────────
  'validation.failed': 'Please check the fields below.',
  'validation.required': 'This field is required.',
  'validation.invalidType': "This field's value is not valid.",
  'validation.tooSmall': 'The value is below the allowed minimum.',
  'validation.tooBig': 'The value is above the allowed maximum.',
  'validation.invalidString': "This field's format is not valid.",
  'validation.invalidEnum': 'That option is not allowed.',
  'validation.emptyUpdate': 'Nothing was changed — update at least one field.',
  'validation.slug':
    'Use lowercase letters, numbers and hyphens only (e.g. about-us).',
  'validation.hexColor': 'Enter a hex colour such as #1A2B3C.',
  'validation.invalidPhone':
    'Enter a valid number with its country code, e.g. +966 50 123 4567.',
  'validation.unknownField': 'Unknown field.',

  // ── auth ──────────────────────────────────────────────────────────────────────────
  'auth.noIdentity':
    'Your identity could not be verified. Please sign in again.',
  'auth.forbidden': "You don't have permission to do that.",
  'auth.missingToken': 'You need to sign in to access this.',
  'auth.invalidToken': 'Your session has expired. Please sign in again.',
  'auth.invalidCredentials': 'Incorrect email or password.',
  'auth.invalidRefreshToken': 'Your session has expired. Please sign in again.',

  // ── identity ──────────────────────────────────────────────────────────────────────
  'identity.userNotFound': 'User “{id}” was not found.',
  'identity.emailConflict': 'The email “{email}” is already in use.',
  'identity.roleNotFound': 'The role “{key}” was not found.',

  // ── content ───────────────────────────────────────────────────────────────────────
  'content.notFound': '“{idOrSlug}” was not found.',
  'content.notFound.page': 'Page “{idOrSlug}” was not found.',
  'content.notFound.section': 'Section “{idOrSlug}” was not found.',
  'content.notFound.block': 'Block “{idOrSlug}” was not found.',
  'content.notFound.blogPost': 'Blog post “{idOrSlug}” was not found.',
  'content.notFound.blogCategory': 'Blog category “{idOrSlug}” was not found.',
  'content.notFound.blogTag': 'Blog tag “{idOrSlug}” was not found.',
  'content.notFound.service': 'Service “{idOrSlug}” was not found.',
  'content.notFound.portfolioProject': 'Project “{idOrSlug}” was not found.',
  'content.notFound.portfolioCategory':
    'Portfolio category “{idOrSlug}” was not found.',
  'content.notFound.teamMember': 'Team member “{idOrSlug}” was not found.',
  'content.notFound.testimonial': 'Testimonial “{idOrSlug}” was not found.',
  'content.notFound.faq': 'FAQ “{idOrSlug}” was not found.',
  'content.notFound.menu': 'Menu “{idOrSlug}” was not found.',
  'content.notFound.menuItem': 'Menu item “{idOrSlug}” was not found.',
  'content.notFound.lead': 'Lead “{idOrSlug}” was not found.',
  'content.slugConflict': 'The slug “{slug}” is already in use.',

  // ── media ─────────────────────────────────────────────────────────────────────────
  'media.notFound': 'Media asset “{id}” was not found.',
  'media.invalidIds': 'The media ids provided are not valid.',
  'media.storageUnavailable':
    'Media storage is not configured on this deployment.',
  'media.upload.typeNotAllowed':
    'The file type “{contentType}” is not supported.',
  'media.upload.tooLarge': 'The file exceeds the {maxMb} MB limit.',
  'media.cors.unsupported':
    'CORS inspection is not supported by this provider.',
  'media.cors.cannotCheck':
    "The bucket's CORS configuration could not be read — these credentials aren't allowed to.",
  'media.cors.applyFailed':
    'The CORS policy could not be applied to the bucket.',
  'media.cors.unconfigured':
    'Storage is not configured, so there is nothing to check.',
  'media.test.reachable': 'Connected — bucket “{bucket}” is reachable.',
  'media.test.signedOnlyPublicUrl':
    'Bucket “{bucket}” is reachable, but the public URL points at the S3 API endpoint — images would fail to load. Use your r2.dev public URL or a custom domain.',
  'media.test.missingFields':
    'Required fields are missing — fill them in and save first.',
  'media.test.failed': 'Could not connect to the storage provider.',
  'media.folder.notFound': 'Folder “{id}” was not found.',
  'media.folder.duplicateName':
    'A folder called “{name}” already exists here. Pick another name.',
  'media.folder.cycle':
    'A folder cannot be moved inside itself or one of its own subfolders.',
  'media.folder.notEmpty':
    '“{name}” still contains {assets} file(s) and {folders} subfolder(s). Empty it, or choose to move its contents up one level.',
  'media.move.tooMany': 'Too many files selected to move at once.',

  // ── notifications ─────────────────────────────────────────────────────────────────
  'notifications.notFound': 'Notification not found.',
  'notifications.leadAlert.subject': 'New lead: {name}',
  'notifications.leadAlert.subjectTyped': 'New lead: {name} ({projectType})',
  'notifications.leadAlert.heading': 'New lead — {name}',
  'notifications.leadAlert.name': 'Name',
  'notifications.leadAlert.email': 'Email',
  'notifications.leadAlert.phone': 'Phone',
  'notifications.leadAlert.company': 'Company',
  'notifications.leadAlert.projectType': 'Project type',
  'notifications.leadAlert.source': 'Source',
  'notifications.leadAlert.locale': 'Language',
  'notifications.leadAlert.message': 'Message',
  'notifications.leadRepeat.subject': 'Wrote again: {name} (time {count})',
  'notifications.leadRepeat.subjectUncounted': 'Wrote again: {name}',
  'notifications.leadRepeat.heading': '{name} reached out again',
  'notifications.leadRepeat.lead':
    'Not a new lead — folded into the same record. They have now been in touch {count} times.',
  'notifications.leadRepeat.newMessage': 'What they wrote this time',
  'notifications.test.connected':
    'Connected — “{host}:{port}” accepted the connection.',
  'notifications.test.missingFields':
    'Required fields are missing — fill them in and save first.',
  'notifications.test.failed': 'Could not connect to the mail server.',

  // ── settings ──────────────────────────────────────────────────────────────────────
  'settings.corsStorageOnly':
    'The CORS check applies to the storage capability only.',
  'settings.test.unsupported':
    'This provider does not support connection testing.',
  'settings.unknownProvider':
    'Unknown provider “{provider}” for capability “{capability}”.',
  'settings.unknownField': 'Unknown field “{field}” for provider “{provider}”.',
  'settings.value.expected.localizedText':
    'Setting “{key}” expects a localized { ar, en } object or null.',
  'settings.value.expected.boolean': 'Setting “{key}” expects a boolean.',
  'settings.value.expected.number': 'Setting “{key}” expects a number.',
  'settings.value.expected.string': 'Setting “{key}” expects a string or null.',
  'settings.value.outOfRange':
    'Setting “{key}” expects a whole number between {min} and {max}.',
  'settings.value.invalidFormat':
    'Setting “{key}” has the wrong format. It should look like: {example}',

  // ── security — the gateway edge (P8.10.A) ─────────────────────────────────────────
  'security.rateLimited':
    'Too many requests. Please try again in {seconds} seconds.',
};
