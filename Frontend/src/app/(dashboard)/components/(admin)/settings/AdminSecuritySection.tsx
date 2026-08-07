"use client";

import { useState } from "react";
import { HiOutlineLockClosed, HiOutlineCheckCircle } from "react-icons/hi2";

export function AdminSecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-5">
      <h2 className="text-sm font-bold text-[var(--foreground)]">Security</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
          <HiOutlineLockClosed className="w-3.5 h-3.5" /> Current Password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[var(--foreground-muted)]">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-[var(--foreground-muted)]">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleChangePassword}
          className="btn-primary !w-auto px-6 h-10 text-sm"
        >
          Update Password
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--success-500)]">
            <HiOutlineCheckCircle className="w-4 h-4" /> Updated
          </span>
        )}
      </div>
    </div>
  );
}