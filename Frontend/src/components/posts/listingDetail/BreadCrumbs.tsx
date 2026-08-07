import React from 'react'

interface CategoryItem {
    _id: string;
    title: string;
    slug?: string;
}

interface CategoryComponentProps {
    categories: CategoryItem[];
}

export default function BreadCrumbs({ categories }: CategoryComponentProps) {
    console.log(categories);
    
  return (
    <div>
        {categories.length > 0 && (
            <nav className="flex items-center flex-wrap gap-2 text-xs text-[var(--foreground-subtle)] pb-6 select-none font-medium tracking-wide">
                <span className="hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-500)] transition-colors duration-200 cursor-pointer ease-out">
                    Home
                </span>
                
                {categories.map((cat, index) => (
                    <div key={cat._id} className="flex items-center gap-2">
                        <span className="opacity-30 font-light text-[var(--foreground-subtle)]">/</span >
                        <span 
                            className={`transition-all duration-200 ease-out ${
                                index === categories.length - 1 
                                    ? "text-[var(--foreground)] font-semibold tracking-normal" 
                                    : "hover:text-[var(--primary-600)] dark:hover:text-[var(--accent-500)] cursor-pointer"
                            }`}
                        >
                            {cat.title}
                        </span>
                    </div>
                ))}
            </nav>
        )}
    </div>
  )
}