"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    HiOutlineArrowLeft,
    HiOutlineBuildingStorefront,
    HiOutlinePhone,
    HiOutlineMapPin,
    HiOutlineCheckCircle,
} from "react-icons/hi2";
import { useGetProfile } from "@/services/Profile/getProfile";
import { useUpdateStore } from "@/services/Store/useUpdateStore";

export default function EditStorePage() {
    const router = useRouter();
    const { store, hasStore, isLoading } = useGetProfile();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [logo, setLogo] = useState("");
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");
    const [street, setStreet] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!store) return;
        setName(store.name ?? "");
        setPhone(store.phone ?? "");
        setLogo(store.logo ?? "");
        setProvince(store.address?.province ?? "");
        setCity(store.address?.city ?? "");
        setStreet(store.address?.street ?? "");
        setPostalCode(store.address?.postalCode ?? "");
    }, [store]);

    const { mutate: updateStore, isPending } = useUpdateStore(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    });

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!store?._id) return;

        updateStore({
            id: store._id,
            name,
            phone,
            logo,
            address: {
                province,
                city,
                street,
                postalCode,
            },
        });
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 pb-10 max-w-2xl mx-auto w-full">
                <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
                    <p className="text-[var(--foreground-muted)] mt-4">Loading your store...</p>
                </div>
            </div>
        );
    }

    if (!hasStore || !store) {
        return (
            <div className="flex flex-col gap-8 pb-10 max-w-2xl mx-auto w-full">
                <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 text-center py-12">
                    <HiOutlineBuildingStorefront className="w-10 h-10 text-[var(--foreground-muted)] mx-auto mb-3" />
                    <p className="text-[var(--foreground)] font-bold mb-2">You don't have a store yet</p>
                    <Link
                        href="/create-shop"
                        className="btn-primary !w-auto px-5 h-9 text-sm inline-flex items-center gap-2 mt-2"
                    >
                        <span>+</span><span>Open a Store</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-10 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <Link
                    href="/my-store"
                    className="p-2 rounded-lg hover:bg-[var(--background-soft)] transition-colors"
                >
                    <HiOutlineArrowLeft className="w-5 h-5 text-[var(--foreground-muted)]" />
                </Link>
                <div>
                    <p className="menu-section-title mb-1">Store</p>
                    <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
                        Edit Store
                    </h1>
                </div>
            </div>

            <form
                onSubmit={handleSave}
                className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex flex-col gap-6"
            >
                <div className="flex items-center gap-5 pb-2 border-b border-[var(--border)]">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        {logo ? (
                            <img src={logo} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <HiOutlineBuildingStorefront className="w-6 h-6 text-[var(--foreground-muted)]" />
                        )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--foreground-muted)]">
                            Logo URL
                        </label>
                        <input
                            value={logo}
                            onChange={(e) => setLogo(e.target.value)}
                            placeholder="https://..."
                            disabled={isPending}
                            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
                            <HiOutlineBuildingStorefront className="w-3.5 h-3.5" /> Store name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your store name"
                            disabled={isPending}
                            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
                            <HiOutlinePhone className="w-3.5 h-3.5" /> Phone
                        </label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1234567890"
                            disabled={isPending}
                            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4 pt-2 border-t border-[var(--border)]">
                    <p className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
                        <HiOutlineMapPin className="w-3.5 h-3.5" /> Address
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            placeholder="Province"
                            disabled={isPending}
                            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                        />
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            disabled={isPending}
                            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                        />
                        <input
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            placeholder="Street"
                            disabled={isPending}
                            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                        />
                        <input
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="Postal code"
                            disabled={isPending}
                            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn-primary !w-auto px-6 h-10 text-sm disabled:opacity-50"
                    >
                        {isPending ? "Saving..." : "Save changes"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/my-store")}
                        disabled={isPending}
                        className="text-xs font-bold px-4 h-10 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                    >
                        Cancel
                    </button>
                    {saved && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--success-500)]">
                            <HiOutlineCheckCircle className="w-4 h-4" /> Saved successfully
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
