"use client";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Skeleton } from "@heroui/react";
import { CategoriesTypeResponse } from "@/types/Category";

const ICON_COLOR_CLASSES = [
  "cat-icon-purple",
  "cat-icon-teal",
  "cat-icon-coral",
  "cat-icon-amber",
  "cat-icon-green",
  "cat-icon-blue",
  "cat-icon-pink",
  "cat-icon-sand",
] as const;

export default function CategoriesSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data, isLoading } = useGet<CategoriesTypeResponse>("/categories");

  const handleClick = (categoryId: string) => {
    startTransition(() => {
      router.push(`/posts?categoryId=${categoryId}`);
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-[var(--radius)] border border-[var(--border)]">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {data?.data.map((cat, i) => (
        <button
          key={cat._id}
          onClick={() => handleClick(cat._id)}
          disabled={isPending}
          className="group flex flex-col items-center gap-3 p-4 rounded-[var(--radius)]
                     border border-[var(--border)] bg-[var(--card-solid)]
                     hover:border-[var(--primary-300)] dark:hover:border-[var(--primary-800)]
                     hover:bg-[var(--background-soft)] hover:shadow-sm
                     transition-all duration-300 ease-out cursor-pointer disabled:opacity-60 active:scale-95"
        >
          <div
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              transition-all duration-300 group-hover:scale-105 group-hover:rotate-2 overflow-hidden shrink-0 shadow-sm
              ${ICON_COLOR_CLASSES[i % ICON_COLOR_CLASSES.length]}
            `}
            dangerouslySetInnerHTML={{ __html: cat.icon?.svgCode ?? "" }}
          />

          <span className="text-xs font-bold text-[var(--foreground-muted)]
                           group-hover:text-[var(--foreground)]
                           transition-colors leading-tight text-center line-clamp-2">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}