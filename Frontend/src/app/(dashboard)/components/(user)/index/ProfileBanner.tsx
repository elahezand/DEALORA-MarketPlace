"use client";
import Link from "next/link";
import {
  HiOutlineExclamationTriangle,
  HiOutlinePhoto,
  HiOutlineEnvelope,
} from "react-icons/hi2";
import { useGetProfile } from "@/services/Profile/getProfile";

export default function ProfileBanner() {
  const { user, isLoading } = useGetProfile();

  // Don't flash the banner before we know the real profile state,
  // and don't show anything if we couldn't load the user at all.
  if (isLoading || !user) return null;

  const missing = [
    !user.profilePicture && {
      label: "Add a profile photo",
      icon: HiOutlinePhoto,
      href: "/dashboard/settings",
    },
    !user.email && {
      label: "Add an email address",
      icon: HiOutlineEnvelope,
      href: "/dashboard/settings",
    },
  ].filter(Boolean) as { label: string; icon: React.ElementType; href: string }[];

  if (missing.length === 0) return null;

  return (
    <div className="card rounded-2xl border border-[var(--warning-500)]/30 bg-[var(--warning-bg)] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <HiOutlineExclamationTriangle className="w-5 h-5 text-[var(--warning-500)] flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">Complete your profile</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
            A complete profile gets more trust and faster responses
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {missing.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[var(--warning-500)]/10 text-[var(--warning-500)] hover:bg-[var(--warning-500)]/20 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
