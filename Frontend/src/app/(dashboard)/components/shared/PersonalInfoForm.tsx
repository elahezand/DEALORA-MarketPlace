"use client";

import { useState, useEffect, useRef } from "react";
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineCamera,
} from "react-icons/hi2";
import { Spinner } from "@heroui/react";
import { useUpdateProfile } from "@/services/Profile/UpdateProfile";
import { getUrl } from "@/utils/helper"

interface PersonalInfoFormProps {
  initialUsername?: string | null;
  initialEmail?: string | null;
  phone?: string | null;
  profilePicture?: string | null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
export function PersonalInfoForm({
  initialUsername,
  initialEmail,
  phone,
  profilePicture,
}: PersonalInfoFormProps) {
  
  const [username, setUsername] = useState(initialUsername ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  useEffect(() => {
    if (initialUsername) setUsername(initialUsername);
    if (initialEmail) setEmail(initialEmail);
  }, [initialUsername, initialEmail]);



  // Handle file selection & client-side preview
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File size must not exceed 2MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleSave() {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);

    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    updateProfile(formData, {
      onSuccess: () => {
        setSaved(true);
        setSelectedFile(null);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  }

  const avatarSrc = previewUrl || getUrl(profilePicture);  

  return (
    <div className="card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-6">
      <h2 className="text-sm font-bold text-[var(--foreground)]">
        Personal Information & Photo
      </h2>

      {/* Profile Photo Section */}
      <div className="flex items-center gap-5 pb-2 border-b border-[var(--border)]">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center overflow-hidden relative">
            {isUpdating ? (
              <Spinner size="sm" color="primary" />
            ) : avatarSrc ? (
              <img
                src={avatarSrc}
                alt={username || "avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <HiOutlineUser className="w-8 h-8 text-[var(--foreground-subtle)]" />
            )}
          </div>

          <label
            className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-[var(--primary-500)] text-white flex items-center justify-center shadow-sm transition-all ${isUpdating
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[var(--primary-600)] cursor-pointer"
              }`}
          >
            <HiOutlineCamera className="w-3.5 h-3.5" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUpdating}
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">
            {username || "User"}
          </p>
          {phone && (
            <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
              {phone}
            </p>
          )}
          <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
            JPG or PNG, max 2MB
          </p>
        </div>
      </div>

      {/* Form Fields Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
            <HiOutlineUser className="w-3.5 h-3.5" /> Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            disabled={isUpdating}
            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
          />
        </div>

        {phone && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
              <HiOutlinePhone className="w-3.5 h-3.5" /> Phone
            </label>
            <div className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--background-soft)] text-sm text-[var(--foreground-subtle)] flex items-center justify-between">
              <span>{phone}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--success-bg)] text-[var(--success-500)]">
                Verified
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
            <HiOutlineEnvelope className="w-3.5 h-3.5" /> Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            type="email"
            disabled={isUpdating}
            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="btn-primary !w-auto px-6 h-10 text-sm disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save changes"}
        </button>

        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--success-500)]">
            <HiOutlineCheckCircle className="w-4 h-4" /> Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}