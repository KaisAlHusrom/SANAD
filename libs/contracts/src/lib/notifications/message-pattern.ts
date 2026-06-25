/**
 * The canonical RMQ request/reply patterns the gateway sends and the notifications service
 * answers (MS2). Defined once so caller and responder never drift (U3).
 * `<service>.<resource>.<action>` convention.
 */
export const NOTIFICATION_LIST = 'notification.list';
export const NOTIFICATION_MARK_READ = 'notification.mark-read';
