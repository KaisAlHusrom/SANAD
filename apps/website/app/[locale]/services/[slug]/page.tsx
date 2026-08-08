import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pickLocalized, type Locale, type ServiceItem } from '@sanad/contracts';
import { getService, getServices } from '../../../../src/data/services';
import { resolveMediaUrls } from '../../../../src/data/media';
import { makeImageResolver } from '../../../../src/media';
import { ServiceDetail } from '../../../../src/components/marketing';
import { SystemStage } from '../../../../src/motion/universe';

/**
 * A service detail page (`/services/[slug]`) — server-rendered (WEB2), 100% DB-driven (WEB1).
 * Loads the service by slug (404 on miss), its cover url (batch resolver), and up to 3 related
 * core services. Metadata comes from the entity (SEO).
 */
type Params = Promise<{ locale: string; slug: string }>;

async function load(params: Params): Promise<{
  locale: Locale;
  service: ServiceItem | null;
  related: ServiceItem[];
}> {
  const { locale, slug } = await params;
  const [service, all] = await Promise.all([
    getService(slug).catch(() => null),
    getServices().catch(() => [] as ServiceItem[]),
  ]);
  const related = all
    .filter((item) => item.category === 'core' && item.slug !== slug)
    .slice(0, 3);
  return { locale: locale as Locale, service, related };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, service } = await load(params);
  if (!service) return {};
  return {
    title: pickLocalized(service.title, locale),
    description: pickLocalized(service.summary, locale),
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, service, related } = await load(params);
  if (!service) notFound();

  const media = await resolveMediaUrls(
    service.coverMediaId ? [service.coverMediaId] : [],
  );
  const coverUrl = service.coverMediaId
    ? makeImageResolver(media)(service.coverMediaId)
    : '';

  return (
    <SystemStage system="serviceDetail" slug={service.slug}>
      <div className="site-content">
        <ServiceDetail
          service={service}
          related={related}
          coverUrl={coverUrl}
          locale={locale}
        />
      </div>
    </SystemStage>
  );
}
