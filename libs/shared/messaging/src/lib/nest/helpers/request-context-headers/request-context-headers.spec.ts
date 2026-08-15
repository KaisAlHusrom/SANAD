import { describe, expect, it } from 'vitest';
import {
  EMPTY_REQUEST_CONTEXT,
  REQUEST_CONTEXT_HEADER,
  type RequestContext,
} from '@sanad/contracts';
import {
  requestContextFromHeaders,
  requestContextToHeaders,
} from './request-context-headers.js';

const context: RequestContext = {
  ip: '85.10.1.4',
  userAgent: 'Mozilla/5.0',
  requestId: 'req-1',
};

describe('request-context headers (P8.8, sibling of MS4 identity)', () => {
  it('round-trips through the RMQ header map', () => {
    const headers = requestContextToHeaders(context);
    expect(headers[REQUEST_CONTEXT_HEADER]).toBeTypeOf('string');
    expect(requestContextFromHeaders(headers)).toEqual(context);
  });

  it('carries partial knowledge rather than dropping the whole context', () => {
    const partial: RequestContext = {
      ip: '1.2.3.4',
      userAgent: null,
      requestId: null,
    };
    expect(requestContextFromHeaders(requestContextToHeaders(partial))).toEqual(
      partial,
    );
  });

  it('returns the EMPTY context — never undefined — when the header is absent or junk', () => {
    expect(requestContextFromHeaders(undefined)).toEqual(EMPTY_REQUEST_CONTEXT);
    expect(requestContextFromHeaders({})).toEqual(EMPTY_REQUEST_CONTEXT);
    expect(
      requestContextFromHeaders({ [REQUEST_CONTEXT_HEADER]: 'not json' }),
    ).toEqual(EMPTY_REQUEST_CONTEXT);
    expect(
      requestContextFromHeaders({ [REQUEST_CONTEXT_HEADER]: '{"ip":42}' }),
    ).toEqual(EMPTY_REQUEST_CONTEXT);
  });

  it('never lets a bad header break the message it rides on', () => {
    expect(() =>
      requestContextFromHeaders({ [REQUEST_CONTEXT_HEADER]: '{' }),
    ).not.toThrow();
  });
});
