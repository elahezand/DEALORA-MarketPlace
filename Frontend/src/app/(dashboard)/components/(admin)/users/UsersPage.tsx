"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineUsers } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { useGetProfile } from "@/services/Profile/getProfile";
import { IUser } from "@/types/User";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { getUrl } from "@/utils/helper"
import { useToggleBanUser } from "@/services/User/useToggleBanUser";
import { useToggleUserRole } from "@/services/User/useToggleUserRole";
import { useDeleteUser } from "@/services/User/useDeleteUser";

const ENDPOINT = "/users";

interface UsersClientProps {
  initialData?: any;
}
export default function UsersClient({ initialData }: UsersClientProps) {
  const { user: me } = useGetProfile();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<any>(ENDPOINT, { limit: 20 }, { initialData });

  const users: IUser[] = (
    data?.pages?.flatMap((page: any) => page?.users?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: toggleBan } = useToggleBanUser();
  const { mutate: toggleRole } = useToggleUserRole();
  const { mutate: removeUser } = useDeleteUser();

  const handleAction = (
    id: string,
    actionFn: (payload: { id: string }, options: any) => void
  ) => {
    setActioningId(id);
    actionFn({ id }, { onSettled: () => setActioningId(null) });
  };

  const handleDelete = (user: IUser) => {
    toast.warning(`Delete user "${user.username ?? user.phone}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => handleAction(user._id, removeUser),
      },
      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Users
        </h1>
      </div>

      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineUsers}
            title="All Users"
            href="/dashboard/admin/users"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={users.length === 0}
        errorMessage="Error fetching users"
        emptyTitle="No users yet"
        emptyMessage="New users will show up here"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>User</Th>
            <Th>Role</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const src = getUrl(user.profilePicture)
            const isSelf = user._id === me?._id;
            const isAdmin = user.role.includes("ADMIN");
            const busy = actioningId === user._id;

            return (
              <tr
                key={user._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <EntityAvatar
                      src={src}
                      alt={user.username ?? user.phone}
                      fallback={(user.username ?? user.phone)
                        .slice(0, 2)
                        .toUpperCase()}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--foreground)] truncate">
                        {user.username ?? user.phone}
                        {isSelf && (
                          <span className="ml-1.5 text-[10px] font-bold text-[var(--foreground-subtle)]">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {user.phone}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    tone={isAdmin ? "info" : "neutral"}
                    label={user.role.join(", ")}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAction(user._id, toggleBan)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--warning-bg)] hover:text-[var(--warning-500)] hover:border-[var(--warning-500)]/30 transition-colors disabled:opacity-40"
                    >
                      {busy ? "Processing..." : "Ban/Unban"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || isSelf}
                      title={
                        isSelf
                          ? "You can't change your own role"
                          : "Toggle admin role"
                      }
                      onClick={() => handleAction(user._id, toggleRole)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors disabled:opacity-40"
                    >
                      {isAdmin ? "Revoke Admin" : "Make Admin"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || isSelf}
                      title={
                        isSelf ? "You can't delete yourself" : "Delete user"
                      }
                      onClick={() => handleDelete(user)}
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
              className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""
                }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}