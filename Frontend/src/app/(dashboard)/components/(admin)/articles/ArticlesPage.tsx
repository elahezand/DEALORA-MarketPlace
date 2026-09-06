"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineNewspaper, HiOutlinePlus } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet, useGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass, textareaClass } from "../shared/AdminFormModal";
import {
  ArticleFormState,
  IArticle,
  ArticlesResponse,
  CreateArticlePayload,
  UpdateArticlePayload,
} from "@/types/Article";
import { CategoriesTypeResponse } from "@/types/Category";
import { useCreateArticle } from "@/services/Article/useCreateArticle";
import { useUpdateArticle } from "@/services/Article/useUpdateArticle";
import { useDeleteArticle } from "@/services/Article/useDeleteArticle";

const ENDPOINT = "/articles/admin";

const EMPTY_FORM: ArticleFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  isPublished: true,
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

interface ArticlesClientProps {
  initialData?: InfiniteData<ArticlesResponse>;
}

export default function ArticlesClient({ initialData }: ArticlesClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ArticleFormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<ArticlesResponse>(ENDPOINT, { limit: 20 }, { initialData });

  const { data: categoriesData } = useGet<CategoriesTypeResponse>("/categories");
  const categories = categoriesData?.data ?? [];

  const articles: IArticle[] = (
    data?.pages?.flatMap((page: ArticlesResponse) => page?.data?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: createArticle, isPending: isCreating } = useCreateArticle(closeModal);
  const { mutate: updateArticle, isPending: isUpdating } = useUpdateArticle(closeModal);
  const { mutate: removeArticle } = useDeleteArticle();

  function openCreate() {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setModalOpen(true);
  }

  function openEdit(a: IArticle) {
    setForm({
      _id: a._id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      category: typeof a.category === "object" ? a.category?._id ?? "" : a.category ?? "",
      isPublished: a.isPublished,
    });
    setSlugTouched(true);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  }

  function handleTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim() || !form.excerpt.trim() || !form.content.trim()) return;

    const payload: Omit<CreateArticlePayload, "slug"> & { slug: string } = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category || null,
      isPublished: form.isPublished,
    };

    if (form._id) {
      const updatePayload: UpdateArticlePayload = { _id: form._id, ...payload };
      updateArticle(updatePayload);
    } else {
      createArticle(payload);
    }
  }

  function handleDelete(a: IArticle) {
    toast.warning(`Delete article "${a.title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          setActioningId(a._id);
          removeArticle({ id: a._id }, { onSettled: () => setActioningId(null) });
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Admin</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">Articles</h1>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary !w-auto px-4 h-10 text-sm flex items-center gap-1.5">
          <HiOutlinePlus className="w-4 h-4" /> New Article
        </button>
      </div>

      <TableCard
        header={<WidgetHeader icon={HiOutlineNewspaper} title="All Articles" href="/dashboard/admin/articles" />}
        isLoading={isLoading}
        isError={isError}
        isEmpty={articles.length === 0}
        errorMessage="Error fetching articles"
        emptyTitle="No articles yet"
        emptyMessage="Create your first support article"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Title</Th>
            <Th>Category</Th>
            <Th>Views</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => {
            const busy = actioningId === a._id;
            const categoryName = typeof a.category === "object" ? a.category?.title : undefined;
            return (
              <tr key={a._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                <td className="px-6 py-4 max-w-sm">
                  <p className="font-bold text-sm text-[var(--foreground)] line-clamp-1">{a.title}</p>
                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-1">{a.excerpt}</p>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {categoryName || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {a.views ?? 0}
                </td>
                <td className="px-6 py-4">
                  <Badge tone={a.isPublished ? "success" : "neutral"} label={a.isPublished ? "Published" : "Draft"} />
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {new Date(a.createdAt).toLocaleDateString("en-US")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(a)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      {hasNextPage && (
        <div className="flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      <AdminFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={form._id ? "Edit Article" : "New Article"}
        icon={HiOutlineNewspaper}
        maxWidth="max-w-[680px]"
        footer={
          <>
            <button type="button" onClick={closeModal} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              form="article-form"
              disabled={isSaving || !form.title.trim() || !form.excerpt.trim() || !form.content.trim()}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isSaving ? "Saving..." : form._id ? "Save Changes" : "Create Article"}
            </button>
          </>
        }
      >
        <form id="article-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="How to post an ad"
              required
            />
          </FormField>
          <FormField label="Slug">
            <input
              className={`${inputClass} font-mono`}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
              }}
              placeholder="how-to-post-an-ad"
              required
            />
          </FormField>
          <FormField label="Excerpt">
            <textarea
              className={textareaClass}
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="A short one- or two-sentence summary shown in listings"
              required
            />
          </FormField>
          <FormField label="Content">
            <textarea
              className={textareaClass}
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Full article content"
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category (optional)">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className={inputClass}
                value={form.isPublished ? "published" : "draft"}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.value === "published" }))}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </FormField>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}
