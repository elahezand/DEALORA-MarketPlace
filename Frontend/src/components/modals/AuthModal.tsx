"use client";
import React, { useEffect, useState } from "react";
import Step0phoneNumber from "./step0phoneNumber";
import { FaLock } from "react-icons/fa";
import { Step } from "@/types/Auth/AuthTypes";
import { Step1Verification } from "./step1Verification";

export default function AuthModal({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}) {
    const [step, setStep] = useState<Step>(0);
    const [phone, setPhone] = useState("");
    const [remainingTime, setRemainingTime] = useState<string | undefined>();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={() => setIsOpen(false)} />

            <div
                className="relative z-10 w-full max-w-[460px] p-8 animate-in fade-in zoom-in-95 duration-300
                           bg-[var(--card)] rounded-[20px] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[var(--background-soft)] border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FaLock className="text-[var(--label-color)] text-xl" />
                    </div>

                    <h2 className="text-2xl font-bold !text-[var(--primary-600)] tracking-tight">
                        {step === 0 ? (
                            <>
                                DEAL <strong className="text-[var(--destructive)] font-black">ORA</strong>
                            </>
                        ) : (
                            "Verify Your Number"
                        )}
                    </h2>

                    <p className="text-[var(--foreground-muted)] text-sm mt-1">
                        {step === 0 ? "Enter your phone number to continue" : `Enter the code sent to ${phone}`}
                    </p>
                </div>

                {/* Steps Indicator using system tokens */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {["Phone", "Verify"].map((label, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 
                                    ${step >= i
                                        ? "bg-[var(--label-color)] text-white shadow-[var(--focus-ring-shadow)]"
                                        : "bg-[var(--background-soft)] text-[var(--foreground-subtle)] border border-[var(--border)]"
                                    }`}
                            >
                                {step > i ? "✓" : i + 1}
                            </div>
                            {i === 0 && (
                                <div className={`w-8 h-[2px] rounded transition-all duration-500 ${step >= 1 ? "bg-[var(--label-color)]" : "bg-[var(--border)]"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content Sections */}
                <div className="transition-all duration-200">
                    {step === 0 ? (
                        <Step0phoneNumber
                            onSuccess={(rt) => {
                                setRemainingTime(rt);
                                setStep(1);
                            }}
                            setPhone={setPhone}
                        />
                    ) : (
                        <Step1Verification
                            onSuccess={() => setIsOpen(false)}
                            phone={phone}
                            goBack={() => setStep(0)}
                            initialRemainingTime={remainingTime}
                        />
                    )}
                </div>

                {/* Terms and conditions segment */}
                <div className="mt-8 text-center">
                    <p className="text-[var(--foreground-subtle)] text-xs">
                        By continuing, you agree to our{" "}
                        <span className="text-[var(--label-color)] font-semibold cursor-pointer hover:underline transition-all">
                            Terms & Conditions
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}