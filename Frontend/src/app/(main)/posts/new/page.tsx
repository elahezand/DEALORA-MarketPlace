import React from "react";
import NewPost from "@/components/newPost/newPost";
import { useServerData } from "@/utils/hooks/useServerData";
import { CategoriesTypeResponse } from "@/types/Category";
export default async function Page() {
    const categories = await useServerData<CategoriesTypeResponse>(
        "/categories",
        "categories",
        60 * 60 * 24
    );

    return (
            <div className="w-full max-w-5xl mx-auto p-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
            <NewPost
                data={categories}
                isLoading={false} />
        </div>
    );
}