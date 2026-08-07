import { useAuthServerData } from "@/utils/hooks/useServerData";
import NewsletterClient from "@/app/(dashboard)/components/(admin)/newsletter/NewsletterPage";
export default async function AdminNewsletterPage() {
  const initialSubscribers = await useAuthServerData<any>(
    "/newsletters?limit=30",
    "admin-newsletter-subscribers",
    60 * 5
  );

  return (
    <NewsletterClient
     initialData={initialSubscribers ?
    { pages: [initialSubscribers], pageParams: [1] }
    : undefined} />
    
  );
}