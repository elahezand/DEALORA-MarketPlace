"use client";
import { Card, Skeleton } from "@heroui/react";

const SkeletonListing = () => (
  <Card 
    className="w-full space-y-5 p-4 min-h-[300px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm dark:shadow-none transition-colors duration-300" 
    radius="lg"
  >
    {/* IMAGE PLACEHOLDER */}
    <Skeleton className="rounded-xl w-full before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60">
      <div className="h-44 rounded-xl bg-transparent" />
    </Skeleton>

    {/* CONTENT PLACEHOLDERS */}
    <div className="space-y-3 pt-1">
      <Skeleton className="w-3/4 rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60">
        <div className="h-4 rounded-lg bg-transparent" />
      </Skeleton>
      
      <Skeleton className="w-1/2 rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60">
        <div className="h-3 rounded-lg bg-transparent" />
      </Skeleton>
      
      <Skeleton className="w-full rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60">
        <div className="h-4 rounded-lg bg-transparent" />
      </Skeleton>
    </div>
  </Card>
);

export default function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full bg-transparent">
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonListing key={i} />
      ))}
    </div>
  );
}