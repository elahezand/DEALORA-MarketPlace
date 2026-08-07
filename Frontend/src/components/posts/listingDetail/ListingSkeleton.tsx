import { Skeleton } from "@heroui/react";
export default function ListingSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 w-full overflow-hidden space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                <div className="space-y-4">
                    <Skeleton className="h-[380px] w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-68 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
            </div>
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
    );
}