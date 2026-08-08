import {
  pickLocalized,
  type BlogPostItem,
  type FaqItem,
  type PortfolioProjectItem,
  type SectionNode,
  type ServiceItem,
  type TeamMemberItem,
  type TestimonialItem,
} from '@sanad/contracts';
import { ArrowUpRight, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ServerSelect } from '../../../components/server-select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SelectField } from '../../../components/ui/select';
import {
  useGetBlogByIdsQuery,
  useSearchBlogLookupQuery,
} from '../../../data/lookups/blog-lookup.api';
import {
  useGetPortfolioByIdsQuery,
  useSearchPortfolioLookupQuery,
} from '../../../data/lookups/portfolio-lookup.api';
import {
  useGetServicesByIdsQuery,
  useSearchServiceLookupQuery,
} from '../../../data/lookups/service-lookup.api';
import {
  useGetTestimonialsByIdsQuery,
  useSearchTestimonialsLookupQuery,
} from '../../../data/lookups/testimonials-lookup.api';
import {
  useGetFaqsByIdsQuery,
  useSearchFaqLookupQuery,
} from '../../../data/lookups/faq-lookup.api';
import {
  useGetTeamMembersByIdsQuery,
  useSearchTeamMemberLookupQuery,
} from '../../../data/lookups/team-member-lookup.api';
import { useDirection } from '../../../providers/direction/use-direction';
import {
  collectionMetaFor,
  useSectionConfig,
} from '../hooks/use-section-config';

/**
 * The collection-link panel for a collection-backed section (`services` — Phase 3). Sits between the
 * section's copy form and its blocks list; renders only for section types that link a collection and
 * only for `content.manage`. Lets the owner choose HOW the section selects its records — mode
 * (all / hand-picked), a limit, and (for `picked`) a `ServerSelect` over the services (W5) — plus a
 * "Manage services →" deep-link to the records themselves. Saving persists `section.config`; the
 * tree re-hydrates so the preview updates (preview===live). Styled to the admin canon (U21).
 */
export function SectionConfigPanel({
  pageId,
  section,
}: {
  pageId: string;
  section: SectionNode;
}) {
  const { t } = useTranslation('pages');
  const { locale } = useDirection();
  const meta = collectionMetaFor(section.type);
  const {
    mode,
    setMode,
    limit,
    setLimit,
    ids,
    setIds,
    isDirty,
    isSaving,
    save,
  } = useSectionConfig(pageId, section);

  if (!meta) return null;
  const collectionName = t(meta.nameKey);

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface-2 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-accent" aria-hidden="true" />
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-text">
              {t('config.title')}
            </h3>
            <p className="text-xs text-faint">
              {t('config.description', { collection: collectionName })}
            </p>
          </div>
        </div>
        <Link
          to={meta.manageTo}
          className="inline-flex items-center gap-1 rounded-input border border-border px-2.5 py-1 text-xs text-dim transition-colors hover:border-accent-line hover:text-text"
        >
          {t('config.manage', { collection: collectionName })}
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-dim">
            {t('config.mode')}
          </span>
          <SelectField
            size="sm"
            value={mode}
            onValueChange={(value) => setMode(value as typeof mode)}
            options={meta.modes.map((value) => ({
              value,
              label: t(`config.modes.${value}`),
            }))}
            aria-label={t('config.mode')}
          />
        </label>
        {mode !== 'picked' ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-dim">
              {t('config.limit')}
            </span>
            <Input
              type="number"
              min={1}
              max={50}
              inputMode="numeric"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder={t('config.limitPlaceholder')}
              className="h-9"
              aria-label={t('config.limit')}
            />
          </label>
        ) : null}
      </div>

      {mode === 'picked' ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-dim">
            {t('config.picked')}
          </span>
          {/* exactly one branch matches meta.pickedCollection — each bridges a different lookup (W5) */}
          {meta.pickedCollection === 'services' && (
            <ServerSelect<ServiceItem>
              multiple
              value={ids}
              onChange={(next) => setIds(Array.isArray(next) ? next : [])}
              useSearch={useSearchServiceLookupQuery}
              useResolveByIds={useGetServicesByIdsQuery}
              getOptionValue={(service) => service.id}
              getOptionLabel={(service) => pickLocalized(service.title, locale)}
              placeholder={t('config.pickedPlaceholder')}
            />
          )}
          {meta.pickedCollection === 'portfolio' && (
            <ServerSelect<PortfolioProjectItem>
              multiple
              value={ids}
              onChange={(next) => setIds(Array.isArray(next) ? next : [])}
              useSearch={useSearchPortfolioLookupQuery}
              useResolveByIds={useGetPortfolioByIdsQuery}
              getOptionValue={(project) => project.id}
              getOptionLabel={(project) => pickLocalized(project.title, locale)}
              placeholder={t('config.pickedPlaceholder')}
            />
          )}
          {meta.pickedCollection === 'testimonials' && (
            <ServerSelect<TestimonialItem>
              multiple
              value={ids}
              onChange={(next) => setIds(Array.isArray(next) ? next : [])}
              useSearch={useSearchTestimonialsLookupQuery}
              useResolveByIds={useGetTestimonialsByIdsQuery}
              getOptionValue={(item) => item.id}
              // testimonials have no title — label by the author's proper name
              getOptionLabel={(item) => item.authorName}
              placeholder={t('config.pickedPlaceholder')}
            />
          )}
          {meta.pickedCollection === 'blog' && (
            <ServerSelect<BlogPostItem>
              multiple
              value={ids}
              onChange={(next) => setIds(Array.isArray(next) ? next : [])}
              useSearch={useSearchBlogLookupQuery}
              useResolveByIds={useGetBlogByIdsQuery}
              getOptionValue={(post) => post.id}
              getOptionLabel={(post) => pickLocalized(post.title, locale)}
              placeholder={t('config.pickedPlaceholder')}
            />
          )}
          {meta.pickedCollection === 'faq' && (
            <ServerSelect<FaqItem>
              multiple
              value={ids}
              onChange={(next) => setIds(Array.isArray(next) ? next : [])}
              useSearch={useSearchFaqLookupQuery}
              useResolveByIds={useGetFaqsByIdsQuery}
              getOptionValue={(item) => item.id}
              // FAQs have no title — label by the question
              getOptionLabel={(item) => pickLocalized(item.question, locale)}
              placeholder={t('config.pickedPlaceholder')}
            />
          )}
          {meta.pickedCollection === 'team' && (
            <ServerSelect<TeamMemberItem>
              multiple
              value={ids}
              onChange={(next) => setIds(Array.isArray(next) ? next : [])}
              useSearch={useSearchTeamMemberLookupQuery}
              useResolveByIds={useGetTeamMembersByIdsQuery}
              getOptionValue={(member) => member.id}
              getOptionLabel={(member) => pickLocalized(member.name, locale)}
              placeholder={t('config.pickedPlaceholder')}
            />
          )}
        </label>
      ) : null}

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button
          type="button"
          size="sm"
          loading={isSaving}
          disabled={!isDirty}
          onClick={save}
        >
          {t('config.save')}
        </Button>
      </div>
    </section>
  );
}
