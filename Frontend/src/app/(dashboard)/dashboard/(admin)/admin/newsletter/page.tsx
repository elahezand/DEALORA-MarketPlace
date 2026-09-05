import { useAuthServerData } from "@/utils/hooks/useServerData";
import NewsletterClient from "@/app/(dashboard)/components/(admin)/newsletter/NewsletterPage";
import { NewsletterSubscribersResponse } from "@/types/Newsletter";

export default async function AdminNewsletterPage() {
  const initialSubscribers = await useAuthServerData<NewsletterSubscribersResponse>(
    "/newsletters?limit=30",
    "admin-newsletter-subscribers",
    60 * 5
  );

  return (
    <NewsletterClient
     initialData={initialSubscribers ?
    { pages: [initialSubscribers], pageParams: [null] }
    : undefined} />
    
  );
}