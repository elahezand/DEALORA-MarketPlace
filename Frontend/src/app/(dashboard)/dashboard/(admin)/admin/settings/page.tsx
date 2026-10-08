import { useServerData } from "@/utils/hooks/useServerData";
import AdminSettingsClient from "@/app/(dashboard)/components/(admin)/settings/AdminSettingsPage";
import { SiteInfo } from "@/services/Settings/useUpdateSiteInfo";

export default async function AdminSettingsPage() {
  // no server cache here: after saving, the admin must see what they just saved
  // (it was cached for 1 hour, so a reload showed the old values)
  const res = await useServerData<{ data: SiteInfo | null }>("/infos");

  return <AdminSettingsClient initialSiteInfo={res?.data ?? null} />;
}
