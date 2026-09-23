"use client";
import React, { useState } from 'react';
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetMyCart } from "@/services/Cart/useGetMyCart";
import {useCheckout} from "@/services/Cart/useCheckout"
import { checkoutSchema } from '@/validations/cartSchrma';
import { Button } from "@heroui/react";
import { ShieldCheck } from "lucide-react";
import { useGetProfile } from '@/services/Profile/useGetProfile';
import { IAddress } from '@/types/User';
import { CartItem } from '@/types/Cart';
import { AddressCard } from '@/components/shared/address/AddressCard';
import AddNewAddress from '@/components/shared/address/AddNewAddress';
import { getCheckoutKey } from '@/utils/idempotencyKey';


type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const { data: cart } = useGetMyCart();
    const cartId = cart?.data?.id ?? cart?.data?._id;
    const { mutate: placeOrder, isPending } = useCheckout(cartId);
    const { user } = useGetProfile();
    const [isAdding, setIsAdding] = useState(false);
    const [useWallet, setUseWallet] = useState(false);

    // refunds of cancelled orders can be spent here
    const walletBalance = user?.wallet?.balance ?? 0;
    const orderTotal = cart?.data?.pricing?.total ?? 0;
    const walletPart = useWallet ? Math.min(walletBalance, orderTotal) : 0;
    const leftToPay = Math.max(orderTotal - walletPart, 0);

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            paymentMethod: "cash"
        }
    });

    const selectedAddress = watch("shippingAddress");

    const onSubmit = (data: CheckoutFormValues) => {
        placeOrder({
            shippingAddress: {
                ...data.shippingAddress,
                phone: user?.phone || "",
            },
            paymentMethod: data.paymentMethod,
            useWallet,
            // same key on a retry → the server returns the same order, never a second one
            idempotencyKey: getCheckoutKey(cartId),
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}
            className="w-full mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-8">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <h1 className="!text-2xl font-bold text-[var(--foreground)] tracking-tight">
                    Shipping Address
                </h1>
                <Button
                    variant="light"
                    size="sm"
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-[var(--primary-600)] dark:text-[var(--accent-400)] font-semibold hover:opacity-80 transition-opacity"
                >
                    {isAdding ? "Cancel" : "+ Add New"}
                </Button>
            </div>
            <div className="space-y-3">
                {user?.addresses?.map((addr: IAddress) => (
                    <AddressCard
                        key={addr._id}
                        addr={addr}
                        isSelected={selectedAddress?._id === addr._id}
                        onSelect={() => setValue("shippingAddress", addr, { shouldValidate: true })}
                    />
                ))}
            </div>
            {isAdding && (
                <div className="border-t border-[var(--border)] py-8 transition-all">
                    <AddNewAddress
                        isAdding={isAdding}
                        setIsAdding={setIsAdding} />
                </div>
            )}

            <aside className="h-fit sticky top-10">
                <div className="bg-[var(--card)] backdrop-blur-[20px] p-6 md:p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-sm transition-colors duration-250">
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--foreground)] mb-6 tracking-tight">Order Summary</h2>
                    <div className="space-y-4 mb-6 max-h-[240px] overflow-y-auto pr-2 border-b border-[var(--border)] pb-6">
                        {cart?.data?.items?.map((item: CartItem, index: number) => {
                            const product = typeof item.productId === "object" ? item.productId : null;
                            const offerId = typeof item.offer === "object" ? item.offer?._id : item.offer;
                            return (
                            <div
                                key={`${offerId ?? "direct"}-${item.variantId ?? "novariant"}-${index}`}
                                className="flex justify-between items-center text-sm"
                            >
                                <span className="text-[var(--foreground-muted)] font-medium">
                                    {product?.title}
                                    {item.variantSnapshot?.attributes && (
                                        <span className="block text-[var(--foreground-subtle)] text-xs">
                                            {Object.entries(item.variantSnapshot.attributes)
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(" · ")}
                                        </span>
                                    )}
                                    <span className="text-[var(--foreground-subtle)] text-xs"> x{item.quantity}</span>
                                </span>
                                <span className="font-semibold text-[var(--foreground)]">${(item.finalPrice * item.quantity).toFixed(2)}</span>
                            </div>
                            );
                        })}
                    </div>
                    {walletBalance > 0 && (
                        <div className="mb-6 border-b border-[var(--border)] pb-6">
                            <div
                                onClick={() => setUseWallet(!useWallet)}
                                className={`cursor-pointer flex items-center justify-between rounded-[0.75rem] border p-4 transition-all duration-200 ${useWallet
                                    ? "border-[var(--ring)] bg-[var(--primary-50)]/30 dark:bg-[var(--accent-500)]/5"
                                    : "border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--border-strong)]"
                                    }`}
                            >
                                <div>
                                    <span className="text-sm font-semibold text-[var(--foreground)]">
                                        Use wallet balance
                                    </span>
                                    <span className="block text-xs text-[var(--foreground-muted)]">
                                        ${walletBalance.toLocaleString()} available
                                    </span>
                                </div>
                                <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${useWallet
                                    ? "border-[var(--ring)] bg-[var(--ring)] scale-110"
                                    : "border-[var(--input-border)] bg-transparent"
                                    }`}>
                                    {useWallet && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </div>
                            </div>

                            {useWallet && (
                                <div className="mt-3 space-y-1 text-sm">
                                    <div className="flex justify-between text-[var(--foreground-muted)]">
                                        <span>Paid from wallet</span>
                                        <span>-${walletPart.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-[var(--foreground)]">
                                        <span>Left to pay</span>
                                        <span>${leftToPay.toFixed(2)}</span>
                                    </div>
                                    {leftToPay === 0 && (
                                        <p className="text-xs text-[var(--success-500)] font-semibold">
                                            Your wallet covers this order — no online payment needed.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-4 mb-6 max-h-[240px] overflow-y-auto pr-2 border-b border-[var(--border)] pb-6">
                        <h3 className='mb-4 tracking-tigh font-bold'>Payment Method</h3>
                        <Controller
                            name="paymentMethod"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-3 mb-6">
                                    {[{ id: "cash", label: "Cash on Delivery" }, { id: "zarinpal", label: "Pay Online (Zarinpal)" }].map((method) => {
                                        const isSelected = field.value === method.id;
                                        return (
                                            <div
                                                key={method.id}
                                                onClick={() => field.onChange(method.id)}
                                                className={`cursor-pointer flex items-center justify-between rounded-[0.75rem] border p-4 transition-all duration-200 ${isSelected
                                                    ? "border-[var(--ring)] bg-[var(--primary-50)]/30 dark:bg-[var(--accent-500)]/5 shadow-sm"
                                                    : "border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--border-strong)]"
                                                    }`}
                                            >
                                                <span className={`text-sm font-semibold transition-colors ${isSelected ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>
                                                    {method.label}
                                                </span>
                                                <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${isSelected
                                                    ? "border-[var(--ring)] bg-[var(--ring)] scale-110"
                                                    : "border-[var(--input-border)] bg-transparent"
                                                    }`}>
                                                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="btn-primary !w-full gap-2 font-semibold"
                        isLoading={isPending}>
                        <ShieldCheck size={18} /> Confirm & Pay
                    </Button>
                </div>
            </aside>
        </form>
    );
}