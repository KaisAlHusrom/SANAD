import type { RmqContext } from '@nestjs/microservices';
import { LOCALE_HEADER } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { FakeStorageProvider } from '../testing/fake-storage.provider.js';
import { StorageCorsMessageController } from './storage-cors.message-controller.js';

const PAYLOAD = { capability: 'storage', provider: 'r2' } as const;

/** An `RmqContext` carrying the headers the gateway forwards (MS4) — locale included (U24). */
function rmqContext(headers: Record<string, string> = {}): RmqContext {
  return {
    getMessage: () => ({ properties: { headers } }),
  } as unknown as RmqContext;
}

describe('StorageCorsMessageController (thin delegate, U5)', () => {
  it('reports the bucket CORS state for the named provider', async () => {
    const storage = new FakeStorageProvider();
    const controller = new StorageCorsMessageController(storage);

    const status = await controller.status(PAYLOAD, rmqContext());

    expect(status.state).toBe('missing');
    expect(status.canApply).toBe(true);
  });

  it('applies the policy and reports the resulting state', async () => {
    const storage = new FakeStorageProvider();
    const controller = new StorageCorsMessageController(storage);

    const status = await controller.apply(PAYLOAD, rmqContext());

    expect(status.state).toBe('ok');
    expect(status.allowedOrigins).toEqual(['http://localhost:8190']);
  });

  it('reports `unconfigured` rather than failing when storage has no credentials', async () => {
    const storage = new FakeStorageProvider({ configured: false });
    const controller = new StorageCorsMessageController(storage);

    expect((await controller.status(PAYLOAD, rmqContext())).state).toBe(
      'unconfigured',
    );
  });

  it('passes the FORWARDED locale down, so the explanation is localized (U24d)', async () => {
    // The message rides inside the payload, out of reach of the gateway's envelope renderer —
    // if this controller drops the header, the owner gets English on an Arabic screen.
    let seen: string | null = null;
    const storage = new FakeStorageProvider();
    storage.corsStatus = (locale) => {
      seen = locale;
      return Promise.resolve({
        state: 'missing',
        requiredOrigins: [],
        allowedOrigins: [],
        canApply: true,
        message: null,
        detail: null,
        policy: [],
      });
    };
    const controller = new StorageCorsMessageController(storage);

    await controller.status(PAYLOAD, rmqContext({ [LOCALE_HEADER]: 'en' }));
    expect(seen).toBe('en');

    await controller.status(PAYLOAD, rmqContext());
    expect(seen).toBe('ar'); // no header → the product default (U8)
  });
});
