import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Locale } from '@sanad/contracts';
import { resolveRequestLocale } from '@sanad/i18n';

/**
 * Injects the caller's locale into a handler (U24): `x-sanad-locale` → `accept-language` →
 * `ar`. Controllers pass it to `forwardHeaders()` so the service sees the same locale the
 * response envelope will be rendered in.
 */
export const RequestLocale = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Locale =>
    resolveRequestLocale(
      context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>()
        ?.headers,
    ),
);
