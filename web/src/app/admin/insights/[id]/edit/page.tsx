import { ArticleEditor } from "@/components/insights/editor/ArticleEditor";

type EditInsightPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditInsightPage({ params }: EditInsightPageProps) {
  const { id } = await params;
  const articleId = Number(id);

  if (!Number.isInteger(articleId) || articleId < 1) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        Invalid article id.
      </main>
    );
  }

  return <ArticleEditor articleId={articleId} />;
}
