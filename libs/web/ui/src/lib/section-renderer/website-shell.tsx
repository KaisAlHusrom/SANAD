import type { Locale } from '@sanad/contracts';
import { type PageAccentKey, pageAccents } from '@sanad/config';
import type { CSSProperties, ReactNode } from 'react';

export interface WebsiteShellProps {
  locale: Locale;
  /**
   * The per-page accent palette; defaults to the landing accent. `'route'` (the website's
   * one-universe mode, P8.D) omits the inline accent vars entirely so the server-rendered
   * `AccentStyle` `:has([data-system])` rules resolve the accent per route — an inline
   * style would beat them by cascade. The admin preview keeps passing a concrete key.
   */
  pageAccent?: PageAccentKey | 'route';
  className?: string;
  /**
   * Extra inline style merged AFTER the per-page accent, applied to the same `.sanad-web`
   * element. The website (P8) injects the runtime branding `--web-*` surface/text/font vars
   * here so they win over `web-ui.css`'s coded defaults by cascade (inline beats a rule);
   * later keys override the accent too, letting branding drive the accent if it wants.
   */
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * The single place the website's fixed-dark theme (WEB7) attaches: the `.sanad-web` scope (which
 * sources every `--web-*` color, never an admin/portal token) plus the per-page accent injected
 * inline from `pageAccents`, and the locale-derived `dir`. Wrapping the admin preview canvas — or
 * the whole website page (P8) — in this guarantees the content renders as the live site regardless
 * of the host app's light/dark state.
 */
export function WebsiteShell({
  locale,
  pageAccent = 'landing',
  className,
  style,
  children,
}: WebsiteShellProps) {
  const accent = pageAccent === 'route' ? null : pageAccents[pageAccent];
  const mergedStyle = {
    ...(accent
      ? { '--web-accent': accent.accent, '--web-accent-ink': accent.ink }
      : {}),
    ...style,
  } as CSSProperties;

  return (
    <div
      className={className ? `sanad-web ${className}` : 'sanad-web'}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      style={mergedStyle}
    >
      {children}
    </div>
  );
}
