"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineRectangleGroup, HiOutlinePlus } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass, textareaClass } from "../shared/AdminFormModal";
import { CategoriesTypeResponse,AdminCategory } from "@/types/Category";
import { useCreateCategory } from "@/services/Categories/useGetCategory";
import { useDeleteCategory } from "@/services/Categories/useDeleteCategory";
import { useUpdateCategory } from "@/services/Categories/useUpdateCategory";

const ENDPOINT = "/categories";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

interface FormState {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { title: "", slug: "", description: "", isActive: true };

interface CategoriesClientProps {
  initialData?: CategoriesTypeResponse;
}

export default function CategoriesClient({ initialData }: CategoriesClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Fetching Data with Initial Server Data
  const { data, isLoading, isError } = useGet<CategoriesTypeResponse>(
    ENDPOINT,
    undefined,
    { initialData }
  );
  const categories = data?.data ?? [];

  // Service Mutations
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory(closeModal);
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory(closeModal);
  const { mutate: removeCategory } = useDeleteCategory(() => setActioningId(null));

  function openCreate() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(cat: AdminCategory) {
    setForm({
      _id: cat._id,
      title: cat.title,
      slug: cat.slug,
      description: cat.description ?? "",
      isActive: cat.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return;

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
      filters: [],
    };

    if (form._id) {
      updateCategory({ _id: form._id, ...payload });
    } else {
      createCategory(payload);
    }
  }

  function handleDelete(cat: AdminCategory) {
    toast.warning(`Delete category "${cat.title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          setActioningId(cat._id);
          removeCategory({ id: cat._id });
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
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            Categories
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary !w-auto px-4 h-10 text-sm flex items-center gap-1.5"
        >
          <HiOutlinePlus className="w-4 h-4" /> New Category
        </button>
      </div>

      <TableCard
        header={<WidgetHeader icon={HiOutlineRectangleGroup} title="All Categories" href="/dashboard/admin/categories" />}
        isLoading={isLoading}
        isError={isError}
        isEmpty={categories.length === 0}
        errorMessage="Error fetching categories"
        emptyTitle="No categories yet"
        emptyMessage="Create your first category to get started"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Title</Th>
            <Th>Slug</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const busy = actioningId === cat._id;
            return (
              <tr key={cat._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-[var(--foreground)]">{cat.title}</p>
                  {cat.description && (
                    <p className="text-xs text-[var(--foreground-muted)] truncate max-w-xs">{cat.description}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-[var(--foreground-muted)]">{cat.slug}</td>
                <td className="px-6 py-4">
                  <Badge tone={cat.isActive ? "success" : "neutral"} label={cat.isActive ? "Active" : "Inactive"} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(cat)}
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

      <AdminFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={form._id ? "Edit Category" : "New Category"}
        icon={HiOutlineRectangleGroup}
        footer={
          <>
            <button type="button" onClick={closeModal} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={isSaving || !form.title.trim() || !form.slug.trim()}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isSaving ? "Saving..." : form._id ? "Save Changes" : "Create Category"}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: f._id ? f.slug : slugify(title),
                }));
              }}
              placeholder="e.g. Electronics"
              required
            />
          </FormField>
          <FormField label="Slug">
            <input
              className={`${inputClass} font-mono`}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              placeholder="electronics"
              required
            />
          </FormField>
          <FormField label="Description (optional)">
            <textarea
              className={textareaClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description of this category"
            />
          </FormField>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-[var(--border)]"
            />
            <span className="text-xs font-bold text-[var(--foreground-muted)]">Active</span>
          </label>
        </form>
      </AdminFormModal>
    </div>
  );
}