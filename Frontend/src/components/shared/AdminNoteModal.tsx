"use client";

import { useState } from "react";
import { HiOutlineBellAlert } from "react-icons/hi2";
import { useCreateNotification } from "@/services/Notifications/useCreateNotification";
import { AdminFormModal, FormField, textareaClass } from "@/components/dashboard/admin/shared/AdminFormModal";

interface AdminNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

/* admin-only: send a quick notification from the header */
export default function AdminNoteModal({ isOpen, onClose, userId }: AdminNoteModalProps) {
  const [noteMsg, setNoteMsg] = useState("");
  const { mutate: createNotification, isPending: isCreatingNote } = useCreateNotification(() => {
    onClose();
    setNoteMsg("");
  });

  function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteMsg.trim()) return;
    if (!userId) return;

    createNotification({ msg: noteMsg.trim(), user: userId });
  }

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Notification"
      icon={HiOutlineBellAlert}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="header-note-form"
            disabled={isCreatingNote || !noteMsg.trim()}
            className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
          >
            {isCreatingNote ? "Sending..." : "Send"}
          </button>
        </>
      }
    >
      <form id="header-note-form" onSubmit={handleCreateNote} className="flex flex-col gap-4">
        <FormField label="Message">
          <textarea
            className={textareaClass}
            rows={3}
            value={noteMsg}
            onChange={(e) => setNoteMsg(e.target.value)}
            placeholder="Write a quick notification..."
            required
            autoFocus
          />
        </FormField>
      </form>
    </AdminFormModal>
  );
}
