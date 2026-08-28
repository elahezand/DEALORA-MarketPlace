"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineBell, HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { useGetProfile } from "@/services/Profile/getProfile";
import { AdminFormModal, FormField, textareaClass } from "../shared/AdminFormModal";
import { useCreateNotification } from "@/services/Notifications/useCreateNotification";
import { useMarkNotificationSeen } from "@/services/Notifications/useMarkNotificationSeen";
import { useDeleteNotification } from "@/services/Notifications/useDeleteNotification";

interface AdminNotification {
  _id: string;
  msg: string;
  see: number;
  createdAt: string;
}

const ENDPOINT = "/notifications";

interface NotificationsClientProps {
  initialData?: AdminNotification[];
}

export default function NotificationsClient({ initialData }: NotificationsClientProps) {
  const { user: me } = useGetProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGet<AdminNotification[]>(ENDPOINT, undefined, {
    initialData,
  });
  const notifications = data ?? [];

  const { mutate: create, isPending } = useCreateNotification(() => {
    setModalOpen(false);
    setMsg("");
  });

  const { mutate: markSeen } = useMarkNotificationSeen();
  const { mutate: remove } = useDeleteNotification();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    create({ msg: msg.trim(), admin: me?._id });
  }

  function handleMarkSeen(n: AdminNotification) {
    setActioningId(n._id);
    markSeen(
      { id: n._id },
      { onSettled: () => setActioningId(null) }
    );
  }

  function handleDelete(n: AdminNotification) {
    toast.warning("Delete this note?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          setActioningId(n._id);
          remove({ id: n._id }, { onSettled: () => setActioningId(null) });
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Admin</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            Notifications
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Personal notes & reminders for your admin account
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary !w-auto px-4 h-10 text-sm flex items-center gap-1.5"
        >
          <HiOutlinePlus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden w-full">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-[var(--background-soft)] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-[var(--destructive)] text-center py-8">
            Error fetching notifications
          </p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--foreground)] font-bold mb-2">No notes yet</p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Add your first reminder
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {notifications.map((n) => {
              const busy = actioningId === n._id;
              const seen = n.see > 0;
              return (
                <li key={n._id} className="flex items-center gap-3 px-5 py-4">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      seen
                        ? "bg-[var(--foreground-subtle)]"
                        : "bg-[var(--primary-500)]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        seen
                          ? "text-[var(--foreground-muted)]"
                          : "text-[var(--foreground)] font-semibold"
                      }`}
                    >
                      {n.msg}
                    </p>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString("en-US")
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!seen && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleMarkSeen(n)}
                        title="Mark as seen"
                        className="p-2 hover:bg-[var(--background-soft)] rounded-lg transition-colors disabled:opacity-40"
                      >
                        <HiOutlineCheckCircle className="w-4 h-4 text-[var(--success-500)]" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(n)}
                      title="Delete"
                      className="p-2 hover:bg-[var(--destructive-bg)] rounded-lg transition-colors disabled:opacity-40"
                    >
                      <HiOutlineTrash className="w-4 h-4 text-[var(--destructive)]" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AdminFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Note"
        icon={HiOutlineBell}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="note-form"
              disabled={isPending || !msg.trim()}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Add"}
            </button>
          </>
        }
      >
        <form id="note-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          <FormField label="Message">
            <textarea
              className={textareaClass}
              rows={3}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Reminder or note..."
              required
            />
          </FormField>
        </form>
      </AdminFormModal>
    </div>
  );
}