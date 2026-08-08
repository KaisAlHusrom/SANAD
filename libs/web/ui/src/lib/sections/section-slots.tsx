import type { ComponentType, ReactNode } from 'react';

/**
 * Motion is INJECTED, never imported. The shared per-type section components stay pure server
 * components (data-free, framer-free) so `@sanad/web-ui` keeps its `type:ui` boundary and the
 * website's SEO text is server-rendered. The website passes its real client wrappers (`Reveal`,
 * `WordReveal`, `CountUpNumber`) as these slots for `mode='live'`; the admin preview passes none,
 * so the same markup renders faithfully-STATIC (the owner's decision) — no 3D, no scroll motion.
 */
export interface SectionSlots {
  /** Scroll-reveal wrapper. Default: a plain element (no animation). */
  Reveal?: ComponentType<{
    children: ReactNode;
    className?: string;
    delayMs?: number;
  }>;
  /** Word-split headline. Default: renders the text as an `<h1>`, honoring `<br>` line breaks. */
  Headline?: ComponentType<{ text: string; className?: string }>;
  /** Count-up number. Default: renders the value + suffix statically. */
  Counter?: ComponentType<{ value: number; suffix?: string }>;
  /**
   * The hero CTA row (rendered inside `.web-hero-actions`). Default: two static `<span
   * class="web-cta">` labels (no links — the admin preview). The website injects the real
   * navigation (a warp CTA to `/request-a-project` + the `#works` anchor) for `mode='live'`.
   */
  Actions?: ComponentType<{ primaryLabel: string; secondaryLabel: string }>;
  /**
   * A full-bleed backdrop rendered first inside the section — the hero's legibility veil over the
   * cosmos star. Default: nothing (the admin preview shows the flat surface).
   */
  Backdrop?: ComponentType;
  /**
   * A trailing cue below the hero content — the "begin the journey" scroll indicator. Default:
   * nothing (website-only chrome, injected for `mode='live'`).
   */
  Cue?: ComponentType;
}

/** A static reveal (no motion) — the default when the admin renders the section. */
export function PlainReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className ?? undefined}>{children}</div>;
}

/** A static headline that honors literal `<br>` markers in a CMS title (no framer). */
export function PlainHeadline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split(/<br\s*\/?>/i);
  return (
    <h1 className={className ?? undefined}>
      {lines.map((line, index) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </h1>
  );
}

/** A static number (no count-up) — the default when the admin renders the section. */
export function PlainCounter({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

/** The default hero CTA row — static labels (no links), shown in the admin preview. */
export function PlainActions({
  primaryLabel,
  secondaryLabel,
}: {
  primaryLabel: string;
  secondaryLabel: string;
}) {
  return (
    <>
      <span className="web-cta web-cta--primary">{primaryLabel}</span>
      <span className="web-cta web-cta--secondary">{secondaryLabel}</span>
    </>
  );
}

/** The default for a website-only chrome slot (Backdrop / Cue) — renders nothing. */
export function NoSlot() {
  return null;
}

/** Resolve the slots to concrete components, defaulting each to its static passthrough. */
export function resolveSlots(
  slots: SectionSlots | undefined,
): Required<SectionSlots> {
  return {
    Reveal: slots?.Reveal ?? PlainReveal,
    Headline: slots?.Headline ?? PlainHeadline,
    Counter: slots?.Counter ?? PlainCounter,
    Actions: slots?.Actions ?? PlainActions,
    Backdrop: slots?.Backdrop ?? NoSlot,
    Cue: slots?.Cue ?? NoSlot,
  };
}
