"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineTicket, HiOutlinePlus } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass } from "../shared/AdminFormModal";
import { FormState, Coupon, CouponsResponse, CreateCouponPayload, UpdateCouponPayload } from "@/types/Coupon";
import { useToggleActiveCoupon,} from "@/services/Coupon/useToggleActiveCoupon";
import { useDeleteCoupon } from "@/services/Coupon/useDeleteCoupon";
import { useCreateCoupon } from "@/services/Coupon/useCreateCoupon";
import { useUpdateCoupon } from "@/services/Coupon/useUpdateCoupon";

const ENDPOINT = "/coupon/admin";

const EMPTY_FORM: FormState = {
  code: "",
  type: "percent",
  amount: "",
  maxDiscount: "",
  isActive: true,
  expiresAt: "",
  usageLimit: "",
};

interface CouponsClientProps {
  initialData?: InfiniteData<CouponsResponse>;
}

export default function CouponsClient({ initialData }: CouponsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<CouponsResponse>(
    ENDPOINT,
    { limit: 20 },
    { initialData }
  );

  const coupons: Coupon[] = (
    data?.pages?.flatMap((page: CouponsResponse) => page?.data?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: createCoupon, isPending: isCreating } = useCreateCoupon(closeModal);
  const { mutate: updateCoupon, isPending: isUpdating } = useUpdateCoupon(closeModal);
  const { mutate: toggleActive } = useToggleActiveCoupon();
  const { mutate: removeCoupon } = useDeleteCoupon();

  function openCreate() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(c: Coupon) {
    setForm({
      _id: c._id,
      code: c.code,
      type: c.type,
      amount: String(c.amount),
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.amount) return;

    const payload: Omit<CreateCouponPayload, "code"> = {
      type: form.type,
      amount: Number(form.amount),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      isActive: form.isActive,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    };

    if (form._id) {
      const updatePayload: UpdateCouponPayload = { _id: form._id, ...payload };
      updateCoupon(updatePayload);
    } else {
      createCoupon({ code: form.code.trim().toUpperCase(), ...payload });
    }
  }

  function handleToggle(c: Coupon) {
    setActioningId(c._id);
    toggleActive(
      { _id: c._id, isActive: !c.isActive },
      { onSettled: () => setActioningId(null) }
    );
  }

  function handleDelete(c: Coupon) {
    toast.warning(`Delete coupon "${c.code}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          setActioningId(c._id);
          removeCoupon({ id: c._id }, { onSettled: () => setActioningId(null) });
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
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">Coupons</h1>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary !w-auto px-4 h-10 text-sm flex items-center gap-1.5">
          <HiOutlinePlus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      <TableCard
        header={<WidgetHeader icon={HiOutlineTicket} title="All Coupons" href="/dashboard/admin/coupons" />}
        isLoading={isLoading}
        isError={isError}
        isEmpty={coupons.length === 0}
        errorMessage="Error fetching coupons"
        emptyTitle="No coupons yet"
        emptyMessage="Create your first discount coupon"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Code</Th>
            <Th>Discount</Th>
            <Th>Usage</Th>
            <Th>Expires</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => {
            const busy = actioningId === c._id;
            return (
              <tr key={c._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-[var(--foreground)] font-mono">{c.code}</p>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                  {c.type === "percent" ? `${c.amount}%` : `$${c.amount.toLocaleString()}`}
                  {c.maxDiscount != null && c.type === "percent" && (
                    <span className="text-xs text-[var(--foreground-muted)]"> (max ${c.maxDiscount})</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {c.usedCount ?? 0}{c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-US") : "Never"}
                </td>
                <td className="px-6 py-4">
                  <Badge tone={c.isActive ? "success" : "neutral"} label={c.isActive ? "Active" : "Inactive"} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleToggle(c)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors disabled:opacity-40"
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(c)}
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
        title={form._id ? "Edit Coupon" : "New Coupon"}
        icon={HiOutlineTicket}
        footer={
          <>
            <button type="button" onClick={closeModal} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors">
              Cancel
            </button>
            <button type="submit" form="coupon-form" disabled={isSaving || !form.code.trim() || !form.amount} className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50">
              {isSaving ? "Saving..." : form._id ? "Save Changes" : "Create Coupon"}
            </button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Code">
            <input
              className={`${inputClass} font-mono uppercase`}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER25"
              disabled={!!form._id}
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FormState["type"] }))}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </FormField>
            <FormField label={form.type === "percent" ? "Percent off" : "Amount off"}>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </FormField>
          </div>
          {form.type === "percent" && (
            <FormField label="Max discount cap (optional)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.maxDiscount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                placeholder="No cap"
              />
            </FormField>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Expires (optional)">
              <input
                type="date"
                className={inputClass}
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </FormField>
            <FormField label="Usage limit (optional)">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                placeholder="Unlimited"
              />
            </FormField>
          </div>
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