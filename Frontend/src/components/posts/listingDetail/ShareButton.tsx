"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, Check, Copy, MessageCircle, Send } from "lucide-react";

interface ShareButtonProps {
    title: string;
    price: number;
}

export default function ShareButton({ title, price }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentUrl(window.location.href);
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const shareText = `${title} — $${price.toLocaleString()}\n${currentUrl}`;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setOpen(false);
            }, 1000);
        } catch (err) {
            console.error("Failed to copy link: ", err);
        }
    };

    const shareNative = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: `${title} — $${price.toLocaleString()}`,
                    url: currentUrl
                });
            } catch (err) {
                setOpen((v) => !v);
            }
        } else {
            setOpen((v) => !v);
        }
    };

    const shareOptions = [
        {
            label: "WhatsApp",
            icon: <MessageCircle size={14} />,
            href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        },
        {
            label: "Telegram",
            icon: <Send size={14} />,
            href: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`${title} — $${price.toLocaleString()}`)}`,
        },
        {
            label: "Twitter / X",
            icon: <Share2 size={14} />,
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        },
    ];

    return (
        <div ref={containerRef} className="relative inline-block w-full max-w-full">
            <button
                onClick={shareNative}
                className="btn-secondary h-9 flex items-center justify-center gap-1.5 text-xs font-semibold w-full transition-all duration-200"
            >
                <Share2 size={13} className="text-white" />
                <span>Share</span>
            </button>

            {open && (
                <div 
                    className="absolute bottom-full right-0 mb-2 md:top-full md:bottom-auto md:mt-1 w-44 bg-[var(--card)] backdrop-filter backdrop-blur-[20px] border border-[var(--border)] rounded-[12px] shadow-[var(--card-shadow-hover)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 md:slide-in-from-top-2 duration-150"
                >
                    <div className="py-1">
                        {shareOptions.map((opt) => (
                            <a
                                key={opt.label}
                                href={opt.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors duration-200 w-full"
                            >
                                <span className="text-[var(--foreground-subtle)] flex-shrink-0 transition-colors duration-200">
                                    {opt.icon}
                                </span>
                                <span className="truncate">{opt.label}</span>
                            </a>
                        ))}
                    </div>
                    
                    <button
                        onClick={copyLink}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors duration-200 border-t border-[var(--border)] text-left"
                    >
                        <span className="flex-shrink-0 transition-colors duration-200">
                            {copied ? (
                                <Check size={14} className="text-[var(--success-500)]" />
                            ) : (
                                <Copy size={14} className="text-[var(--foreground-subtle)]" />
                            )}
                        </span>
                        <span className={`truncate transition-all duration-200 ${copied ? "text-[var(--success-500)] font-semibold" : "font-medium"}`}>
                            {copied ? "Copied!" : "Copy link"}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}