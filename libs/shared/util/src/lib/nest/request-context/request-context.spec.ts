import { EMPTY_REQUEST_CONTEXT } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { requestContextFromHttp } from './request-context.js';

describe('requestContextFromHttp', () => {
  it('reads the address, agent and id off a plain request', () => {
    expect(
      requestContextFromHttp({
        ip: '85.10.1.4',
        headers: { 'user-agent': 'Mozilla/5.0', 'x-request-id': 'req-7' },
      }),
    ).toEqual({
      ip: '85.10.1.4',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-7',
    });
  });

  // THE security fix (P8.10.A). nginx APPENDS to x-forwarded-for ($proxy_add_x_forwarded_for),
  // so the first hop is whatever the caller sent. `req.ip` under `trust proxy` is the rightmost
  // non-trusted entry — the one value an attacker cannot move. Keying a rate limiter on the
  // spoofable half would let one client rotate buckets per request.
  it('prefers the proxy-computed request.ip over a spoofed x-forwarded-for hop', () => {
    expect(
      requestContextFromHttp({
        ip: '85.10.1.4',
        headers: { 'x-forwarded-for': '9.9.9.9, 85.10.1.4' },
      }).ip,
    ).toBe('85.10.1.4');
  });

  it('falls back to the forwarded chain only when request.ip is absent', () => {
    expect(
      requestContextFromHttp({
        headers: { 'x-forwarded-for': '9.9.9.9, 172.18.0.5' },
      }).ip,
    ).toBe('9.9.9.9');
  });

  it('falls back to the socket address when nothing else is known', () => {
    expect(
      requestContextFromHttp({
        socket: { remoteAddress: '10.0.0.9' },
        headers: {},
      }).ip,
    ).toBe('10.0.0.9');
  });

  // A v4-mapped v6 address and its plain form are the same client; leaving both would give one
  // caller two rate-limit buckets and two different-looking audit rows.
  it('normalises a v4-mapped v6 address to its plain form', () => {
    expect(
      requestContextFromHttp({ ip: '::ffff:85.10.1.4', headers: {} }).ip,
    ).toBe('85.10.1.4');
  });

  it('takes the first element of an array-valued header', () => {
    expect(
      requestContextFromHttp({
        headers: { 'user-agent': ['curl/8', 'ignored'] },
      }).userAgent,
    ).toBe('curl/8');
  });

  // The id lands in DB rows and log lines, so it is sanitised at the edge rather than trusted.
  it('rejects an over-long inbound request id', () => {
    expect(
      requestContextFromHttp({
        headers: { 'x-request-id': 'a'.repeat(129) },
      }).requestId,
    ).toBeNull();
  });

  it('rejects an inbound request id outside the safe charset', () => {
    expect(
      requestContextFromHttp({
        headers: { 'x-request-id': '<script>alert(1)</script>' },
      }).requestId,
    ).toBeNull();
    expect(
      requestContextFromHttp({
        headers: { 'x-request-id': 'a b' },
      }).requestId,
    ).toBeNull();
  });

  it('accepts a uuid-shaped id verbatim', () => {
    const id = '018f4a0e-1c2b-7d3e-8f90-a1b2c3d4e5f6';
    expect(
      requestContextFromHttp({ headers: { 'x-request-id': id } }).requestId,
    ).toBe(id);
  });

  it('degrades to the empty context when the request tells us nothing', () => {
    expect(requestContextFromHttp({ headers: {} })).toEqual(
      EMPTY_REQUEST_CONTEXT,
    );
  });

  it('treats a blank header as absent rather than a value', () => {
    expect(
      requestContextFromHttp({
        headers: { 'user-agent': '', 'x-forwarded-for': '   ' },
      }),
    ).toEqual(EMPTY_REQUEST_CONTEXT);
  });
});
