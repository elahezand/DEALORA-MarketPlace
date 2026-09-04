"use client";
import { useState } from "react";
import Logo from "./Logo";
import Link from "next/link";
import { useSubscribeNewsletter } from "@/services/Newsletter/useSubscribeNewsletter";

export function NewsletterBanner({ email, setEmail, handleSubscribe, isPending }: any) {
  return (
    <div className="absolute left-1/2 -top-28 w-full max-w-6xl -translate-x-1/2 px-4 z-30">
      <div className="page-card relative overflow-hidden p-8 sm:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-lg">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Join our newsletter.
            </h3>
            <p className="mt-2 text-[var(--foreground-muted)] text-sm sm:text-base">
              Get exclusive deals, product launches, and curated updates.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full sm:!w-[360px] md:!w-[380px] h-11"
            />
            <button type="submit" disabled={isPending} className="btn-primary shrink-0 h-11 !w-full sm:!w-auto disabled:opacity-60">
              {isPending ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");

  const { mutate, isPending } = useSubscribeNewsletter(() => setEmail(""));

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ email });
  };

  const footerLinks = [
    {
      title: "Shop",
      links: [
        { label: "New Arrivals", href: "/posts" },
        { label: "Best Sellers", href: "/posts?listingType=store_product" },
        { label: "Deals", href: "/posts" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/supports" },
        { label: "Returns", href: "/supports" },
        { label: "Shipping", href: "/supports" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/supports" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/legal/privacy" },
        { label: "Terms", href: "/legal/terms" },
        { label: "Cookies", href: "/legal/cookies" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden pt-32 pb-12 bg-[var(--background-soft)]/40">
      <div className="relative mx-auto max-w-7xl px-6">
        <NewsletterBanner email={email} setEmail={setEmail} handleSubscribe={handleSubscribe} isPending={isPending} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pt-30 pb-12 md:gap-16">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Logo showText className="h-[50px] w-[50px] object-contain sm:mt-4" />
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
              Premium shopping experience with curated products and deals.
            </p>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title} className="flex flex-col">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--primary-500)] dark:text-[var(--accent-400)]">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href} className="text-sm transition-all duration-300 hover:text-[var(--primary-600)] hover:pl-1 block">
                    {link.label}
                  </Link>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider opacity-100" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-xs text-[var(--foreground-subtle)]">
            © 2026 Dealora. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Twitter", "Instagram", "LinkedIn"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--primary-500)] dark:hover:text-[var(--accent-400)] transition-colors duration-200"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}