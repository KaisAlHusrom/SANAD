import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  pickLocalized,
  type Locale,
  type PortfolioProjectItem,
} from '@sanad/contracts';
import {
  getPortfolio,
  getPortfolioProject,
} from '../../../../src/data/portfolio';
import { resolveMediaUrls } from '../../../../src/data/media';
import { makeImageResolver } from '../../../../src/media';
import { CaseStudy } from '../../../../src/components/marketing';
import { SystemStage } from '../../../../src/motion/universe';

/**
 * A case-study detail page (`/portfolio/[slug]`) — server-rendered (WEB2), 100% DB-driven (WEB1).
 * Loads the published project by slug (404 on miss), its cover url (batch resolver), and up to 3
 * related projects. Metadata comes from the entity (SEO). Idles in the SAME works "Galaxy" system
 * as the index, so index↔detail is an intra-system hop, seeded off the slug (P8.E/WEB12).
 */
type Params = Promise<{ locale: string; slug: string }>;

async function load(params: Params): Promise<{
  locale: Locale;
  slug: string;
  project: PortfolioProjectItem | null;
  related: PortfolioProjectItem[];
}> {
  const { locale, slug } = await params;
  const [project, all] = await Promise.all([
    getPortfolioProject(slug).catch(() => null),
    getPortfolio(24).catch(() => [] as PortfolioProjectItem[]),
  ]);
  const related = all.filter((item) => item.slug !== slug).slice(0, 3);
  return { locale: locale as Locale, slug, project, related };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, project } = await load(params);
  if (!project) return {};
  return {
    title: pickLocalized(project.title, locale),
    description: pickLocalized(project.summary, locale),
  };
}

export default async function CaseStudyPage({ params }: { params: Params }) {
  const { locale, slug, project, related } = await load(params);
  if (!project) notFound();

  const media = await resolveMediaUrls(
    project.coverMediaId ? [project.coverMediaId] : [],
  );
  const coverUrl = project.coverMediaId
    ? makeImageResolver(media)(project.coverMediaId)
    : '';

  return (
    <SystemStage system="works" slug={slug}>
      <div className="site-content">
        <CaseStudy
          project={project}
          related={related}
          coverUrl={coverUrl}
          locale={locale}
        />
      </div>
    </SystemStage>
  );
}
