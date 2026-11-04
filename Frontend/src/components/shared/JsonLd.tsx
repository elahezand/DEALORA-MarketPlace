import { serializeJsonLd } from "@/utils/seo";

/* structured data for search engines (server component, no js shipped) */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
