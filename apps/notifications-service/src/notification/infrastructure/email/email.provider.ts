/** A renderable email — `to` plus the composed subject + HTML/plain bodies. */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * The email-delivery seam (analogous to media's `StorageProvider`). The application service
 * depends on this abstraction; the module binds it to an SMTP sender when configured or a
 * console logger otherwise (dev-safe). New channels (SMS/push) get their own seam later.
 */
export abstract class EmailProvider {
  abstract send(message: EmailMessage): Promise<void>;
}
