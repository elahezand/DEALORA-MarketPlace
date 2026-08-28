"use client";
import { useGetProfile } from "@/services/Profile/getProfile";
import { AdminSecuritySection } from "./AdminSecuritySection";
import { SiteInfoSection } from "./SiteInfoSection";
import { PersonalInfoForm } from "@/app/(dashboard)/components/shared/PersonalInfoForm";
import { SiteInfo } from "@/services/Settings/useUpdateSiteInfo";
interface AdminSettingsClientProps {
  initialSiteInfo?: SiteInfo | null;
}

export default function AdminSettingsClient({
  initialSiteInfo,
}: AdminSettingsClientProps) {
  const { user } = useGetProfile();

  return (
    <div className="flex flex-col gap-5 pb-10 max-w-6xl mx-auto">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Settings
        </h1>
      </div>

      <PersonalInfoForm
        initialUsername={user?.username}
        initialEmail={user?.email}
        phone={user?.phone}
        profilePicture={user?.profilePicture}
      />

      <SiteInfoSection initialData={initialSiteInfo} />

      <AdminSecuritySection />
    </div>
  );
}
