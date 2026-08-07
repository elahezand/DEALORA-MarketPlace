"use client";

import { HiOutlineUsers } from "react-icons/hi2";
import TableCard from "../../shared/table/TableCard";
import { useGetUsers } from "@/services/User/useGetUsers";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, ViewAction } from "../../shared/table/TableParts";

export default function RecentUsers() {
  const { users, isLoading, isError } = useGetUsers(5);

  return (
    <TableCard
      header={<WidgetHeader icon={HiOutlineUsers} title="Recent Users"
        showViewAll={true}
        href="/dashboard/admin/users" />}
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
        {users.map((user) => (
          <tr
            key={user._id}
            className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
          >
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <EntityAvatar
                  src={user.profilePicture}
                  alt={user.username ?? user.phone}
                  fallback={(user.username ?? user.phone).slice(0, 2).toUpperCase()}
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[var(--foreground)] truncate">
                    {user.username ?? user.phone}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">{user.phone}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--background-soft)]">
                <span className="text-xs font-bold text-[var(--foreground-muted)]">
                  {user.role.join(", ")}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <ViewAction href="/dashboard/admin/users" />
            </td>
          </tr>
        ))}
      </tbody>
    </TableCard>
  );
}