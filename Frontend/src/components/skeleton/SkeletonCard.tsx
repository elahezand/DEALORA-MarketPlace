"use client";

import { Card, Skeleton } from "@heroui/react";

export default function SkeletonCard() {
  return (
    <Card className="group bg-white dark:bg-slate-900 rounded-3xl shadow-md p-3 sm:p-4 border border-slate-100 dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm dark:shadow-none">
      {/* IMAGE PLACEHOLDER */}
      <div className="relative overflow-hidden rounded-2xl">
        <Skeleton className="w-full h-[176px] rounded-2xl before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
      </div>

      {/* CONTENTS PLACEHOLDER */}
      <div className="space-y-3 px-1 sm:px-2">
        <Skeleton className="w-2/3 h-5 rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
        <Skeleton className="w-1/2 h-4 rounded-md before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />

        {/* BADGES / TAGS LINE */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <Skeleton className="w-20 h-6 rounded-full before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
          <Skeleton className="w-20 h-6 rounded-full before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
          <Skeleton className="w-20 h-6 rounded-full before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
        </div>

        {/* METRICS LINE */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
          <Skeleton className="w-14 h-4 rounded-md before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
          <Skeleton className="w-16 h-5 rounded-md before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
          <Skeleton className="ml-auto w-10 h-6 rounded-full before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
        </div>
      </div>
    </Card>
  );
}