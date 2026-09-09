"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { useCreateNotification } from "@/services/Notifications/useCreateNotification";


export default function SendNotificationButton() {
    const [open, setOpen] = useState(false);
    const [targetAdmin, setTargetAdmin] = useState("");
    const [msg, setMsg] = useState("");

    const { data: adminsData } = useGet<
        {
            data: {
                _id: string;
                username?: string;
                phone: string;
            }[];
        }
    >("/users/admins", undefined, {
        enabled: open,
    });

    const admins = adminsData?.data ?? [];

    const { mutate: send, isPending } = useCreateNotification(() => {
        setOpen(false);
        setTargetAdmin("");
        setMsg("");
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!targetAdmin || !msg.trim()) return;

        console.log({
            admin: targetAdmin,
            msg: msg.trim(),
        });


        send({
            user: targetAdmin,
            msg: msg.trim(),
        });
    }

    useEffect(() => {
        if (!open) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title="Send notification to an admin"
                className="w-10 h-10 flex items-center justify-center rounded-[var(--radius)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors"
            >
                <HiOutlinePaperAirplane size={20} />
            </button>

            {open &&
                typeof document !== "undefined" &&
                createPortal(
                    <>
                        {/*  OVERLAY  */}
                        <div
                            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />

                        {/*  MODAL WRAPPER  */}
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                            {/*  MODAL  */}
                            <form
                                onSubmit={handleSubmit}
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto relative w-full max-w-sm bg-[var(--card-solid)] border border-[var(--border)] rounded-2xl shadow-[var(--card-shadow-hover)] p-5 flex flex-col gap-4"
                            >
                                <p className="text-sm font-bold text-[var(--foreground)]">
                                    Send Notification to Admin
                                </p>

                                {/* Recipient */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-[var(--foreground-muted)]">
                                        Recipient
                                    </label>

                                    <select
                                        value={targetAdmin}
                                        onChange={(e) => setTargetAdmin(e.target.value)}
                                        required
                                        className="h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--ring)]"
                                    >
                                        <option value="" disabled>
                                            {admins.length
                                                ? "Select an admin..."
                                                : "Loading admins..."}
                                        </option>

                                        {admins.map((a) => (
                                            <option key={a._id} value={a._id}>
                                                {a.username || a.phone}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Message */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-[var(--foreground-muted)]">
                                        Message
                                    </label>

                                    <textarea
                                        value={msg}
                                        onChange={(e) => setMsg(e.target.value)}
                                        rows={3}
                                        required
                                        placeholder="What do you want to tell them?"
                                        className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--ring)] resize-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            isPending ||
                                            !targetAdmin ||
                                            !msg.trim()
                                        }
                                        className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
                                    >
                                        {isPending ? "Sending..." : "Send"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}
