import type { Metadata } from "next";
import React from "react";
import NewPost from "@/components/newPost/newPost";
import { getServerData } from "@/utils/serverData";
import { CategoriesTypeResponse } from "@/types/Category";

export const metadata: Metadata = {
  title: "Post an Ad",
  description: "Sell something in a few steps: pick a category, add photos and set your price.",
};
export default async function Page() {
    const categories = await getServerData<CategoriesTypeResponse>(
        "/categories",
        "categories",
        60 * 60 * 24
    );

    return (
            <div className="w-full max-w-5xl mx-auto p-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
            <NewPost
                data={categories ?? undefined}
                isLoading={false} />
        </div>
    );
}