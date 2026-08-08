import type { LeadNotificationPayload } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { teamAlertEmail, visitorAckEmail } from './lead-email-templates.js';

const lead: LeadNotificationPayload = {
  leadId: 'lead-1',
  name: 'سارة',
  email: 'sara@example.com',
  company: 'شركة',
  projectType: 'saas',
  source: 'contact',
  locale: 'ar',
  message: 'أحتاج نظاماً لإدارة المشاريع.',
};

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
      { ...lead, company: null, projectType: null },
      'ar',
    );
    expect(body.text).toContain('الجهة: —');
    expect(body.text).toContain('نوع المشروع: —');
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
