"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { inputClass } from "../shared/AdminFormModal";
import { SiteInfo,useUpdateSiteInfo } from "@/services/Settings/useUpdateSiteInfo";
const ENDPOINT = "/infos";

const EMPTY: SiteInfo = {
  phone: "",
  email: "",
  logo: "",
  address: "",
  socials: { instagram: "", telegram: "", linkedin: "" },
};

interface SiteInfoSectionProps {
  initialData?: SiteInfo | null;
}

export function SiteInfoSection({ initialData }: SiteInfoSectionProps) {
  const { data, isLoading } = useGet<{ data: SiteInfo | null }>(
    ENDPOINT,
    undefined,
    {
      initialData: initialData ? { data: initialData } : undefined,
    }
  );

  const [form, setForm] = useState<SiteInfo>(EMPTY);

  useEffect(() => {
    if (data?.data) {
      setForm({
        phone: data.data.phone ?? "",
        email: data.data.email ?? "",
        logo: data.data.logo ?? "",
        address: data.data.address ?? "",
        socials: {
          instagram: data.data.socials?.instagram ?? "",
          telegram: data.data.socials?.telegram ?? "",
          linkedin: data.data.socials?.linkedin ?? "",
        },
      });
    }
  }, [data]);

  const { mutate: save, isPending } = useUpdateSiteInfo();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.phone.trim() || !form.email.trim() || !form.logo.trim()) {
      toast.error("Phone, email and logo URL are required");
      return;
    }

    const socials = {
      instagram: form.socials?.instagram?.trim() || "",
      telegram: form.socials?.telegram?.trim() || "",
      linkedin: form.socials?.linkedin?.trim() || "",
    };

    save({
      phone: form.phone.trim(),
      email: form.email.trim(),
      logo: form.logo.trim(),
      address: form.address?.trim() || "",
      socials,
    });
  }

  return (
    <div className="card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <HiOutlineGlobeAlt className="w-4.5 h-4.5 text-[var(--foreground-muted)]" />
        <h2 className="text-sm font-bold text-[var(--foreground)]">Site Info</h2>
      </div>
      <p className="text-xs text-[var(--foreground-muted)] -mt-3">
        Public contact details shown across the storefront (footer, contact page, etc.)
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-11 bg-[var(--background-soft)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--foreground-muted)]">
                Support Phone
              </label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+1234567890"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--foreground-muted)]">
                Support Email
              </label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="support@example.com"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              Logo URL
            </label>
            <input
              className={inputClass}
              value={form.logo}
              onChange={(e) =>
                setForm((f) => ({ ...f, logo: e.target.value }))
              }
              placeholder="https://.../logo.png"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              Address (optional)
            </label>
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="Street, City, Country"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--foreground-muted)]">
                Instagram
              </label>
              <input
                className={inputClass}
                value={form.socials?.instagram}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socials: { ...f.socials, instagram: e.target.value },
                  }))
                }
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--foreground-muted)]">
                Telegram
              </label>
              <input
                className={inputClass}
                value={form.socials?.telegram}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socials: { ...f.socials, telegram: e.target.value },
                  }))
                }
                placeholder="https://t.me/..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--foreground-muted)]">
                LinkedIn
              </label>
              <input
                className={inputClass}
                value={form.socials?.linkedin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socials: { ...f.socials, linkedin: e.target.value },
                  }))
                }
                placeholder="https://linkedin.com/..."
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary !w-auto px-6 h-10 text-sm disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Site Info"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}