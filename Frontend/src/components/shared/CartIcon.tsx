'use client';
import { IoCartOutline } from 'react-icons/io5';
import { useState } from 'react';
import { useGet } from '@/utils/hooks/useReactQueryHooks';
import { Link } from '@heroui/react';
export default function CartIcon() {
    const { data: cart } = useGet<any>('/cart/me', undefined, {
        axiosConfig: { silentAuth: true },
    });
    const items = cart?.data?.items || [];
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Link
                href={"/cart"}
                className="relative cursor-pointer p-2">
                <IoCartOutline className="text-2xl text-slate-700 dark:text-slate-200" />
                {items.length > 0 && (
                    <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {items.length}
                    </span>
                )}
            </Link>
        </>

    );
}