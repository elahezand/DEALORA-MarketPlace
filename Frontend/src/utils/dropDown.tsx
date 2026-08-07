"use client"
import { useState } from "react";
import { FaAngleDown } from "react-icons/fa";
import Link from "next/link";

interface Dropdown {
    title: string;
    items?: any[]
    description: string,
    id: string,
    icon: any
}

export default function Dropdown({
    title,
    items,
    description,
    id,
    icon
}: Dropdown) {
    const [open, setOpen] = useState(false);

    return (
        <li className="flex flex-col gap-1 mb-3 p-2 rounded-xl transition-all duration-200 hover:bg-[var(--background-soft)]/50">
            <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center flex-1">
                    <span
                        dangerouslySetInnerHTML={{ __html: icon?.svgCode && icon?.svgCode }}
                        className="w-8 h-8 flex items-center justify-center text-[var(--primary-500)] dark:text-[var(--accent-400)] transition-colors"
                    />
                    <Link
                        href={`/posts?categoryId=${id}`}
                        className="block flex-1 text-[var(--foreground)] font-semibold text-[17px] hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-400)] transition-colors"
                    >
                        {title}
                        <span className="block text-[12px] font-normal text-[var(--foreground-muted)] mt-0.5">
                            {description}
                        </span>
                    </Link>
                </div>
                <FaAngleDown
                    className={`cursor-pointer text-[18px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-transform duration-200 ${open ? "rotate-180 text-[var(--primary-500)]" : ""
                        }`}
                    onClick={() => setOpen(!open)}
                />
            </div>

            {open && (
                <ul className="mt-2 pl-4 border-l border-[var(--border)] ml-5 flex flex-col gap-2">
                    {items?.map((item: any) => (
                        <li key={item._id} className="group/sub">
                            <Link
                                href={`/posts?categoryId=${item._id}`}
                                className="block py-1 text-[var(--foreground)] opacity-90 font-medium text-[15px] hover:text-[var(--primary-500)] dark:hover:text-[var(--accent-400)] cursor-pointer transition-colors"
                            >
                                {item.title}
                            </Link>

                            {item.subCategories?.length > 0 && (
                                <ul className="mt-1 pl-3 border-l border-[var(--border)] flex flex-col gap-1">
                                    {item.subCategories.map((s: any) => (
                                        <li key={s._id}>
                                            <Link
                                                href={`/posts?categoryId=${s._id}`}
                                                className="block py-1 text-[var(--foreground-muted)] text-[13px] hover:text-[var(--foreground)] cursor-pointer transition-colors"
                                            >
                                                {s.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}


