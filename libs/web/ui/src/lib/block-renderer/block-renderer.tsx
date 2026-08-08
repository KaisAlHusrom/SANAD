import { type BlockNode, type Locale, pickLocalized } from '@sanad/contracts';
import { ImageIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { EditableImage } from '../editable/editable-image.js';
import { isEditorMode, type RenderMode } from '../mode/render-mode.js';
import { readCta, readIcon, readStat } from './block-data.js';
import { resolveIcon } from './icon-map.js';

export interface BlockRendererProps {
  node: BlockNode;
  locale: Locale;
  mode: RenderMode;
  /** The owning section's id — threaded so an editable `image` block can build its field path. */
  sectionId?: string;
  /**
   * Resolve a block's `imageMediaId` to a CDN url. Injected by the website (P8) so the lib never
   * imports a data layer; omitted in the admin preview (shows the placeholder frame).
   */
  resolveImageUrl?: (imageMediaId: string) => string;
}

/** A neutral dashed box shown for an empty block in preview mode (the lib is i18n-free). */
function Placeholder() {
  return <div className="web-placeholder" aria-hidden="true" />;
}

/**
 * Renders a single content block to the website's visual form (the same component P8 uses, with
 * `mode='live'`). Tokens-only via the `.web-*` classes (U6); `pickLocalized` keeps copy null-safe
 * (F7). Empty blocks show a placeholder in `preview` and render nothing in `live`.
 */
export function BlockRenderer({
  node,
  locale,
  mode,
  sectionId,
  resolveImageUrl,
}: BlockRendererProps) {
  const title = pickLocalized(node.title, locale);
  const body = pickLocalized(node.body, locale);
  const empty = (isEmpty: boolean) =>
    isEmpty ? isEditorMode(mode) ? <Placeholder /> : null : undefined;

  switch (node.type) {
    case 'stat': {
      const { value, suffix } = readStat(node.data);
      const placeholder = empty(!value && !suffix && !title);
      if (placeholder !== undefined) return placeholder;
      return (
        <div className="web-stat">
          <span className="web-stat-value">
            {value}
            {suffix ? <span className="web-stat-suffix">{suffix}</span> : null}
          </span>
          {title ? <span className="web-stat-label">{title}</span> : null}
        </div>
      );
    }

    case 'cta': {
      const { href, variant } = readCta(node.data);
      const placeholder = empty(!title && !href);
      if (placeholder !== undefined) return placeholder;
      const preventInPreview = isEditorMode(mode)
        ? (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()
        : undefined;
      // Root-relative internal hrefs are authored locale-agnostically (`/contact`); prefix the active
      // locale so a CTA keeps the visitor in their language (the site is `/ar`+`/en` — a bare path
      // would 308 to the default locale). External / hash / already-locale-prefixed hrefs pass through.
      const isInternal =
        href.startsWith('/') &&
        !href.startsWith(`/${locale}/`) &&
        href !== `/${locale}`;
      const resolvedHref = isInternal ? `/${locale}${href}` : href;
      return (
        <a
          className={`web-cta web-cta--${variant}`}
          href={resolvedHref || undefined}
          onClick={preventInPreview}
        >
          {title || '—'}
        </a>
      );
    }

    case 'feature':
    case 'step': {
      const placeholder = empty(!title && !body);
      if (placeholder !== undefined) return placeholder;
      const Icon = resolveIcon(readIcon(node.data));
      return (
        <div className="web-card">
          <Icon className="web-card-icon" size={20} aria-hidden="true" />
          {title ? <span className="web-block-title">{title}</span> : null}
          {body ? <span className="web-card-body">{body}</span> : null}
        </div>
      );
    }

    case 'image': {
      const url = node.imageMediaId
        ? resolveImageUrl?.(node.imageMediaId)
        : undefined;
      // In the studio (edit) the frame becomes an EditableImage → the media picker; live/preview
      // keep the plain frame (byte-identical DOM, so the website ships pure server HTML).
      const frame =
        mode === 'edit' && sectionId ? (
          <EditableImage
            url={url}
            alt={title}
            className="web-image-frame"
            path={{ kind: 'block-image', sectionId, blockId: node.id }}
            placeholder={<ImageIcon size={28} aria-hidden="true" />}
          />
        ) : url ? (
          <img className="web-image-frame" src={url} alt={title} />
        ) : (
          <div className="web-image-frame">
            <ImageIcon size={28} aria-hidden="true" />
          </div>
        );
      return (
        <figure className="web-image">
          {frame}
          {title ? (
            <figcaption className="web-image-caption">{title}</figcaption>
          ) : null}
        </figure>
      );
    }

    case 'richtext': {
      const placeholder = empty(!title && !body);
      if (placeholder !== undefined) return placeholder;
      return (
        <div className="web-richtext">
          {title ? <span className="web-block-title">{title}</span> : null}
          {/* Admin-authored rich text (trusted), rendered as the website will render it. */}
          <div
            className="web-richtext-body"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      );
    }

    case 'text':
    default: {
      const placeholder = empty(!title && !body);
      if (placeholder !== undefined) return placeholder;
      return (
        <div className="web-text">
          {title ? <span className="web-block-title">{title}</span> : null}
          {body ? <span className="web-text-body">{body}</span> : null}
        </div>
      );
    }
  }
}
