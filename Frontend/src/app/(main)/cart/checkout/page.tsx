"use client";
import React, { useState } from 'react';
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetMyCart, useCheckout } from "@/services/Cart/cart";
import { checkoutSchema } from '@/validations/cartSchrma';
import { Button } from "@heroui/react";
import { ShieldCheck } from "lucide-react";
import { useGetProfile } from '@/services/Profile/getProfile';
import { AddressCard } from '@/components/cart/AddressCart';
import AddNewAddress from '@/components/cart/AddNewAddress';


type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const { data: cart } = useGetMyCart();
    const { mutate: placeOrder, isPending } = useCheckout();
    const { user } = useGetProfile();
    const [isAdding, setIsAdding] = useState(false);

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            paymentMethod: "cash"
        }
    });

    const selectedAddress = watch("shippingAddress");

    const onSubmit = (data: CheckoutFormValues) => {
        placeOrder({
            shipping: {
                fullName: data.shippingAddress.name,
                phone: user?.phone || "",
                address: data.shippingAddress.address,
                city: data.shippingAddress.city,
                postalCode: data.shippingAddress.postalCode,
            },
            shippingAddress: data.shippingAddress,
            paymentMethod: data.paymentMethod,
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
                {user?.addresses?.map((addr: any) => (
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
                        {cart?.data?.items?.map((item: any) => (
                            <div key={item._id} className="flex justify-between items-center text-sm">
                                <span className="text-[var(--foreground-muted)] font-medium">{item.product?.title} <span className="text-[var(--foreground-subtle)] text-xs">x{item.quantity}</span></span>
                                <span className="font-semibold text-[var(--foreground)]">${((item.priceSnapshot ?? item.price ?? 0) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
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