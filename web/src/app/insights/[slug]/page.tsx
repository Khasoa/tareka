import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import DirectoryCTA from "@/components/DirectoryCTA";
import Header from "@/components/Header";
import { getAllInsights, getInsightBySlug } from "@/lib/insights";

type InsightPageProps = {
  params: Promise<{ slug: string }>;
};

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function generateStaticParams() {
  return getAllInsights().map((insight) => ({
    slug: insight.slug,
  }));
}

export async function generateMetadata({
  params,
}: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    return {
      title: "Article not found | tareka",
    };
  }

  return {
    title: `${insight.frontmatter.title} | tareka`,
    description: insight.frontmatter.excerpt,
    openGraph: {
      title: insight.frontmatter.title,
      description: insight.frontmatter.excerpt,
      type: "article",
      ...(insight.frontmatter.cover_image
        ? { images: [insight.frontmatter.cover_image] }
        : {}),
    },
  };
}

export default async function InsightPage({ params }: InsightPageProps) {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }

  const { frontmatter, content } = insight;

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
        <Link
          href="/insights"
          className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          ← All insights
        </Link>

        <header className="mt-7 border-b border-[var(--color-border-strong)] pb-8">
          <p className="kicker">
            {frontmatter.category}
          </p>

          <h1 className="page-heading mt-3 leading-tight">
            {frontmatter.title}
          </h1>

          <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
            {frontmatter.excerpt}
          </p>

          <p className="mt-5 text-sm text-[var(--color-muted)]">
            <time dateTime={frontmatter.published_at}>
              Published {formatPublishedDate(frontmatter.published_at)}
            </time>
          </p>
        </header>

        {frontmatter.cover_image && (
          <figure className="mt-8">
            <Image
              src={frontmatter.cover_image}
              alt={frontmatter.image_alt ?? ""}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="aspect-[16/9] w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] object-cover"
            />
          </figure>
        )}

        <article className="prose mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-[var(--color-heading)] prose-p:leading-7 prose-p:text-[var(--color-body)] prose-a:text-[var(--color-body)] prose-a:decoration-[var(--color-accent)] prose-a:decoration-2 prose-a:underline-offset-4 prose-strong:text-[var(--color-heading)] prose-li:leading-7">
          <MDXRemote
            source={content}
            components={{
              DirectoryCTA,
            }}
          />
        </article>

        <div className="mt-12 border-t border-[var(--color-border-strong)] pt-6">
          <Link
            href="/#directory"
            className="link-accent text-sm font-medium"
          >
            Find a recovery business →
          </Link>
        </div>
      </main>
    </>
  );
}