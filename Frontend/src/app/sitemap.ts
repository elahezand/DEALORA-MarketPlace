import type { MetadataRoute } from "next";
import { getServerData } from "@/utils/serverData";
import { SITE_URL } from "@/utils/seo";
import { PublicListingsResponse } from "@/types/Listings";
import { StoresResponse } from "@/types/Store";

export const revalidate = 3600;

const STATIC_ROUTES = ["", "/posts", "/stores", "/supports", "/about", "/contact-us", "/careers", "/legal/terms", "/legal/privacy", "/legal/cookies"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // getServerData returns null when the API is down, so the sitemap still has the static pages
  const [listings, stores] = await Promise.all([
    getServerData<PublicListingsResponse>("/listings?limit=100", "sitemap-listings", revalidate),
    getServerData<StoresResponse>("/stores/verified", "sitemap-stores", revalidate),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" || route === "/posts" ? "daily" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));

  const listingEntries: MetadataRoute.Sitemap = (listings?.data ?? []).map((listing) => ({
    url: `${SITE_URL}/posts/${listing._id}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const storeEntries: MetadataRoute.Sitemap = (stores?.data ?? [])
    .filter((store) => store.slug)
    .map((store) => ({
      url: `${SITE_URL}/stores/${store.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticEntries, ...listingEntries, ...storeEntries];
}
