"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { HiOutlineLifebuoy } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, textareaClass } from "../shared/AdminFormModal";
import { useAnswerSupportMessage } from "@/services/Support/useAnswerSupportMessage";
import { useDeleteSupportMessage } from "@/services/Support/useDeleteSupportMessage";
import { ContactMessage } from "@/types/Contact";
const ENDPOINT = "/contacts";

interface SupportClientProps {
  initialData?: any;
}

export default function SupportClient({ initialData }: SupportClientProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("all");
  const [target, setTarget] = useState<ContactMessage | null>(null);
  const [answer, setAnswer] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<any>(
    ENDPOINT,
    { limit: 20 },
    {
      initialData,
      getNextPageParam: (lastPage: any) =>
        lastPage?.data?.pagination?.hasMore
          ? lastPage.data.pagination.nextCursor
          : undefined,
    }
  );

  const allMessages: ContactMessage[] = (
    data?.pages?.flatMap((page: any) => page?.data?.data ?? []) || []
  ).filter(Boolean);

  const messages =
    filter === "all"
      ? allMessages
      : allMessages.filter((m) => m.status === filter);

  const { mutate: answerMsg, isPending } = useAnswerSupportMessage(() => {
    setTarget(null);
    setAnswer("");
  });

  const { mutate: removeMsg } = useDeleteSupportMessage();

  function openReply(msg: ContactMessage) {
    setTarget(msg);
    setAnswer(msg.answer ?? "");
  }

  function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!target || !answer.trim()) return;
    answerMsg({ id: target._id, content: answer.trim() });
  }

  function handleDelete(msg: ContactMessage) {
    if (!confirm(`Delete message from "${msg.name}"?`)) return;
    setActioningId(msg._id);
    removeMsg(
      { id: msg._id },
      { onSettled: () => setActioningId(null) }
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Support Messages
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "answered"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors capitalize ${
              filter === f
                ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineLifebuoy}
            title="Contact Requests"
            href="/dashboard/admin/support"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={messages.length === 0}
        errorMessage="Error fetching messages"
        emptyTitle="No messages"
        emptyMessage="Nothing here right now"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>From</Th>
            <Th>Message</Th>
            <Th>Status</Th>
            <Th>Date</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => {
            const busy = actioningId === msg._id;
            return (
              <tr
                key={msg._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-[var(--foreground)]">
                    {msg.name}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {msg.email}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {msg.phone}
                  </p>
                </td>
                <td className="px-6 py-4 max-w-sm">
                  <p className="text-sm text-[var(--foreground)] line-clamp-2">
                    {msg.body}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    tone={msg.status === "answered" ? "success" : "warning"}
                    label={msg.status}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {new Date(msg.createdAt).toLocaleDateString("en-US")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openReply(msg)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors"
                    >
                      {msg.status === "answered" ? "View reply" : "Reply"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(msg)}
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
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      )}

      <AdminFormModal
        isOpen={!!target}
        onClose={() => setTarget(null)}
        title={`Reply to ${target?.name ?? ""}`}
        icon={HiOutlineLifebuoy}
        footer={
          <>
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              form="answer-form"
              disabled={isPending || !answer.trim()}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send Reply"}
            </button>
          </>
        }
      >
        {target && (
          <form
            id="answer-form"
            onSubmit={submitAnswer}
            className="flex flex-col gap-4"
          >
            <div className="p-3 rounded-xl bg-[var(--background-soft)] border border-[var(--border)]">
              <p className="text-xs font-bold text-[var(--foreground-muted)] mb-1">
                Original message
              </p>
              <p className="text-sm text-[var(--foreground)]">{target.body}</p>
            </div>
            <FormField label="Your reply">
              <textarea
                className={textareaClass}
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your response..."
                required
              />
            </FormField>
          </form>
        )}
      </AdminFormModal>
    </div>
  );
}