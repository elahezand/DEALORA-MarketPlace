"use client";
import { Card, Skeleton } from "@heroui/react";
import React from "react";

const SkeletonComments = () => {
  return (
    <div className="space-y-4 w-full">
      {[...Array(2)].map((_, i) => (
        <Card 
          key={i} 
          className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm dark:shadow-none transition-colors duration-300" 
          radius="lg"
        >
          {/* AVATAR & USER INFO PLACEHOLDER */}
          <div className="flex items-center gap-4">
            <Skeleton className="rounded-full w-10 h-10 flex-shrink-0 before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="w-1/4 h-4 rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
              <Skeleton className="w-1/6 h-3 rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
            </div>
          </div>

          {/* COMMENT BODY PLACEHOLDER */}
          <div className="space-y-2 mt-4 pt-1">
            <Skeleton className="h-4 w-full rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
            <Skeleton className="h-4 w-5/6 rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
            <Skeleton className="h-4 w-3/4 rounded-lg before:!bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent bg-slate-100 dark:bg-slate-950/60" />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SkeletonComments;