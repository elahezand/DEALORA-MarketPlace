"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineTag,
} from "react-icons/hi2";
import { useMessages } from "@/services/Chat/useMessages";
import { useSendMessage } from "@/services/Chat/useSendMessage";
import { useGetProfile } from "@/services/Profile/getProfile";
import { IConversation, IMessage, MessagesResponse } from "@/types/Chat";
import { IPagination } from "@/types/common";
import { timeAgo } from "@/utils/timeAgo";

interface ConversationThreadProps {
  conversationId: string;
  initialConversation: IConversation | null;
  initialMessages?: IMessage[];
  initialPagination?: IPagination | null;
}

const getMediaUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function ConversationThread({
  conversationId,
  initialConversation,
  initialMessages = [],
  initialPagination = null,
}: ConversationThreadProps) {
  const { user } = useGetProfile();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useMessages(conversationId, {
    initialData: initialMessages,
    initialPagination,
  });

  const { mutate: sendMessage, isPending } = useSendMessage(conversationId);

  const messages = (
    data?.pages.flatMap((page: MessagesResponse) => page?.data ?? []) || []
  )
    .filter(Boolean)
    .slice()
    .reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const otherParticipant = initialConversation?.participants?.find(
    (p) => p?._id !== user?._id
  );
  const avatarUrl = getMediaUrl(otherParticipant?.profilePicture);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || isPending) return;

    setDraft("");
    sendMessage({ body });
  };

  return (
    <div className="flex flex-col gap-4 pb-10 h-[calc(100vh-96px)]">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/dashboard/messages"
          className="p-2 rounded-lg hover:bg-[var(--background-soft)] transition-colors flex-shrink-0"
        >
          <HiOutlineArrowLeft className="w-5 h-5 text-[var(--foreground-muted)]" />
        </Link>

        <div className="w-10 h-10 rounded-full bg-[var(--background-soft)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={otherParticipant?.username || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-[var(--foreground-muted)]">
              {(otherParticipant?.username || "U").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="!text-base font-black text-[var(--foreground)] truncate">
            {otherParticipant?.username || otherParticipant?.phone || "User"}
          </h1>
          {initialConversation?.listing && (
            <Link
              href={`/listings/${initialConversation.listing._id}`}
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--primary-500)] transition-colors flex items-center gap-1 truncate"
            >
              <HiOutlineTag className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{initialConversation.listing.title}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {hasNextPage && (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs font-semibold text-[var(--primary-500)] hover:underline disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load older messages"}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-3 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-10 w-2/3 rounded-2xl bg-[var(--background-soft)] animate-pulse ${
                    i % 2 === 0 ? "self-start" : "self-end"
                  }`}
                />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-[var(--destructive)] text-center py-8">
              Error fetching messages
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((message) => {
              if (!message) return null;
              const isMine = message.sender === user?._id;

              return (
                <div
                  key={message._id}
                  className={`flex flex-col max-w-[75%] ${
                    isMine ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm break-words whitespace-pre-wrap ${
                      isMine
                        ? "bg-[var(--primary-500)] text-white rounded-br-md"
                        : "bg-[var(--background-soft)] text-[var(--foreground)] rounded-bl-md"
                    }`}
                  >
                    {message.body}
                  </div>
                  <span className="text-[10px] text-[var(--foreground-subtle)] mt-1 px-1">
                    {timeAgo(message.createdAt)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 p-3 border-t border-[var(--border)] bg-[var(--card)]"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            placeholder="Type a message..."
            disabled={initialConversation?.isBlocked}
            className="!w-auto flex-1 !p-2.5 !rounded-xl"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isPending || initialConversation?.isBlocked}
            className="btn-primary !w-auto h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
          >
            <HiOutlinePaperAirplane className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isPending ? "Sending..." : "Send"}
            </span>
          </button>
        </form>
        {initialConversation?.isBlocked && (
          <p className="text-xs text-[var(--destructive)] text-center pb-2">
            This conversation has been blocked.
          </p>
        )}
      </div>
    </div>
  );
}
