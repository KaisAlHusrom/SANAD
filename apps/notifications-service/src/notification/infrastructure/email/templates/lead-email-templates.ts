import type { LeadNotificationPayload, Locale } from '@sanad/contracts';
import { translate } from '@sanad/i18n';
import type { EmailMessage } from '../email.provider.js';

/** The composed parts of an email (the recipient `to` is added by the caller). */
type EmailBody = Omit<EmailMessage, 'to'>;

const SITE = 'سند التقنية — Sanad Tech';

const EMPTY = '—';

/**
 * Internal alert to the team inbox that a new lead arrived — rendered in the TEAM's language
 * (`NOTIFICATIONS_TEAM_LOCALE`, ar by default). Staff are Arabic-first too, and this text lives
 * inside a payload the gateway's renderer never sees, so it is translated here (U24d). The
 * lead's OWN values (name, message, source) are data and pass through untranslated.
 */
export function teamAlertEmail(
  lead: LeadNotificationPayload,
  locale: Locale,
): EmailBody {
  const label = (key: string): string => translate(key, locale);
  const rows: Array<[string, string]> = [
    [label('notifications.leadAlert.name'), lead.name],
    [label('notifications.leadAlert.email'), lead.email],
    [label('notifications.leadAlert.company'), lead.company ?? EMPTY],
    [label('notifications.leadAlert.projectType'), lead.projectType ?? EMPTY],
    [label('notifications.leadAlert.source'), lead.source],
    [label('notifications.leadAlert.locale'), lead.locale],
  ];
  const subject = lead.projectType
    ? translate('notifications.leadAlert.subjectTyped', locale, {
        name: lead.name,
        projectType: lead.projectType,
      })
    : translate('notifications.leadAlert.subject', locale, { name: lead.name });
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return {
    subject,
    text: [
      ...rows.map(([key, value]) => `${key}: ${value}`),
      '',
      `${label('notifications.leadAlert.message')}:`,
      lead.message,
    ].join('\n'),
    html:
      `<div dir="${dir}"><h2>${escapeHtml(
        translate('notifications.leadAlert.heading', locale, {
          name: lead.name,
        }),
      )}</h2><ul>` +
      rows
        .map(
          ([key, value]) =>
            `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`,
        )
        .join('') +
      `</ul><p>${escapeHtml(lead.message)}</p></div>`,
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
