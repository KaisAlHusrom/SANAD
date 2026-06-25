import type { LeadNotificationPayload } from '@sanad/contracts';
import type { EmailMessage } from '../email.provider.js';

/** The composed parts of an email (the recipient `to` is added by the caller). */
type EmailBody = Omit<EmailMessage, 'to'>;

const SITE = 'سند التقنية — Sanad Tech';

/** Internal alert to the team inbox that a new lead arrived (English — staff-facing). */
export function teamAlertEmail(lead: LeadNotificationPayload): EmailBody {
  const lines = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company ?? '—'}`,
    `Project type: ${lead.projectType ?? '—'}`,
    `Source: ${lead.source}`,
    `Locale: ${lead.locale}`,
    '',
    'Message:',
    lead.message,
  ];
  return {
    subject: `New lead: ${lead.name}${lead.projectType ? ` (${lead.projectType})` : ''}`,
    text: lines.join('\n'),
    html: `<h2>New lead — ${escapeHtml(lead.name)}</h2><ul>${[
      ['Email', lead.email],
      ['Company', lead.company ?? '—'],
      ['Project type', lead.projectType ?? '—'],
      ['Source', lead.source],
      ['Locale', lead.locale],
    ]
      .map(
        ([k, v]) => `<li><strong>${k}:</strong> ${escapeHtml(String(v))}</li>`,
      )
      .join('')}</ul><p>${escapeHtml(lead.message)}</p>`,
  };
}

/**
 * Localized acknowledgement to the visitor who submitted the form (ar default / en),
 * driven by the lead's `locale` (U8). On-brand "we received your request" trust message.
 */
export function visitorAckEmail(lead: LeadNotificationPayload): EmailBody {
  if (lead.locale === 'en') {
    return {
      subject: `We received your request — ${SITE}`,
      text: `Hello ${lead.name},\n\nThank you for reaching out to Sanad Tech. We've received your request and a member of our team will be in touch shortly.\n\n— ${SITE}`,
      html: `<p>Hello ${escapeHtml(lead.name)},</p><p>Thank you for reaching out to <strong>Sanad Tech</strong>. We've received your request and a member of our team will be in touch shortly.</p><p>— ${SITE}</p>`,
    };
  }
  return {
    subject: `استلمنا طلبك — ${SITE}`,
    text: `مرحباً ${lead.name}،\n\nشكراً لتواصلك مع سند التقنية. لقد استلمنا طلبك وسيتواصل معك أحد أعضاء فريقنا قريباً.\n\n— ${SITE}`,
    html: `<div dir="rtl"><p>مرحباً ${escapeHtml(lead.name)}،</p><p>شكراً لتواصلك مع <strong>سند التقنية</strong>. لقد استلمنا طلبك وسيتواصل معك أحد أعضاء فريقنا قريباً.</p><p>— ${SITE}</p></div>`,
  };
}

/** Minimal HTML-escape for interpolated user content (defense against broken markup). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
