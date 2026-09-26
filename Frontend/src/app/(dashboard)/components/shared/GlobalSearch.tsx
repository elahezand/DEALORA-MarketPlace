"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineClipboardDocumentList, HiOutlineTag } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { getUrl } from "@/utils/helper";
import { PublicListingsResponse, ListingProps } from "@/types/Listings";
import { OffersResponse, Offer } from "@/types/Offer";
import { AdminOrdersResponse, OrdersResponse, SellerOrdersResponse, IOrder, ISellerOrder } from "@/types/Order";

export type SearchRole = "admin" | "seller" | "user";

interface GlobalSearchProps {
    inputRef: React.RefObject<HTMLInputElement | null>;
    role: SearchRole;
}
const ROLE_CONFIG: Record<
    SearchRole,
    {
        secondaryLabel: string;
        secondaryEndpoint: string;
        ordersEndpoint: string;
        placeholder: string;
        orderDetailPath: (id: string) => string;
    }
> = {
    admin: {
        secondaryLabel: "Listings",
        secondaryEndpoint: "/listings/admin",
        ordersEndpoint: "/orders/admin",
        placeholder: "Search listings, orders...",
        orderDetailPath: (id) => `/dashboard/admin/transactions/${id}`,
    },
    seller: {
        secondaryLabel: "Your Offers",
        secondaryEndpoint: "/offers/me",
        ordersEndpoint: "/orders/seller",
        placeholder: "Search your offers, orders...",
        orderDetailPath: () => `/dashboard/seller/orders`,
    },
    user: {
        secondaryLabel: "Listings",
        secondaryEndpoint: "/listings",
        ordersEndpoint: "/orders/my",
        placeholder: "Search listings, orders...",
        orderDetailPath: (id) => `/dashboard/orders/${id}`,
    },
};

export default function GlobalSearch({ inputRef, role }: GlobalSearchProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const config = ROLE_CONFIG[role];
    const isSeller = role === "seller";

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    const searchEnabled = debouncedQuery.length >= 2;

    const { data: secondaryData, isLoading: isLoadingSecondary } = useGet<
        PublicListingsResponse | OffersResponse
    >(
        config.secondaryEndpoint,
        { q: debouncedQuery, limit: 5 },
        { queryKey: ["global-search-secondary", role, debouncedQuery], enabled: searchEnabled }
    );

    const { data: ordersData, isLoading: isLoadingOrders } = useGet<
        AdminOrdersResponse | OrdersResponse | SellerOrdersResponse
    >(
        config.ordersEndpoint,
        { q: debouncedQuery, limit: 5 },
        { queryKey: ["global-search-orders", role, debouncedQuery], enabled: searchEnabled }
    );

    const listings: ListingProps[] = !isSeller
        ? ((secondaryData?.data as ListingProps[] | undefined) ?? [])
        : [];
    const offers: Offer[] = isSeller
        ? ((secondaryData?.data as Offer[] | undefined) ?? [])
        : [];
    const orders: (IOrder | ISellerOrder)[] = ordersData?.data ?? [];
    const hasResults = listings.length > 0 || offers.length > 0 || orders.length > 0;
    const isLoading = isLoadingSecondary || isLoadingOrders;

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function goTo(path: string) {
        setIsOpen(false);
        setQuery("");
        router.push(path);
    }

    return (
        <div ref={containerRef} className="relative w-full hidden sm:block">
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={config.placeholder}
                className="w-full h-10 pl-9 pr-16 rounded-lg text-sm bg-[var(--background-soft)] border border-[var(--border)] focus:outline-none focus:border-[var(--ring)]"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 h-5 rounded border border-[var(--border-strong)] bg-[var(--card-solid)] text-[10px] font-black text-[var(--foreground-subtle)] select-none pointer-events-none">
                <span>⌘</span>K
            </kbd>

            {isOpen && searchEnabled && (
                <div className="absolute top-12 left-0 w-full min-w-[380px] max-h-[420px] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] shadow-2xl z-50 py-2">
                    {isLoading && (
                        <p className="px-4 py-3 text-xs text-[var(--foreground-muted)]">Searching...</p>
                    )}

                    {!isLoading && !hasResults && (
                        <p className="px-4 py-3 text-xs text-[var(--foreground-muted)]">
                            No results found for "{debouncedQuery}"
                        </p>
                    )}

                    {!isLoading && listings.length > 0 && (
                        <div className="mb-1">
                            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                                {config.secondaryLabel}
                            </p>
                            {listings.map((listing) => (
                                <button
                                    key={listing._id}
                                    type="button"
                                    onClick={() => goTo(`/posts/${listing._id}`)}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--background-soft)] transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                                        {listing.images?.[0] ? (
                                            <img loading="lazy" decoding="async" src={getUrl(listing.images[0]) || ""} alt={listing.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <HiOutlineTag className="w-4 h-4 text-[var(--foreground-subtle)]" />
                                        )}
                                    </div>
                                    <span className="text-sm text-[var(--foreground)] truncate">{listing.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {!isLoading && offers.length > 0 && (
                        <div className="mb-1">
                            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                                {config.secondaryLabel}
                            </p>
                            {offers.map((offer) => {
                                const product = typeof offer.productId === "object" ? offer.productId : null;
                                return (
                                    <button
                                        key={offer._id}
                                        type="button"
                                        onClick={() => goTo("/dashboard/seller/offers")}
                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--background-soft)] transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                                            {product?.images?.[0] ? (
                                                <img loading="lazy" decoding="async" src={getUrl(product.images[0]) || ""} alt={product?.title ?? "product"} className="w-full h-full object-cover" />
                                            ) : (
                                                <HiOutlineTag className="w-4 h-4 text-[var(--foreground-subtle)]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-[var(--foreground)] truncate">{product?.title || "—"}</p>
                                            <p className="text-xs text-[var(--foreground-muted)]">
                                                ${offer.price?.toLocaleString()} · {offer.status}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!isLoading && orders.length > 0 && (
                        <div>
                            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                                {role === "admin" ? "Orders" : "Your Orders"}
                            </p>
                            {orders.map((order) => (
                                <button
                                    key={order._id}
                                    type="button"
                                    onClick={() => goTo(config.orderDetailPath(order._id))}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--background-soft)] transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                                        <HiOutlineClipboardDocumentList className="w-4 h-4 text-[var(--foreground-subtle)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-mono text-[var(--foreground)]">#{order._id.slice(-8).toUpperCase()}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                            ${(order.pricing?.total ?? 0).toLocaleString()} · {order.status}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}