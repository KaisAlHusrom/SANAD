import { describe, expect, it } from 'vitest';
import type { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import type { NotificationsEnv } from '../../../env.js';
import type { EmailMessage } from './email.provider.js';
import { ConsoleEmailProvider } from './console-email.provider.js';
import { SmtpEmailProvider } from './smtp-email.provider.js';

const MESSAGE: EmailMessage = {
  to: 'visitor@example.com',
  subject: 'Hello',
  html: '<p>hi</p>',
  text: 'hi',
};

describe('email providers', () => {
  it('ConsoleEmailProvider resolves without throwing (dev-safe default)', async () => {
    await expect(
      new ConsoleEmailProvider().send(MESSAGE),
    ).resolves.toBeUndefined();
  });

  it('SmtpEmailProvider logs (does not throw) when SMTP is unconfigured', async () => {
    const client = { send: () => of(null) } as unknown as ClientProxy;
    const env = {
      SMTP_HOST: undefined,
      SMTP_PASSWORD: undefined,
    } as NotificationsEnv;
    await expect(
      new SmtpEmailProvider(env, client).send(MESSAGE),
    ).resolves.toBeUndefined();
  });
});
