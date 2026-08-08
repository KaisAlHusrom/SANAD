import { getProviderDescriptor } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { toSubmitValues } from './use-provider-config';

const R2_FIELDS = getProviderDescriptor('storage', 'r2')?.fields ?? [];
const SMTP_FIELDS = getProviderDescriptor('email', 'smtp')?.fields ?? [];

describe('toSubmitValues (what the configure form actually sends)', () => {
  it('OMITS a blank secret so the stored value survives an edit', () => {
    const payload = toSubmitValues(R2_FIELDS, {
      bucket: 'my-bucket',
      secretAccessKey: '', // untouched — the masked field was left blank
    });
    expect(payload).not.toHaveProperty('secretAccessKey');
    expect(payload['bucket']).toBe('my-bucket');
  });

  it('sends a retyped secret so rotation works', () => {
    const payload = toSubmitValues(R2_FIELDS, {
      secretAccessKey: 'rotated-secret',
    });
    expect(payload['secretAccessKey']).toBe('rotated-secret');
  });

  it('sends a blank NON-secret so the owner can clear it', () => {
    const payload = toSubmitValues(R2_FIELDS, { bucket: '' });
    expect(payload['bucket']).toBe('');
  });

  it('stringifies numbers and booleans (the API takes strings)', () => {
    const payload = toSubmitValues(SMTP_FIELDS, { port: 587, secure: true });
    expect(payload['port']).toBe('587');
    expect(payload['secure']).toBe('true');
  });

  it('only ever sends keys that belong to the provider', () => {
    const payload = toSubmitValues(SMTP_FIELDS, {
      host: 'smtp.test',
      bucket: 'not-an-smtp-field',
    });
    expect(Object.keys(payload)).not.toContain('bucket');
    expect(payload['host']).toBe('smtp.test');
  });
});
