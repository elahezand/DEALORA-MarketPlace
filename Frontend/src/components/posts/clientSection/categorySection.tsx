"use client"
import React from 'react'
import Dropdown from '@/utils/dropDown'
import { Skeleton } from '@heroui/react'
import { useGet } from '@/utils/hooks/useReactQueryHooks'
import { MdCategory } from "react-icons/md";
import SectionHeader from './sectionHeader'
import { CategoriesTypeResponse, ICategory } from '@/types/Category'


export default function CategorySection() {
    const { data, isLoading } = useGet<CategoriesTypeResponse>("/categories");

    if (isLoading)
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-4/5 rounded-xl" />
                <Skeleton className="h-10 w-3/4 rounded-xl" />
            </div>
        );

    if (data?.data.length === 0)
        return (
            <div className="flex items-center justify-center h-full py-6">
                <p className="text-gray-500 dark:text-slate-400 font-medium">Not FOUND</p>
            </div>
        );

    return (
        <div className="border-b border-slate-200/60 dark:border-slate-800/80 py-6">
            <div className="mb-4 text-slate-800 dark:text-slate-200 transition-colors duration-200">
                <SectionHeader
                    title="Category"
                    icon={<MdCategory className="text-[var(--label-color)]"/>}
                />
            </div>
            {/* TREE STRUCTURE LINES */}
            <ul className="relative flex flex-col gap-2 pl-1 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800/80 before:rounded">
                {data?.data.map((item: ICategory, index: number) => (
                    <li
                        key={item._id || index}
                        className="group/item relative pl-4 transition-all duration-300"
                    >
                        {/* SUB-LINE CONNECTOR */}
                        <span className="absolute left-3 top-[18px] w-2 h-[1px] bg-slate-200 dark:bg-slate-800/80 group-hover/item:bg-[var(--secondary)] dark:group-hover/item:bg-teal-400 transition-colors duration-200" />

                        {/* ITEM CONTAINER */}
                        <div className="rounded-xl p-0.5 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-transparent dark:hover:border-slate-800/50 transition-all duration-200">
                            <Dropdown
                                title={item.title}
                                icon={item.icon}
                                description={item.description}
                                items={item.subCategories}
                                id={item._id}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}