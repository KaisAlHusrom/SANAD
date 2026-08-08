import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { rpcError, type MessageKey } from '@sanad/i18n';

/**
 * Each content entity gets its OWN not-found key, because "لم يتم العثور على المقالة" reads
 * naturally while a generic sentence with an English entity name pasted in does not (U24).
 * An entity with no entry here falls back to the generic key.
 */
const NOT_FOUND_KEYS: Record<string, MessageKey> = {
  Page: 'content.notFound.page',
  Section: 'content.notFound.section',
  Block: 'content.notFound.block',
  BlogPost: 'content.notFound.blogPost',
  BlogCategory: 'content.notFound.blogCategory',
  BlogTag: 'content.notFound.blogTag',
  Service: 'content.notFound.service',
  PortfolioProject: 'content.notFound.portfolioProject',
  PortfolioCategory: 'content.notFound.portfolioCategory',
  TeamMember: 'content.notFound.teamMember',
  Testimonial: 'content.notFound.testimonial',
  Faq: 'content.notFound.faq',
  Menu: 'content.notFound.menu',
  MenuItem: 'content.notFound.menuItem',
  Lead: 'content.notFound.lead',
};

/**
 * RMQ-friendly content failures carrying an HTTP `statusCode` + a **message key** so the
 * gateway's `toHttpException` maps the status and the edge renders the text in the caller's
 * locale (MS2, U24). Domain errors thrown in a `@MessagePattern` handler MUST be
 * `RpcException`s — a plain Nest `HttpException` doesn't serialize its status across the broker.
 */
export function contentNotFound(
  entity: string,
  idOrSlug: string,
): RpcException {
  return rpcError(
    HttpStatus.NOT_FOUND,
    NOT_FOUND_KEYS[entity] ?? 'content.notFound',
    { idOrSlug },
  );
}

export function slugConflict(slug: string): RpcException {
  return rpcError(HttpStatus.CONFLICT, 'content.slugConflict', { slug });
}
