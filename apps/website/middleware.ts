import { NextResponse, type NextRequest } from 'next/server';
import { resolveLocaleRedirect } from './src/i18n/locale-route';

/**
 * Ensure every page is locale-prefixed (owner decision: both `/ar` + `/en`, `/` → `/ar`,
 * Arabic default). A bare or unknown-locale path 308-redirects to the default-locale form;
 * an already-valid-locale path passes through. The matcher skips Next internals, the API,
 * and static files.
 */
export function middleware(request: NextRequest): NextResponse {
  const target = resolveLocaleRedirect(request.nextUrl.pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Skip _next, the gateway api, and any path with a file extension (assets).
  matcher: ['/((?!_next|api|.*\\.).*)'],
};
