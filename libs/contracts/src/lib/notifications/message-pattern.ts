/**
 * The canonical RMQ request/reply patterns the gateway sends and the notifications service
 * answers (MS2). Defined once so caller and responder never drift (U3).
 * `<service>.<resource>.<action>` convention.
 */
export const NOTIFICATION_LIST = 'notification.list';
export const NOTIFICATION_MARK_READ = 'notification.mark-read';

/**
 * Test an email provider's settings with a real transport verify. The gateway routes
 * `POST /api/integrations/email/:provider/test` here because notifications-service OWNS the
 * SMTP adapter — settings-service must never learn SMTP (MS1).
 */
export const NOTIFICATION_EMAIL_TEST = 'notification.email.test';
