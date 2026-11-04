"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/*
   proxy.ts sends signed-out visitors of /dashboard to "/?auth=required".
   this opens the login modal once and cleans the query from the url.
*/
export default function AuthRequiredListener({ onAuthRequired }: { onAuthRequired: () => void }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isRequired = searchParams.get("auth") === "required";

  useEffect(() => {
    if (!isRequired) return;

    toast.error("Please log in to access this page", { id: "auth" });
    onAuthRequired();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    params.delete("from");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [isRequired, onAuthRequired, pathname, router, searchParams]);

  return null;
}
