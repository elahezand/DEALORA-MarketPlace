"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HiOutlineRectangleGroup, HiOutlinePlus, HiChevronDown } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import { CategoriesTypeResponse, AdminCategory } from "@/types/Category";
import { useDeleteCategory } from "@/services/Categories/useDeleteCategory";
import { flattenCategories } from "@/utils/flattenCategories";
import EditandCreateCategory from "./EditandCreateCategory";

const ENDPOINT = "/categories";

const getParentId = (parent: AdminCategory["parent"]): string => {
  if (!parent) return "";
  return typeof parent === "string" ? parent : parent._id ?? "";
};

const getChildren = (cat: AdminCategory): AdminCategory[] =>
  (cat as any).subCategories ?? cat.children ?? [];

interface CategoriesPageProps {
  initialData?: CategoriesTypeResponse;
}

export default function CategoriesPage({ initialData }: CategoriesPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useGet<CategoriesTypeResponse>(
    ENDPOINT,
    undefined,
    { initialData }
  );
  const categoryTree = data?.data ?? [];
  const flatCategories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const { mutate: removeCategory } = useDeleteCategory(() => setActioningId(null));

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEdit(cat: AdminCategory) {
    setEditingCategory(cat);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
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

  function renderRows(nodes: AdminCategory[], depth = 0): React.ReactNode[] {
    return nodes.flatMap((cat) => {
      const children = getChildren(cat);
      const hasChildren = children.length > 0;
      const isOpen = openIds.has(cat._id);
      const busy = actioningId === cat._id;
      const parentId = getParentId(cat.parent);
      const parentCat = parentId ? flatCategories.find((c) => c._id === parentId) : null;
      const filterCount = cat.filters?.length ?? 0;

      const row = (
        <tr key={cat._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
          <td className="px-6 py-4">
            <div style={{ paddingLeft: depth * 24 }} className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggle(cat._id)}
                  className="shrink-0 p-1 -m-1 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  <HiChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm text-[var(--foreground)]">{cat.title}</p>
                {cat.description && (
                  <p className="text-xs text-[var(--foreground-muted)] truncate max-w-xs">{cat.description}</p>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 text-sm font-mono text-[var(--foreground-muted)]">{cat.slug}</td>
          <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
            {parentCat ? parentCat.title : <span className="italic text-[var(--foreground-subtle)]">Top-level</span>}
          </td>
          <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
            {filterCount > 0 ? `${filterCount} filter${filterCount === 1 ? "" : "s"}` : "—"}
          </td>
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

      return hasChildren && isOpen
        ? [row, ...renderRows(children, depth + 1)]
        : [row];
    });
  }

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
        isEmpty={categoryTree.length === 0}
        errorMessage="Error fetching categories"
        emptyTitle="No categories yet"
        emptyMessage="Create your first category to get started"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Title</Th>
            <Th>Slug</Th>
            <Th>Parent</Th>
            <Th>Filters</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>{renderRows(categoryTree)}</tbody>
      </TableCard>

      <EditandCreateCategory
        isOpen={modalOpen}
        onClose={closeModal}
        category={editingCategory}
        categories={flatCategories}
      />
    </div>
  );
}