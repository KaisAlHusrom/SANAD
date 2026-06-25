import { describe, expect, it } from 'vitest';
import type { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import type { NotificationsEnv } from '../../../env.js';
import { resolveSmtpPassword } from './smtp-credentials.js';

/** A ClientProxy whose `send` returns the given observable (sendRequest pipes it). */
function fakeClient(send: () => unknown): ClientProxy {
  return { send } as unknown as ClientProxy;
}

const env = (smtpPassword?: string): NotificationsEnv =>
  ({ SMTP_PASSWORD: smtpPassword }) as NotificationsEnv;

describe('resolveSmtpPassword (DB → env → null, N13)', () => {
  it('returns the vault value when present', async () => {
    const pw = await resolveSmtpPassword(
      fakeClient(() => of('vault-pw')),
      env('env-pw'),
    );
    expect(pw).toBe('vault-pw');
  });

  it('falls back to env when the vault returns null', async () => {
    const pw = await resolveSmtpPassword(
      fakeClient(() => of(null)),
      env('env-pw'),
    );
    expect(pw).toBe('env-pw');
  });

  it('falls back to env when the settings service is unreachable', async () => {
    const pw = await resolveSmtpPassword(
      fakeClient(() => throwError(() => new Error('settings down'))),
      env('env-pw'),
    );
    expect(pw).toBe('env-pw');
  });

  it('returns null when neither the vault nor env has it', async () => {
    const pw = await resolveSmtpPassword(
      fakeClient(() => of(null)),
      env(undefined),
    );
    expect(pw).toBeNull();
  });
});
