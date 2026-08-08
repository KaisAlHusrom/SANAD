import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { HttpResponseEnvelope } from '@sanad/contracts';
import { httpError, LOCALE_HEADER } from '@sanad/i18n';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

const clock = { nowIso: () => '2026-06-22T10:00:00.000Z' };

interface Captured {
  status: number;
  body: HttpResponseEnvelope<null>;
}

function hostFor(
  url: string,
  captured: Captured,
  headers: Record<string, string> = {},
): ArgumentsHost {
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
      getRequest: () => ({ url, headers }),
    }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  it('renders a messageKey in the request locale (U24)', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      httpError(HttpStatus.NOT_FOUND, 'identity.userNotFound', { id: 'u-9' }),
      hostFor('/api/users/9', captured, { [LOCALE_HEADER]: 'ar' }),
    );
    expect(captured.status).toBe(HttpStatus.NOT_FOUND);
    expect(captured.body.success).toBe(false);
    expect(captured.body.message).toBe('لم يتم العثور على المستخدم «u-9».');
    expect(captured.body.path).toBe('/api/users/9');
    expect(captured.body.timestamp).toBe('2026-06-22T10:00:00.000Z');
  });

  it('renders the same key in English when the caller asked for en', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      httpError(HttpStatus.NOT_FOUND, 'identity.userNotFound', { id: 'u-9' }),
      hostFor('/api/users/9', captured, { [LOCALE_HEADER]: 'en' }),
    );
    expect(captured.body.message).toBe('User “u-9” was not found.');
  });

  it('interpolates the params the key carries', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      httpError(HttpStatus.CONFLICT, 'content.slugConflict', { slug: 'about' }),
      hostFor('/api/content/pages', captured, { [LOCALE_HEADER]: 'en' }),
    );
    expect(captured.status).toBe(HttpStatus.CONFLICT);
    expect(captured.body.message).toContain('about');
  });

  it('defaults to Arabic when no locale header is sent (U8)', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      httpError(HttpStatus.FORBIDDEN, 'auth.forbidden'),
      hostFor('/api/identity/users', captured),
    );
    expect(captured.status).toBe(HttpStatus.FORBIDDEN);
    expect(captured.body.message).toBe('لا تملك صلاحية تنفيذ هذا الإجراء.');
  });

  it('keeps the Forbidden status for an RBAC rejection', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new ForbiddenException('Insufficient permissions'),
      hostFor('/api/identity/users', captured),
    );
    expect(captured.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('localizes a Postgres unique violation (409)', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      { code: '23505' },
      hostFor('/api/users', captured, { [LOCALE_HEADER]: 'en' }),
    );
    expect(captured.status).toBe(HttpStatus.CONFLICT);
    expect(captured.body.message).toBe('This item already exists.');
  });

  it('maps a repository findOrFail miss to a localized 404, not a 500', () => {
    const missing = new Error('media_asset not found: abc');
    missing.name = 'RecordNotFoundError';
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(missing, hostFor('/api/x', captured));
    expect(captured.status).toBe(HttpStatus.NOT_FOUND);
    expect(captured.body.message).toBe('لم يتم العثور على المطلوب.');
    // The table name + id are developer text and never reach the client (U24f).
    expect(captured.body.message).not.toContain('media_asset');
  });

  it('localizes the generic 500 for an unknown error', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new Error('kaboom'),
      hostFor('/api/x', captured, { [LOCALE_HEADER]: 'ar' }),
    );
    expect(captured.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captured.body.message).toBe(
      'حدث خطأ غير متوقع في الخادم. حاول مرة أخرى.',
    );
    // The internal invariant text NEVER reaches the client (U24f).
    expect(captured.body.message).not.toContain('kaboom');
  });

  it('DISCARDS framework prose and answers with a status key instead (U24)', () => {
    // Nest's own `Cannot GET /api/x`, body-parser's `request entity too large`, any third-party
    // throw: their English is untranslatable, and rendering it verbatim was the last channel
    // through which English could reach an Arabic caller.
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new NotFoundException('Cannot GET /api/nope'),
      hostFor('/api/nope', captured),
    );
    expect(captured.status).toBe(HttpStatus.NOT_FOUND);
    expect(captured.body.message).toBe('لم يتم العثور على المطلوب.');
    expect(captured.body.message).not.toContain('Cannot GET');
  });

  it('maps an un-keyed 4xx and 5xx to their own localized keys', () => {
    const bad = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new BadRequestException('request entity too large'),
      hostFor('/api/x', bad, { [LOCALE_HEADER]: 'en' }),
    );
    expect(bad.body.message).toBe('The request could not be completed.');

    const boom = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new HttpException('upstream exploded', HttpStatus.BAD_GATEWAY),
      hostFor('/api/x', boom, { [LOCALE_HEADER]: 'en' }),
    );
    expect(boom.body.message).toBe(
      'An unexpected server error occurred. Please try again.',
    );
  });

  it('still honours a plain-string message when it IS a catalog key', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new NotFoundException('identity.userNotFound'),
      hostFor('/api/users/9', captured, { [LOCALE_HEADER]: 'en' }),
    );
    expect(captured.body.message).toBe('User “” was not found.');
  });

  it('renders the field errors a validation failure carries — keys, not raw Zod English', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new BadRequestException({
        messageKey: 'validation.failed',
        errors: {
          email: 'validation.invalidString',
          name: 'validation.required',
        },
      }),
      hostFor('/api/x', captured, { [LOCALE_HEADER]: 'en' }),
    );
    expect(captured.body.message).toBe('Please check the fields below.');
    expect(captured.body.errors).toEqual({
      email: "This field's format is not valid.",
      name: 'This field is required.',
    });
  });

  it('renders those same field errors in Arabic (U24)', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new BadRequestException({
        messageKey: 'validation.failed',
        errors: { name: 'validation.required' },
      }),
      hostFor('/api/x', captured),
    );
    expect(captured.body.errors).toEqual({ name: 'هذا الحقل مطلوب.' });
  });

  it('omits `errors` entirely for a normal error — the body keeps its 5-field shape (N9)', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      httpError(HttpStatus.FORBIDDEN, 'auth.forbidden'),
      hostFor('/api/x', captured),
    );
    expect(captured.body).not.toHaveProperty('errors');
  });

  it('refuses to render prose smuggled into a hand-built `errors` map', () => {
    const captured = {} as Captured;
    new AllExceptionsFilter(clock).catch(
      new BadRequestException({
        messageKey: 'validation.failed',
        errors: { email: 'Must be a valid email address' },
      }),
      hostFor('/api/x', captured, { [LOCALE_HEADER]: 'ar' }),
    );
    expect(captured.body.errors?.email).toBe('قيمة هذا الحقل غير صحيحة.');
    expect(captured.body.errors?.email).not.toContain('Must be');
  });
});
