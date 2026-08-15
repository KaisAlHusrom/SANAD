import { describe, expect, it } from 'vitest';
import { REDACTED, redact } from './redact.js';

describe('redact', () => {
  it('masks a secret-looking key at the top level', () => {
    expect(redact({ email: 'a@b.c', password: 'hunter2' })).toEqual({
      email: 'a@b.c',
      password: REDACTED,
    });
  });

  it('masks nested and array-nested secrets', () => {
    expect(
      redact({
        user: { name: 'Kais', refreshToken: 'r-1' },
        clients: [{ apiKey: 'k-1' }, { apiKey: 'k-2' }],
      }),
    ).toEqual({
      user: { name: 'Kais', refreshToken: REDACTED },
      clients: [{ apiKey: REDACTED }, { apiKey: REDACTED }],
    });
  });

  it('matches case-insensitively and on substrings — `SMTP_PASSWORD`, `accessToken`', () => {
    expect(
      redact({ SMTP_PASSWORD: 'x', accessToken: 'y', secretKey: 'z' }),
    ).toEqual({
      SMTP_PASSWORD: REDACTED,
      accessToken: REDACTED,
      secretKey: REDACTED,
    });
  });

  it('leaves innocent values — including ones that merely LOOK long — alone', () => {
    const value = {
      title: 'Keynote',
      body: 'a'.repeat(50),
      count: 3,
      ok: true,
    };
    expect(redact(value)).toEqual(value);
  });

  it('passes primitives and null straight through', () => {
    expect(redact('plain')).toBe('plain');
    expect(redact(7)).toBe(7);
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
  });

  it('does not choke on a CYCLE — an audit write must never hang the request it describes', () => {
    const node: Record<string, unknown> = { name: 'root' };
    node['self'] = node;
    expect(() => redact(node)).not.toThrow();
  });

  it('caps runaway depth rather than serialising an object graph into a row', () => {
    let deep: unknown = { password: 'x' };
    for (let level = 0; level < 30; level += 1) {
      deep = { nested: deep };
    }
    expect(() => redact(deep)).not.toThrow();
  });

  it('preserves a Date-like ISO string untouched (it is data, not a secret)', () => {
    expect(redact({ occurredAt: '2026-08-09T10:00:00.000Z' })).toEqual({
      occurredAt: '2026-08-09T10:00:00.000Z',
    });
  });
});
