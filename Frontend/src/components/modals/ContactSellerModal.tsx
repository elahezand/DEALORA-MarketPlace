"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useStartConversation } from "@/services/Chat/useStartConversation";

interface ContactSellerModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  recipientId: string;
  recipientName?: string;
  listingId: string;
  listingTitle?: string;
}

export default function ContactSellerModal({
  isOpen,
  setIsOpen,
  recipientId,
  recipientName,
  listingId,
  listingTitle,
}: ContactSellerModalProps) {
  const router = useRouter();
  const [message, setMessage] = useState(
    listingTitle ? `Hi, is "${listingTitle}" still available?` : ""
  );

  const { mutate, isPending } = useStartConversation();

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = message.trim();
    if (!body) return;

    mutate(
      { recipientId, listingId, message: body },
      {
        onSuccess: (res) => {
          toast.success("Message sent!");
          setIsOpen(false);
          const conversationId = res?.data?.conversation?._id;
          if (conversationId) {
            router.push(`/dashboard/messages/${conversationId}`);
          }
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 antialiased">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* MODAL CONTAINER */}
      <div
        className="card relative z-10 w-full max-w-[520px] p-6 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)] gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={18} className="text-[var(--primary-500)] dark:text-[var(--accent-400)] flex-shrink-0" />
            <h3 className="text-base font-bold tracking-tight text-[var(--foreground)] m-0 truncate">
              Message {recipientName || "seller"}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || isPending}
              className="btn-primary h-8 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 disabled:opacity-50"
            >
              <Send size={13} />
              {isPending ? "Sending..." : "Send"}
            </button>
            <button
              onClick={handleClose}
              type="button"
              className="p-1.5 rounded-xl text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
          {listingTitle && (
            <p className="text-xs text-[var(--foreground-muted)]">
              About: <span className="font-semibold text-[var(--foreground)]">{listingTitle}</span>
            </p>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            autoFocus
            placeholder="Write your message..."
            className="w-full p-3 rounded-xl bg-[var(--background-soft)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary-500)] transition-colors resize-none"
          />
        </form>
      </div>
    </div>
  );
}
