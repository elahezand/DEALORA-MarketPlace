import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineEye, HiOutlineTag } from "react-icons/hi2";
import { useServerData } from "@/utils/hooks/useServerData";
import { ArticleResponse } from "@/types/Article";

export const revalidate = 60;

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let article: ArticleResponse["data"] | null = null;
  try {
    const res = await useServerData<ArticleResponse>(
      `/articles/${id}`,
      `article-${id}`,
      revalidate
    );
    article = res?.data ?? null;
  } catch {
    article = null;
  }

  if (!article) {
    notFound();
  }

  const categoryName =
    typeof article.category === "object" ? article.category?.title : undefined;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <Link
        href="/supports"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--primary-500)] dark:hover:text-[var(--accent-400)] transition-colors mb-6"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to Support Center
      </Link>

      <div className="card p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-[var(--primary-400)] to-transparent" />

        <div className="mb-8 text-center">
          {categoryName && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--primary-600)] dark:text-[var(--accent-400)] bg-[var(--primary-500)]/10 px-3 py-1 rounded-full mb-4">
              <HiOutlineTag className="w-3.5 h-3.5" /> {categoryName}
            </span>
          )}

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--foreground)]">
            {article.title}
          </h1>

          <p className="mt-3 text-sm font-medium text-[var(--foreground-muted)] max-w-xl mx-auto">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--foreground-subtle)]">
            <span>
              {new Date(article.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <HiOutlineEye className="w-3.5 h-3.5" /> {article.views ?? 0} views
            </span>
          </div>
        </div>

        <div className="prose-sm max-w-none space-y-4 text-sm leading-relaxed text-[var(--foreground-muted)] whitespace-pre-line">
          {article.content}
        </div>
      </div>
    </div>
  );
}
