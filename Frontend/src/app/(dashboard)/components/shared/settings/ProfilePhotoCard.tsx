"use client";
import { HiOutlineUser, HiOutlineCamera } from "react-icons/hi2";

interface ProfilePhotoCardProps {
  profilePicture?: string | null;
  username?: string | null;
  subtitle?: string | null; 
  onPhotoChange?: (file: File) => void;
}

export function ProfilePhotoCard({
  profilePicture,
  username,
  subtitle,
  onPhotoChange,
}: ProfilePhotoCardProps) {
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) onPhotoChange(file);
  }

  return (
    <div className="card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-5">
      <h2 className="text-sm font-bold text-[var(--foreground)]">Profile Photo</h2>
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
            {profilePicture ? (
              <img src={profilePicture} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <HiOutlineUser className="w-8 h-8 text-[var(--foreground-subtle)]" />
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-[var(--primary-500)] text-white flex items-center justify-center shadow-sm hover:bg-[var(--primary-600)] transition-colors cursor-pointer">
            <HiOutlineCamera className="w-3.5 h-3.5" />
            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">{username}</p>
          {subtitle && <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">{subtitle}</p>}
          <p className="text-[10px] text-[var(--foreground-muted)] mt-1">JPG or PNG, max 2MB</p>
        </div>
      </div>
    </div>
  );
}