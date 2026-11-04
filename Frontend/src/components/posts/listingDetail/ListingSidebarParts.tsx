"use client";

import { BadgeCheck, Loader2, MessageCircle, Phone, ShoppingCart, Store as StoreIcon } from "lucide-react";
import { ListingVariant } from "@/types/Listings";
import { getVariantFinalPrice } from "@/utils/price";

/*
   right column of the listing page (ListingDetailsClient): variant picker, buy / contact buttons, seller card.
   presentational only — state and cart actions stay in the parent.
*/

interface VariantOptionsProps {
    variants: ListingVariant[];
    selectedId?: string;
    onSelect: (variant: ListingVariant) => void;
}

export function VariantOptions({ variants, selectedId, onSelect }: VariantOptionsProps) {
    return (
        <div className="space-y-2.5 pt-4 border-t border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--foreground-muted)]">Select Options:</span>
            <div className="flex flex-wrap gap-2 mt-2">
                {variants.map((v: ListingVariant, index: number) => {
                    const attrLabel = v.attributes ? Object.values(v.attributes).join(" - ") : `Option ${index + 1}`;
                    const isSelected = selectedId === v._id;
                    return (
                        <button
                            key={v._id || index}
                            onClick={() => onSelect(v)}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${isSelected
                                ? "border-[var(--primary-500)] bg-[var(--primary-50)] text-[var(--primary-700)] dark:bg-[var(--primary-950)] dark:text-[var(--accent-300)] shadow-sm"
                                : "border-[var(--border)] hover:bg-[var(--background-soft)]"
                                }`}
                        >
                            {attrLabel}
                            <span className="ml-1 opacity-70 tabular-nums">· ${getVariantFinalPrice(v).toLocaleString()}</span>
                            {v.stock === 0 && <span className="text-red-500"> (Out of stock)</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface ListingActionsProps {
    isStoreProduct: boolean;
    onAddToCart: () => void;
    isAddToCartDisabled: boolean;
    isAddingToCart: boolean;
    isOutOfStock: boolean;
    cartError: string | null;
    onContactSeller: () => void;
    phoneRevealed: boolean;
    onRevealPhone: () => void;
    ownerPhone?: string;
}

export function ListingActions({
    isStoreProduct,
    onAddToCart,
    isAddToCartDisabled,
    isAddingToCart,
    isOutOfStock,
    cartError,
    onContactSeller,
    phoneRevealed,
    onRevealPhone,
    ownerPhone,
}: ListingActionsProps) {
    return (
        <div className="space-y-3 border-t border-[var(--border)] pt-5 mt-6">
            {isStoreProduct ? (
                <>
                    <button
                        type="button"
                        onClick={() => onAddToCart()}
                        disabled={isAddToCartDisabled}
                        className="btn-primary !w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"
                    >
                        {isAddingToCart ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <ShoppingCart size={16} />
                        )}
                        {isOutOfStock
                            ? "Out of Stock"
                            : isAddingToCart
                                ? "Adding..."
                                : "Add to Cart"}
                    </button>
                    {cartError && (
                        <p className="text-xs font-medium text-[var(--destructive)]">{cartError}</p>
                    )}
                </>
            ) : (
                <>
                    <button
                        onClick={onContactSeller}
                        className="btn-primary !w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"
                    >
                        <MessageCircle size={16} />
                        Contact seller
                    </button>
                    <button
                        onClick={onRevealPhone}
                        className="btn-secondary !w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl bg-[var(--background-soft)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors duration-200"
                    >
                        <Phone size={15} className="text-[var(--foreground-muted)]" />
                        <span>
                            {phoneRevealed ? (ownerPhone || "+1...") : "Show Phone Number"}
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}

interface SellerCardProps {
    isStoreProduct: boolean;
    offersCount: number;
    variantLabel?: string;
}

export function SellerCard({ isStoreProduct, offersCount, variantLabel }: SellerCardProps) {
    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm">
                    {isStoreProduct ? <StoreIcon size={20} className="text-[var(--primary-600)] dark:text-[var(--accent-400)]" /> : <BadgeCheck size={20} className="text-[var(--primary-600)] dark:text-[var(--accent-400)]" />}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--foreground)] truncate m-0 p-0 leading-tight">
                        {isStoreProduct
                            ? `${offersCount} seller${offersCount === 1 ? "" : "s"} available${variantLabel ? ` for ${variantLabel}` : ""}`
                            : "Verified seller"}
                    </p>
                    <p className="text-[11px] font-medium text-[var(--foreground-subtle)] m-0 p-0 leading-normal">
                        {isStoreProduct ? "Compare offers below to find the best price" : "Member since 2021"}
                    </p>
                </div>
            </div>
        </div>
    );
}
