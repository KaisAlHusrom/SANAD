import { HttpException, HttpStatus } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import type { IdentityContext } from '@sanad/contracts';
import { translate } from '@sanad/i18n';
import { describe, expect, it } from 'vitest';
import { IntegrationController } from './integration.controller.js';

const identity: IdentityContext = {
  userId: 'u-1',
  roles: ['admin'],
  permissions: ['manage'],
};

/** A client that must never be reached — these tests reject before any RMQ call. */
const unusedClient = {
  send: () => {
    throw new Error('should not reach the broker');
  },
} as unknown as ClientProxy;

function controller(): IntegrationController {
  return new IntegrationController(unusedClient, unusedClient, unusedClient);
}

describe('IntegrationController — the CORS routes are storage-only (N7/U24)', () => {
  it('rejects a non-storage capability with a KEYED 400, never English prose', async () => {
    // This throw sat in a multiline `new BadRequestException('…')` and survived the first U24
    // pass: `translate` returns an unknown key unchanged, so the prose would have reached an
    // Arabic admin verbatim — exactly the class of bug U24 exists to prevent.
    await expect(
      controller().corsStatus(identity, 'ar', 'email', 'smtp'),
    ).rejects.toThrow(HttpException);

    try {
      await controller().corsStatus(identity, 'ar', 'email', 'smtp');
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((error as HttpException).getResponse()).toEqual({
        statusCode: 400,
        messageKey: 'settings.corsStorageOnly',
      });
    }
  });

  it('rejects the CORS APPLY route the same way', async () => {
    try {
      await controller().applyCors(identity, 'ar', 'email', 'smtp');
      expect.unreachable();
    } catch (error) {
      expect((error as HttpException).getResponse()).toMatchObject({
        messageKey: 'settings.corsStorageOnly',
      });
    }
  });

  it('the key renders in the caller’s language at the edge', () => {
    expect(translate('settings.corsStorageOnly', 'ar')).toBe(
      'فحص CORS يخصّ مساحة التخزين فقط.',
    );
    expect(translate('settings.corsStorageOnly', 'en')).toBe(
      'The CORS check applies to the storage capability only.',
    );
  });
});
