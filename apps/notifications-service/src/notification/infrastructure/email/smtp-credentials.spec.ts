import { describe, expect, it } from 'vitest';
import type { ClientProxy } from '@nestjs/microservices';
import type { ResolvedIntegrationConfig } from '@sanad/contracts';
import { of, throwError } from 'rxjs';
import type { NotificationsEnv } from '../../../env.js';
import { resolveEmailConfig } from './smtp-credentials.js';

/** A fake settings ClientProxy replying to `settings.integration.resolve`. */
function settingsClient(
  reply: ResolvedIntegrationConfig | null,
  opts: { unreachable?: boolean } = {},
): ClientProxy {
  return {
    send: () =>
      opts.unreachable
        ? throwError(() => new Error('settings down'))
        : of(reply),
  } as unknown as ClientProxy;
}

const FULL_ENV = {
  SMTP_HOST: 'env.smtp.test',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_USER: 'env-user',
  SMTP_PASSWORD: 'env-pw',
  SMTP_FROM: 'Sanad <no-reply@sanad.tech>',
} as NotificationsEnv;

describe('resolveEmailConfig (full SMTP set; vault → env → null, N13)', () => {
  it('resolves the WHOLE connection from the vault, not just the password', async () => {
    const resolved = await resolveEmailConfig(
      settingsClient({
        provider: 'smtp',
        values: {
          host: 'vault.smtp.test',
          port: '2525',
          secure: 'true',
          user: 'vault-user',
          password: 'vault-pw',
          from: 'Vault <hi@vault.test>',
        },
      }),
      FULL_ENV,
    );
    expect(resolved?.provider).toBe('smtp');
    expect(resolved?.config).toEqual({
      host: 'vault.smtp.test',
      port: 2525,
      secure: true,
      user: 'vault-user',
      password: 'vault-pw',
      from: 'Vault <hi@vault.test>',
    });
  });

  it('merges per FIELD — vault password with the rest from env', async () => {
    const resolved = await resolveEmailConfig(
      settingsClient({ provider: 'smtp', values: { password: 'vault-pw' } }),
      FULL_ENV,
    );
    expect(resolved?.config.password).toBe('vault-pw');
    expect(resolved?.config.host).toBe('env.smtp.test');
    expect(resolved?.config.port).toBe(587);
  });

  it('falls back entirely to env, and when settings is unreachable', async () => {
    expect(
      (await resolveEmailConfig(settingsClient(null), FULL_ENV))?.config.host,
    ).toBe('env.smtp.test');
    expect(
      (
        await resolveEmailConfig(
          settingsClient(null, { unreachable: true }),
          FULL_ENV,
        )
      )?.config.host,
    ).toBe('env.smtp.test');
  });

  it('returns null when a REQUIRED field (host) is missing everywhere', async () => {
    const noHost = { ...FULL_ENV, SMTP_HOST: undefined } as NotificationsEnv;
    expect(await resolveEmailConfig(settingsClient(null), noHost)).toBeNull();
  });

  it('treats auth as OPTIONAL — no user/password still resolves', async () => {
    const noAuth = {
      ...FULL_ENV,
      SMTP_USER: undefined,
      SMTP_PASSWORD: undefined,
    } as NotificationsEnv;
    const resolved = await resolveEmailConfig(settingsClient(null), noAuth);
    expect(resolved?.config.host).toBe('env.smtp.test');
    expect(resolved?.config.user).toBeUndefined();
  });
});
