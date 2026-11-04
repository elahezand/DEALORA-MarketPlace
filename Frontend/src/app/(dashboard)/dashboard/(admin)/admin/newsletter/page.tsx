import { getAuthServerData } from "@/utils/serverData";
import NewsletterClient from "@/components/dashboard/admin/newsletter/NewsletterPage";
import { NewsletterSubscribersResponse } from "@/types/Newsletter";

export const revalidate = 60;
export default async function AdminNewsletterPage() {
  const initialSubscribers = await getAuthServerData<NewsletterSubscribersResponse>(
    "/newsletters?limit=30",
  );

  return (
    <NewsletterClient
     initialData={initialSubscribers ?
    { pages: [initialSubscribers], pageParams: [null] }
    : undefined} />
    
  );
}