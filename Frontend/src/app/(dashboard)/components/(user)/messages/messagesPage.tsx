"use client";

import Link from "next/link";
import { HiOutlineChatBubbleLeftRight, HiChevronRight } from "react-icons/hi2";
import { useConversations } from "@/services/Chat/useConversations";
import { useGetProfile } from "@/services/Profile/getProfile";
import { IConversation, ConversationsResponse } from "@/types/Chat";
import { IPagination } from "@/types/common";
import { timeAgo } from "@/utils/timeAgo";

interface MessagesPageProps {
  initialData?: IConversation[];
  initialPagination?: IPagination | null;
}

const getMediaUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function MessagesPage({
  initialData = [],
  initialPagination = null,
}: MessagesPageProps) {
  const { user } = useGetProfile();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useConversations({ initialData, initialPagination });

  const conversations = (
    data?.pages.flatMap((page: ConversationsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Messages</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            My Messages
          </h1>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[var(--background-soft)] rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-8 text-center">
          <p className="text-sm text-[var(--destructive)]">
            Error fetching your conversations
          </p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-12 text-center">
          <HiOutlineChatBubbleLeftRight className="w-10 h-10 mx-auto mb-3 text-[var(--foreground-muted)]" />
          <p className="text-[var(--foreground)] font-bold mb-2">
            No conversations yet
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">
            When you contact a seller or someone messages you about a listing,
            your conversations will show up here.
          </p>
        </div>
      ) : (
        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden divide-y divide-[var(--border)]">
          {conversations.map((conversation) => {
            if (!conversation) return null;

            const otherParticipant = conversation.participants?.find(
              (p) => p?._id !== user?._id
            );
            const unread = user?._id
              ? conversation.unreadCount?.[user._id] || 0
              : 0;
            const avatarUrl = getMediaUrl(otherParticipant?.profilePicture);
            const listingImage = getMediaUrl(conversation.listing?.images?.[0]);

            return (
              <Link
                key={conversation._id}
                href={`/dashboard/messages/${conversation._id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--background-soft)] transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[var(--background-soft)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center">
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

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm truncate ${
                        unread > 0
                          ? "font-black text-[var(--foreground)]"
                          : "font-bold text-[var(--foreground)]"
                      }`}
                    >
                      {otherParticipant?.username || otherParticipant?.phone || "User"}
                    </p>
                    <span className="text-xs text-[var(--foreground-muted)] flex-shrink-0">
                      {conversation.lastMessage?.sentAt
                        ? timeAgo(conversation.lastMessage.sentAt)
                        : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-xs truncate ${
                        unread > 0
                          ? "font-semibold text-[var(--foreground)]"
                          : "text-[var(--foreground-muted)]"
                      }`}
                    >
                      {conversation.lastMessage?.sender === user?._id ? "You: " : ""}
                      {conversation.lastMessage?.body || "No messages yet"}
                    </p>
                    {unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[var(--primary-500)] text-white text-[10px] font-bold flex-shrink-0">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>

                  {conversation.listing && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {listingImage && (
                        <img
                          src={listingImage}
                          alt={conversation.listing.title}
                          className="w-4 h-4 rounded object-cover"
                        />
                      )}
                      <span className="text-[11px] text-[var(--foreground-subtle)] truncate">
                        Re: {conversation.listing.title}
                      </span>
                    </div>
                  )}
                </div>

                <HiChevronRight className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="p-4 flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:bg-[var(--neutral-200)] dark:disabled:bg-[var(--neutral-800)] disabled:text-[var(--neutral-400)] dark:disabled:text-[var(--neutral-600)] disabled:cursor-not-allowed transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : "group-hover:translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
