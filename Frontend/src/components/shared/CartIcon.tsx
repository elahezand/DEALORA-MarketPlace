'use client';
import { IoCartOutline } from 'react-icons/io5';
import { useGet } from '@/utils/hooks/useReactQueryHooks';
import { CartResponse } from '@/types/Cart';
import { Link } from '@heroui/react';
import { useGetProfile } from '@/services/Profile/useGetProfile';
export default function CartIcon() {
    const { user } = useGetProfile();
    // a guest has no cart on the server — asking for it returned 401 and showed "not authenticated"
    const { data: cart } = useGet<CartResponse>('/cart/me', undefined, {
        axiosConfig: { silentAuth: true },
        enabled: !!user,
        silentError: true,
        retry: false,
    });
    const items = cart?.data?.items || [];

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