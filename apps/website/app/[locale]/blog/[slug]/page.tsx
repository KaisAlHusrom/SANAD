import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  pickLocalized,
  type BlogPostItem,
  type Locale,
} from '@sanad/contracts';
import { getBlogPost, getBlogPosts } from '../../../../src/data/blog';
import { resolveMediaUrls } from '../../../../src/data/media';
import { makeImageResolver } from '../../../../src/media';
import { Post } from '../../../../src/components/marketing';
import { SystemStage } from '../../../../src/motion/universe';

/**
 * A blog post detail page (`/blog/[slug]`) — server-rendered (WEB2), 100% DB-driven (WEB1). Loads
 * the published post by slug (404 on miss), its optional cover url (batch resolver), and up to 3
 * related posts (siblings). Metadata comes from the entity (SEO). Idles in the SAME blog "Logbook"
 * system as the index, so index↔post is an intra-system hop, seeded off the slug (P8.E-3/WEB12).
 */
type Params = Promise<{ locale: string; slug: string }>;

async function load(params: Params): Promise<{
  locale: Locale;
  slug: string;
  post: BlogPostItem | null;
  related: BlogPostItem[];
}> {
  const { locale, slug } = await params;
  const [post, all] = await Promise.all([
    getBlogPost(slug).catch(() => null),
    getBlogPosts(24).catch(() => [] as BlogPostItem[]),
  ]);
  const related = all.filter((item) => item.slug !== slug).slice(0, 3);
  return { locale: locale as Locale, slug, post, related };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, post } = await load(params);
  if (!post) return {};
  return {
    title: pickLocalized(post.title, locale),
    description: pickLocalized(post.excerpt, locale),
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { locale, slug, post, related } = await load(params);
  if (!post) notFound();

  const media = await resolveMediaUrls(
    post.coverMediaId ? [post.coverMediaId] : [],
  );
  const coverUrl = post.coverMediaId
    ? makeImageResolver(media)(post.coverMediaId)
    : '';

  return (
    <SystemStage system="blog" slug={slug}>
      <div className="site-content">
        <Post
          post={post}
          related={related}
          coverUrl={coverUrl}
          locale={locale}
        />
      </div>
    </SystemStage>
  );
}
