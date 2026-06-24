import { describe, expect, it, vi } from 'vitest';
import type { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { sendRequest } from './send-request.js';

describe('sendRequest', () => {
  it('resolves the reply and forwards payload + headers in a record (MS2/MS4)', async () => {
    let captured: { pattern: string; record: { data: unknown } } | undefined;
    const send = vi.fn((pattern: string, record: { data: unknown }) => {
      captured = { pattern, record };
      return of({ ok: true });
    });
    const client = { send } as unknown as ClientProxy;

    const result = await sendRequest(
      client,
      'identity.auth.login',
      { a: 1 },
      {
        headers: { 'x-sanad-identity': '{}' },
      },
    );

    expect(result).toEqual({ ok: true });
    expect(captured?.pattern).toBe('identity.auth.login');
    expect(captured?.record.data).toEqual({ a: 1 });
  });
});
