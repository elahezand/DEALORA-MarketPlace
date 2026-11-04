import { getServerData } from "@/utils/serverData";
import AdminSettingsClient from "@/components/dashboard/admin/settings/AdminSettingsPage";
import { SiteInfo } from "@/services/Settings/useUpdateSiteInfo";

export default async function AdminSettingsPage() {
  // no server cache here: after saving, the admin must see what they just saved
  // (it was cached for 1 hour, so a reload showed the old values)
  const res = await getServerData<{ data: SiteInfo | null }>("/infos");

  return <AdminSettingsClient initialSiteInfo={res?.data ?? null} />;
}
