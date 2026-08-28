import { useServerData } from "@/utils/hooks/useServerData";
import AdminSettingsClient from "@/app/(dashboard)/components/(admin)/settings/AdminSettingsPage";
import { SiteInfo } from "@/services/Settings/useUpdateSiteInfo";

export default async function AdminSettingsPage() {
  const { data: initialSiteInfo } = await useServerData<{ data: SiteInfo | null }>(
    "/infos",
    "site-info",
    60 * 60
  );

  return <AdminSettingsClient initialSiteInfo={initialSiteInfo ?? null} />;
}
