import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // private areas and one-off pages
      disallow: ["/dashboard", "/cart", "/payment-success", "/payment-failed", "/create-shop"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
