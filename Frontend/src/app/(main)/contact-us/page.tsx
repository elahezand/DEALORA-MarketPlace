"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MotionDiv } from "@/utils/providers/MotionWrapper";
import { useCreateContact } from "@/services/ContactUs/CreateContact";
import z from 'zod';
import { contactSchema } from "@/validations/contactUs";

type ContactFormData = z.infer<typeof contactSchema>;
export default function ContactUs() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
  });

  const { mutate, isPending } = useCreateContact(() => reset());
  const onSubmit = (data: ContactFormData) => {
    mutate(data);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[var(--card)] backdrop-blur-xl rounded-[24px] border border-[var(--border)] shadow-[var(--card-shadow-1)] p-8 md:p-12 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-[var(--primary-400)] to-transparent" />
        
        <MotionDiv
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, type: "spring" }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-black tracking-wider dark:text-slate-100 flex items-center justify-center gap-2">
            Contact
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 bg-red-50/60 dark:bg-rose-950/40 px-4 py-1 rounded-2xl border border-red-100/50 dark:border-rose-900/40 text-2xl font-black shadow-sm inline-block">
              Us
            </span>
          </h2>
          <p className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide max-w-md mx-auto mt-2">
            We'd love to hear from you, Send Us Message !
          </p>
        </MotionDiv>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center w-full gap-8 relative z-10"
          role="form"
          aria-label="Contact form"
        >
          {/* NAME INPUT */}
          <div className="flex flex-col w-full gap-2">
            <label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              placeholder="Your name"
              className="w-full focus:ring-4 focus:ring-[var(--primary-400)]/10"
              aria-invalid={!!errors?.name}
            />
            {errors?.name && (
              <span className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                ⚠️ {errors.name.message}
              </span>
            )}
          </div>

          {/* PHONE INPUT */}
          <div className="flex flex-col w-full gap-2">
            <label
              htmlFor="phone"
              className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              {...register("phone")}
              placeholder="e.g. 09121234567"
              className="w-full focus:ring-4 focus:ring-[var(--primary-400)]/10"
              aria-invalid={!!errors?.phone}
            />
            {errors?.phone ? (
              <span className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                ⚠️ {errors.phone.message}
              </span>
            ) : (
              <small className="text-[10px] font-bold text-[var(--foreground-subtle)] uppercase tracking-wider mt-0.5 ml-1.5">
                Example: 09121234567
              </small>
            )}
          </div>

          {/* EMAIL INPUT */}
          <div className="flex flex-col w-full gap-2">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              className="w-full focus:ring-4 focus:ring-[var(--primary-400)]/10"
              aria-invalid={!!errors?.email}
            />
            {errors?.email && (
              <span className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                ⚠️ {errors.email.message}
              </span>
            )}
          </div>

          {/* MESSAGE TEXTAREA */}
          <div className="flex flex-col w-full gap-2">
            <label
              htmlFor="message"
              className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              {...register("body")}
              placeholder="Write your message here..."
              className="w-full h-auto p-4 rounded-xl resize-none focus:ring-4 focus:ring-[var(--primary-400)]/10"
              aria-invalid={!!errors?.body}
            />
            {errors?.body && (
              <span className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                ⚠️ {errors.body.message}
              </span>
            )}
          </div>

          {/* SUBMIT SECTION */}
          <div className="w-full flex justify-end pt-4 mt-2 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}