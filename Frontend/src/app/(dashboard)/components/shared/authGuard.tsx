"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetProfile } from "@/services/Profile/getProfile";
import { IUser } from "@/types/User";

type Role = "USER" | "ADMIN" | "SELLER";
interface AuthGuardProps {
  children: (user: IUser) => React.ReactNode;
  requireRole?: Role | Role[];
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireRole,
  redirectTo,
}: AuthGuardProps) {
  const { user, isLoading } = useGetProfile();
  const router = useRouter();
  
  const userRoles = user?.role ?? [];
  
  const allowedRoles: Role[] | null = requireRole
    ? Array.isArray(requireRole)
      ? requireRole
      : [requireRole]
    : null;

  const isAuthorized = allowedRoles
    ? allowedRoles.some((role) => userRoles.includes(role))
    : !!user;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !isAuthorized) {
      router.replace(redirectTo ?? "/dashboard");
    }
  }, [isLoading, user, isAuthorized, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!user || (allowedRoles && !isAuthorized)) return null;

  return <>{children(user)}</>;
}