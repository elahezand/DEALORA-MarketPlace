"use client";
import React, { useState } from "react";
import { Spinner } from "@heroui/react";
import { Step1VerificationProps } from "@/types/Auth/AuthTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useVerify, useResendCode } from "@/services/Auth/Step1Verification";
import z from 'zod';

const validationCode = z.object({
    code: z.string().length(5, "Code must be 5 digits"),
});

type ValidateCode = z.infer<typeof validationCode>;

export const Step1Verification = ({
    phone,
    onSuccess,
    goBack,
}: Step1VerificationProps) => {
    const [isResend, setIsResend] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(validationCode),
        mode: "onChange"
    });

    const { mutate: verifyCode, isPending: isVerifying } = useVerify(onSuccess);
    const { mutate: resendCode, isPending: isResending } = useResendCode();

    const onSubmit = (data: ValidateCode) => {
        verifyCode({ phone, code: data.code });
    }

    const handleResendCode = () => {
        resendCode({ phone });
        setIsResend(true);
        setTimeout(() => setIsResend(false), 1000 * 60 * 10);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col items-center gap-6"
        >
            <div className="flex flex-col w-full max-w-[300px] items-start gap-2 px-2">
                <label className="text-[var(--foreground)] font-bold text-sm">Verification Code</label>
                <input
                    type="text"
                    {...register("code")}
                    placeholder="00000"
                    className="input"
                />
                {errors.code && (
                    <span className="text-[var(--destructive)] text-xs mt-1">{errors.code.message}</span>
                )}
            </div>
            <button
                type="submit"
                disabled={isVerifying}
                className="btn-primary w-[300px]"
            >
                {isVerifying ? <Spinner size="sm" color="white" /> : "Verify Code"}
            </button>

            <div className="flex gap-4 w-[300px]">
                <button
                    type="button"
                    onClick={goBack}
                    className="btn-secondary flex-1"
                >
                    Back
                </button>

                <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending || isResend}
                    className="btn-secondary flex-[2] disabled:opacity-30"
                >
                    {isResending ? <Spinner size="sm" color="current" /> : (isResend ? "Wait..." : "Resend Code")}
                </button>
            </div>
        </form>
    );
};