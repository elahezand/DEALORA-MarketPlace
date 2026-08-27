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
          className="group relative overflow-hidden rounded-xl p-5
                     border border-primary-200 hover:border-primary-400 
                     dark:border-primary-800 dark:hover:border-primary-600
                     bg-card-solid 
                     hover:bg-gradient-to-br hover:from-primary-50 
                     hover:to-secondary-50
                     dark:hover:from-primary-900/30 dark:hover:to-secondary-900/30
                     transition-all duration-300 ease-out
                     hover:shadow-xl hover:-translate-y-1
                     disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 
                          bg-gradient-to-br from-primary-500/5 to-secondary-500/5 
                          opacity-0 group-hover:opacity-100 
                          transition-opacity duration-300" />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div
              className={`
                w-16 h-16 rounded-lg 
                flex items-center justify-center
                bg-gradient-to-br from-primary-100 to-secondary-100
                group-hover:scale-110 group-hover:rotate-3
                transition-transform duration-300
                shadow-sm group-hover:shadow-md
                overflow-hidden shrink-0
                ${ICON_COLOR_CLASSES[i % ICON_COLOR_CLASSES.length]}
              `}
              dangerouslySetInnerHTML={{ __html: cat.icon?.svgCode ?? "" }}
            />

            <span className="text-xs font-bold text-foreground-muted
                             group-hover:text-foreground
                             transition-colors leading-tight text-center line-clamp-2">
              {cat.title}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}