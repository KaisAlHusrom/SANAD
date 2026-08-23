import type { LeadNotificationPayload } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import {
  repeatAlertEmail,
  teamAlertEmail,
  visitorAckEmail,
} from './lead-email-templates.js';

const lead: LeadNotificationPayload = {
  leadId: 'lead-1',
  name: 'سارة',
  email: 'sara@example.com',
  phone: '+966501234567',
  company: 'شركة',
  projectType: 'saas',
  source: 'contact',
  locale: 'ar',
  message: 'أحتاج نظاماً لإدارة المشاريع.',
  submissionCount: null,
};

const repeat: LeadNotificationPayload = { ...lead, submissionCount: 3 };

describe('teamAlertEmail (U24d — the team reads its alerts in ITS language)', () => {
  it('renders subject, labels and heading in Arabic by default', () => {
    const body = teamAlertEmail(lead, 'ar');
    expect(body.subject).toBe('طلب جديد: سارة (saas)');
    expect(body.text).toContain('الاسم: سارة');
    expect(body.text).toContain('البريد الإلكتروني: sara@example.com');
    expect(body.text).toContain('الرسالة:');
    expect(body.html).toContain('dir="rtl"');
    expect(body.html).toContain('طلب جديد — سارة');
    // No English label survives — this template used to be English-only prose.
    expect(body.text).not.toMatch(/\b(Name|Email|Company|Source|Message)\b/);
  });

  it('renders the same alert in English when the team reads English', () => {
    const body = teamAlertEmail({ ...lead, name: 'Sara' }, 'en');
    expect(body.subject).toBe('New lead: Sara (saas)');
    expect(body.text).toContain('Name: Sara');
    expect(body.html).toContain('dir="ltr"');
  });

  it('drops the project type from the subject when the lead has none', () => {
    expect(teamAlertEmail({ ...lead, projectType: null }, 'ar').subject).toBe(
      'طلب جديد: سارة',
    );
  });

  it('shows an em-dash for the fields the visitor left blank', () => {
    const body = teamAlertEmail(
      { ...lead, company: null, projectType: null, phone: null },
      'ar',
    );
    expect(body.text).toContain('الجهة: —');
    expect(body.text).toContain('نوع المشروع: —');
    expect(body.text).toContain('رقم الجوال: —');
  });

  it('renders the phone readable and one tap from a call (P8.10.B1)', () => {
    const body = teamAlertEmail(lead, 'ar');
    expect(body.text).toContain('رقم الجوال: +966 50 123 4567');
    expect(body.html).toContain('href="tel:+966501234567"');
    // Numbers are LTR in both locales.
    expect(body.html).toContain('dir="ltr"');
  });

  it('does not offer a call link when the lead predates the phone field', () => {
    expect(teamAlertEmail({ ...lead, phone: null }, 'ar').html).not.toContain(
      'tel:',
    );
  });

  it('escapes interpolated visitor content in the HTML part', () => {
    const body = teamAlertEmail({ ...lead, name: '<script>x</script>' }, 'ar');
    expect(body.html).not.toContain('<script>');
    expect(body.html).toContain('&lt;script&gt;');
  });

  it('never translates the visitor’s own words — data is data', () => {
    expect(teamAlertEmail(lead, 'en').text).toContain(lead.message);
  });
});

describe('visitorAckEmail (follows the LEAD’s locale, not the team’s)', () => {
  it('answers an Arabic visitor in Arabic', () => {
    const body = visitorAckEmail(lead);
    expect(body.subject).toContain('استلمنا طلبك');
    expect(body.html).toContain('dir="rtl"');
  });

  it('answers an English visitor in English', () => {
    const body = visitorAckEmail({ ...lead, locale: 'en', name: 'Sara' });
    expect(body.subject).toContain('We received your request');
    expect(body.text).toContain('Hello Sara');
  });
});

describe('repeatAlertEmail (P8.10.B2 — they wrote again)', () => {
  it('leads with the count, so the team sees at a glance this is not a new lead', () => {
    const body = repeatAlertEmail(repeat, 'ar');
    expect(body.subject).toContain('3');
    expect(body.subject).toContain('سارة');
    expect(body.text).toContain('3');
  });

  it('carries the NEW message — the whole reason the event exists', () => {
    const body = repeatAlertEmail(
      { ...repeat, message: 'زدت الميزانية إلى ٥٠٠ ألف.' },
      'ar',
    );
    expect(body.text).toContain('زدت الميزانية إلى ٥٠٠ ألف.');
    expect(body.html).toContain('زدت الميزانية إلى ٥٠٠ ألف.');
  });

  it('keeps the lead reachable — email and a tel: link', () => {
    const body = repeatAlertEmail(repeat, 'ar');
    expect(body.text).toContain('sara@example.com');
    expect(body.html).toContain('href="tel:+966501234567"');
  });

  it('renders in the TEAM’s language, not the visitor’s (U24d)', () => {
    const body = repeatAlertEmail(
      { ...repeat, name: 'Sara', message: 'Bumping this.' },
      'en',
    );
    expect(body.subject).toMatch(/wrote again|again/i);
    expect(body.html).toContain('dir="ltr"');
    expect(body.text).not.toMatch(/[\u0600-\u06FF]/);
  });

  it('never translates the visitor’s own words — data is data', () => {
    // The team reads English; the visitor wrote Arabic. Their sentence survives verbatim.
    expect(repeatAlertEmail({ ...repeat, name: 'Sara' }, 'en').text).toContain(
      lead.message,
    );
  });

  it('escapes interpolated visitor content', () => {
    const body = repeatAlertEmail(
      { ...repeat, name: '<script>x</script>' },
      'ar',
    );
    expect(body.html).not.toContain('<script>');
    expect(body.html).toContain('&lt;script&gt;');
  });

  it('still reads sensibly when the count is somehow absent', () => {
    const body = repeatAlertEmail({ ...repeat, submissionCount: null }, 'ar');
    expect(body.subject).toContain('سارة');
    expect(body.text).toContain(lead.message);
  });
});
