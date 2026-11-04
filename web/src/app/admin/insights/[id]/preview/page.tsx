import { InsightPreviewClient } from "@/components/insights/editor/InsightPreviewClient";

type PreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InsightPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const articleId = Number(id);

  if (!Number.isInteger(articleId) || articleId < 1) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        Invalid article id.
      </main>
    );
  }

  return <InsightPreviewClient articleId={articleId} />;
}
