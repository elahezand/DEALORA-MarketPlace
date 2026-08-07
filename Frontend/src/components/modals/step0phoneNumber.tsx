"use client";
import React from 'react';
import { Step0PhoneProps } from '@/types/Auth/AuthTypes';
import { useStartRegistration } from '@/services/Auth/Step0PhoneNumber';
import { Spinner } from '@heroui/react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from 'zod';

const validationPhoneNumber = z.object({
    phone: z.string()
        .length(11, "Phone number must be exactly 11 digits")
        .regex(/^09\d{9}$/, "Invalid Iranian phone number format"),
});

type ValidatePhone = z.infer<typeof validationPhoneNumber>;

export default function Step0phoneNumber({ setPhone, onSuccess }: Step0PhoneProps) {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(validationPhoneNumber),
        mode: "onChange"
    });

    const { mutate: startRegistration, isPending } = useStartRegistration(onSuccess);

    const onSubmit = (data: ValidatePhone) => {
        startRegistration({ phone: data.phone });
        setPhone(data.phone);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col items-center gap-5 w-full">
            <div className="flex flex-col w-full max-w-[300px] items-start gap-1.5">
                <label className="text-[var(--label-color)] font-semibold text-xs tracking-wide">
                    Phone Number
                </label>
                <input
                    type="text"
                    {...register("phone")}
                    placeholder="09121234567"
                    className="input w-full text-center tracking-widest placeholder:tracking-normal placeholder:text-[var(--foreground-subtle)]"
                />
                {errors.phone && (
                    <span className="error-text text-xs font-medium pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.phone.message}
                    </span>
                )}

                <small className="text-[var(--foreground-subtle)] text-[11px] pl-1 opacity-80">
                    Enter your 11-digit mobile number
                </small>
            </div>
            <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full max-w-[300px] font-semibold tracking-wide disabled:opacity-50 disabled:pointer-events-none"
            >
                {isPending ? <Spinner size="sm" color="white" /> : "Send Code"}
            </button>
        </form>
    );
}