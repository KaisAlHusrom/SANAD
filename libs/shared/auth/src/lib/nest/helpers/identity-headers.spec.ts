import { describe, expect, it } from 'vitest';
import type { IdentityContext } from '@sanad/contracts';
import {
  IDENTITY_HEADER,
  identityFromHeaders,
  identityToHeaders,
} from './identity-headers.js';

const identity: IdentityContext = {
  userId: 'user-1',
  roles: ['admin'],
  permissions: ['manage'],
  email: 'a@b.co',
};

describe('identity headers (MS4)', () => {
  it('round-trips an identity through RMQ headers', () => {
    const headers = identityToHeaders(identity);
    expect(headers[IDENTITY_HEADER]).toBeTypeOf('string');
    expect(identityFromHeaders(headers)).toEqual(identity);
  });

  it('returns null for missing or malformed headers', () => {
    expect(identityFromHeaders(undefined)).toBeNull();
    expect(identityFromHeaders({})).toBeNull();
    expect(identityFromHeaders({ [IDENTITY_HEADER]: 'not-json' })).toBeNull();
    expect(
      identityFromHeaders({ [IDENTITY_HEADER]: JSON.stringify({ bad: 1 }) }),
    ).toBeNull();
  });
});
