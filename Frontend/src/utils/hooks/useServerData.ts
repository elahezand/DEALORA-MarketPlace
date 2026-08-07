import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useServerData = async <T>(
  endpoint: string,
  cacheKey?: string,
  revalidateTime?: number
): Promise<T> => {
  if (cacheKey && revalidateTime !== undefined) {
    const fetchData = unstable_cache(
      async (): Promise<T> => {
        const res = await fetch(`${API_URL}${endpoint}`);
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        return res.json();
      },
      [cacheKey],
      { revalidate: revalidateTime }
    );

    return fetchData();
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    return res.json();
  } catch (error: any) {
    console.error("SSR fetch error:", error?.message);
    throw new Error("Data fetch failed");
  }
};



export const useAuthServerData = async <T>(
  endpoint: string,
  cacheKey?: string,
  revalidateTime?: number
): Promise<T | null> => {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value || cookieStore.get("accessToken")?.value;

    const fetchOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    if (typeof revalidateTime === "number") {
      fetchOptions.next = {
        revalidate: revalidateTime,
        ...(cacheKey ? { tags: [cacheKey] } : {}),
      };
    } else {
      fetchOptions.cache = "no-store";
    }

    const res = await fetch(`${API_URL}${endpoint}`, fetchOptions);

    if (res.status === 401 || res.status === 403) {
      console.warn(
        `[useAuthServerData] Unauthorized (Status ${res.status}) on endpoint: ${endpoint}`
      );
      return null;
    }

    if (!res.ok) {
      console.error(
        `[useAuthServerData] Error ${res.status} on endpoint: ${endpoint}`
      );
      return null;
    }

    return (await res.json()) as T;
  } catch (error: any) {
    console.error(`[useAuthServerData] SSR Auth fetch error:`, error?.message || error);
    return null;
  }
};