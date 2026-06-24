import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import {
  ArgumentsHost,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { HttpResponseEnvelope } from '@sanad/contracts';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

const clock = { nowIso: () => '2026-06-22T10:00:00.000Z' };

interface Captured {
  status: number;
  body: HttpResponseEnvelope<null>;
}

function hostFor(url: string, captured: Captured): ArgumentsHost {
  const response = {
    status(code: number) {
      captured.status = code;
      return {
        json(body: unknown) {
          captured.body = body as HttpResponseEnvelope<null>;
          return body;
        },
      };
    },
  };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  it('maps an HttpException to its status + message envelope', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new NotFoundException('user missing'),
      hostFor('/api/users/9', captured),
    );
    expect(captured.status).toBe(HttpStatus.NOT_FOUND);
    expect(captured.body.success).toBe(false);
    expect(captured.body.message).toBe('user missing');
    expect(captured.body.path).toBe('/api/users/9');
    expect(captured.body.timestamp).toBe('2026-06-22T10:00:00.000Z');
  });

  it('keeps the Forbidden status for an RBAC rejection', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new ForbiddenException('Insufficient permissions'),
      hostFor('/api/identity/users', captured),
    );
    expect(captured.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('maps a Postgres unique violation to 409', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      { code: '23505' },
      hostFor('/api/users', captured),
    );
    expect(captured.status).toBe(HttpStatus.CONFLICT);
    expect(captured.body.message).toBe('Resource already exists');
  });

  it('falls back to 500 for an unknown error', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new Error('kaboom'),
      hostFor('/api/x', captured),
    );
    expect(captured.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captured.body.message).toBe('Internal server error');
  });
});
