'use client';
import React from 'react';
import { useState } from 'react';
import { useGetMyCart, useRemoveFromCart, useUpdateCart, useApplyCoupon } from "@/services/Cart/cart";
import { Trash2, ShoppingBag, Truck, Plus, Minus, AlertCircle, ArrowLeft, ShieldCheck, Tag } from "lucide-react";
import { Skeleton } from '@heroui/react';
import Link from 'next/link';

const MetaItem = ({ label, value }: { label: string; value: string }) => (
  <span className="text-xs text-slate-500 dark:text-slate-400">
    <span className="font-semibold text-slate-600 dark:text-slate-300">{label}:</span> {value}
  </span>
);


const getOfferId = (item: any): string | null => item?.offer?._id ?? item?.offer ?? null;
const getProductId = (item: any): string | null => item?.product?._id ?? item?.product ?? null;

export default function CartPage() {
  const { data: cart, isLoading } = useGetMyCart();  
  const [couponCode, setCouponCode] = useState("");

  const { mutate: applyCoupon, isPending: isApplying } = useApplyCoupon();
  const { mutate: removeItem } = useRemoveFromCart();
  const { mutate: updateCart } = useUpdateCart();

  const items = cart?.data?.items || [];
  const pricing = cart?.data?.pricing || { subtotal: 0, discount: 0, shippingCost: 0, total: 0 };

  const toPayloadItem = (i: any) => ({
    offer: getOfferId(i),
    product: getProductId(i),
    variantId: i.variantId,
    quantity: i.quantity,
    priceSnapshot: i.priceSnapshot,
  });

  const handleRemove = (item: any) => {
    const offerId = getOfferId(item);
    removeItem({ offerId: offerId ?? item.variantId });
  };

  const handleQuantityChange = (item: any, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove(item);
      return;
    }

    const targetOfferId = getOfferId(item);

    const updatedItems = items.map((i: any) => {
      const isTarget =
        String(getOfferId(i)) === String(targetOfferId) &&
        String(i.variantId) === String(item.variantId);

      const payloadItem = toPayloadItem(i);
      return isTarget ? { ...payloadItem, quantity: newQuantity } : payloadItem;
    });

    updateCart({ items: updatedItems });
  };

  if (isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-4/5 rounded-xl" />
        <Skeleton className="h-10 w-3/4 rounded-xl" />
      </div>
    );

  return (
    <div className="w-full px-8 mx-auto grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-8">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <h1 className="!text-2xl font-bold text-[var(--foreground)] flex items-center gap-3 tracking-tight">
          <ShoppingBag className="w-7 h-7 text-[var(--primary-400)]" />
          Shopping Cart
        </h1>
        <Link
          href="/posts?listingType=store_product"
          className="text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--primary-400)] dark:hover:text-[var(--accent-400)] transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card max-w-md mx-auto p-12 text-center flex flex-col items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-[var(--foreground-subtle)] mb-6 opacity-60" />
          <p className="text-[var(--foreground-muted)] mb-8 text-lg font-medium">
            Your cart is currently empty.
          </p>
          <Link href="/posts?listingType=store_product" className="btn-primary !w-auto inline-flex items-center gap-2 px-8 font-semibold">
            Go Shopping Now
          </Link>
        </div>
      ) : (
        /* Cart Content State */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8 items-start">

          {/* Items List Container */}
          <div className="space-y-4 lg:col-span-1">
            {items.map((item: any, index: number) => (
              <div
                key={`${getOfferId(item)}-${item.variantId}-${index}`}
                className="card p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative group"
              >
                {/* Product Image */}
                <div className="w-24 h-24 bg-[var(--input-bg)] rounded-2xl flex-shrink-0 border border-[var(--border)] overflow-hidden flex items-center justify-center">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-[var(--foreground-subtle)] opacity-40" />
                  )
                  }
                </div>

                {/* Product Info & Controls */}
                <div className="flex-1 w-full space-y-4">
                  <div className="pr-8">
                    <h3 className="font-bold text-base text-[var(--foreground)] leading-snug line-clamp-2">
                      {item.product?.title}
                    </h3>

                    {item.variantSnapshot?.attributes && (
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        {Object.entries(item.variantSnapshot.attributes)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ")}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                      {item.offer?.store && (
                        <MetaItem label="Sold by" value={item.offer.store?.name || "Store"} />
                      )}
                      {item.offer?.condition && (
                        <MetaItem label="Condition" value={item.offer.condition} />
                      )}
                    </div>
                  </div>

                  {/* Footer of Card: Quantity and Price */}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border)] border-dashed">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl h-9 overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="px-3 h-full flex items-center justify-center hover:bg-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-sm font-bold text-[var(--foreground)] w-8 text-center select-none">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="px-3 h-full flex items-center justify-center hover:bg-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price */}
                    <p className="font-bold text-lg text-[var(--foreground)] dark:text-[var(--accent-400)]">
                      ${(item.priceSnapshot * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item)}
                  className="p-2 text-[var(--foreground-subtle)] hover:text-[var(--destructive)] transition-colors absolute top-4 right-4 sm:top-5 sm:right-5 bg-transparent"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="card p-6 sticky top-28">
            <h2 className="text-lg font-bold mb-5 text-[var(--foreground)] pb-3 border-b border-[var(--border)]">
              Order Summary
            </h2>

            <div className="space-y-3.5 text-sm mb-6">
              <div className="flex justify-between text-[var(--foreground-muted)] font-medium">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--foreground)]">${pricing.subtotal.toFixed(2)}</span>
              </div>

              {pricing.discount > 0 && (
                <div className="flex justify-between text-[var(--success-500)] font-semibold animate-in slide-in-from-left-2">
                  <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Discount applied</span>
                  <span>-${pricing.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--foreground-muted)] font-medium">
                <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Shipping</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {pricing.shippingCost === 0 ? "Free" : `$${pricing.shippingCost.toFixed(2)}`}
                </span>
              </div>

              {/* Promo Code Input */}
              <div className="pt-4 border-t border-[var(--border)] mt-4">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 !h-10 text-sm"
                  />
                  <button
                    disabled={!couponCode || isApplying}
                    onClick={() => applyCoupon({ couponCode })}
                    className="btn-secondary !h-10 !w-auto text-sm px-4"
                  >
                    {isApplying ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>

              {/* Total Section */}
              <div className="flex justify-between items-baseline font-bold pt-5 text-[var(--foreground)] border-t border-[var(--border)] mt-4">
                <span>Order Total</span>
                <span className="text-2xl text-[var(--primary-500)] dark:text-[var(--accent-400)] font-black">
                  ${pricing.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Link href="/cart/checkout" className="btn-primary !w-full gap-2 font-semibold">
              <ShieldCheck className="w-5 h-5" /> Proceed to Checkout
            </Link>

            {/* Security Note */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--foreground-subtle)] border-t border-[var(--border)] pt-4 opacity-80">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--primary-400)] dark:text-[var(--accent-400)]" />
              Your checkout is secure and private.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}