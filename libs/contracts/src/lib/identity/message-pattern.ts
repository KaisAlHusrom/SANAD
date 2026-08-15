/**
 * The canonical RMQ request/reply patterns the gateway sends and the identity
 * service answers (MS2). Defined once here so caller and responder never drift (U3).
 * They follow the `<service>.<resource>.<action>` convention.
 */
export const IDENTITY_AUTH_LOGIN = 'identity.auth.login';
export const IDENTITY_AUTH_REFRESH = 'identity.auth.refresh';
export const IDENTITY_AUTH_LOGOUT = 'identity.auth.logout';
export const IDENTITY_USERS_LIST = 'identity.users.list';
export const IDENTITY_USERS_CREATE = 'identity.users.create';
export const IDENTITY_USERS_UPDATE = 'identity.users.update';
export const IDENTITY_USERS_ROLE_ASSIGN = 'identity.users.role-assign';
export const IDENTITY_USERS_ROLE_REVOKE = 'identity.users.role-revoke';
export const IDENTITY_ROLES_LIST = 'identity.roles.list';

/**
 * Emitted (Outbox, MS3) when a user account first exists. Uses the `<entity>.<event>` event
 * convention, not the request/reply one above. Declared in the `EVENT_CATALOG` (U27).
 */
export const USER_REGISTERED_EVENT = 'user.registered';
