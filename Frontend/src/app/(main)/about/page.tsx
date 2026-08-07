import Link from "next/link";
import { MotionDiv, MotionP } from "@/utils/providers/MotionWrapper";

const aboutCards = [
  {
    title: "Who we are",
    description:
      "A local classifieds platform where people can quickly post listings, browse nearby items and services, and complete secure local transactions.",
    icon: (
      <svg
        className="w-6 h-6 text-blue-500 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: "How it works",
    description:
      "Post a listing in seconds, browse categories, contact sellers directly, and manage your ads from a personal dashboard — designed to make local trades easy.",
    icon: (
      <svg
        className="w-6 h-6 text-blue-500 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Categories",
    description:
      "Cars, Real Estate, Electronics, Home & Garden, Services, and Jobs — each with local filters and price ranges to find what you need faster.",
    icon: (
      <svg
        className="w-6 h-6 text-blue-500 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 10h16M4 14h16M4 18h16"
        />
      </svg>
    ),
  },
  {
    title: "Safety & Trust",
    description:
      "Listings are monitored, users can report suspicious posts, and we provide a safety guide for secure in-person transactions — trust and transparency are central to every exchange.",
    icon: (
      <svg
        className="w-6 h-6 text-blue-500 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Our process",
    description:
      "User-centered design, rapid feature releases, and continuous feedback from our community — we iterate with data and user input to improve the experience.",
    icon: (
      <svg
        className="w-6 h-6 text-blue-500 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.722 2.166a2 2 0 01-1.414 1.414l-2.166-.722a2 2 0 00-1.414-1.96l-.477-2.387a2 2 0 00-.547-1.022l-1.614-1.614a2 2 0 010-2.828l1.614-1.614a2 2 0 00.547-1.022l.477-2.387a2 2 0 001.414-1.96l.722-2.166a2 2 0 011.414-1.414l2.166.722a2 2 0 001.414 1.96l.477 2.387a2 2 0 00.547 1.022l1.614 1.614a2 2 0 010 2.828l-1.614 1.614z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: "Contact",
    description: (
      <>
        For partnerships or support:{" "}
        <strong className="text-slate-700 dark:text-slate-300 font-bold font-mono">
          contact@example.com
        </strong>{" "}
        — response within 48 business hours.
      </>
    ),
    icon: (
      <svg
        className="w-6 h-6 text-blue-500 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function AboutPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[var(--card)] backdrop-blur-xl rounded-[24px] border border-[var(--border)] shadow-[var(--card-shadow-1)] p-8 md:p-12 text-center relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* Header Section */}
        <MotionDiv
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-12 flex flex-col items-center"
        >
          <h2 className="text-3xl md:text-4xl font-black  tracking-tight flex items-center justify-center gap-3">
            About
            <span className="text-transparent bg-clip-text bg-[var(--destructive)] px-4 py-1 rounded-2xl border border-[var(--border)] text-3xl md:text-4xl font-black shadow-sm inline-block">
              Us
            </span>
          </h2>
          <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-widest max-w-md mx-auto mt-4">
            Your trusted local classifieds platform
          </p>
        </MotionDiv>

        {/* Cards Grid */}
        <MotionDiv
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
        >
          {aboutCards.map((card, index) => (
            <MotionDiv
              key={index}
              variants={cardVariants}
              whileHover={{
                y: -5,
                boxShadow: "var(--card-shadow-hover)",
              }}
              className="bg-[var(--card-solid)] border border-[var(--border)] rounded-[20px] p-6 shadow-[var(--card-shadow-2)] transition-all duration-300 flex flex-col gap-4"
            >
              <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
                <div className="bg-[var(--background-soft)] text-[var(--primary-500)] dark:text-[var(--accent-400)] rounded-xl p-3 w-12 h-12 flex items-center justify-center shadow-sm">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                  {card.title}
                </h3>
              </div>
              <MotionP className="text-[var(--foreground-muted)] text-[13px] font-medium leading-relaxed">
                {card.description}
              </MotionP>
            </MotionDiv>
          ))}
        </MotionDiv>

        {/* Action Buttons */}
        <MotionDiv
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-12 pt-8 border-t border-[var(--border)]"
        >
          <Link href="/" className="btn-secondary order-3 sm:order-1">
            Home
          </Link>

          <Link href="/posts/new" className="btn-primary order-1 sm:order-2">
            Post an Ad
          </Link>

          <Link href="/contact-us" className="btn-secondary order-2 sm:order-3">
            Contact Us
          </Link>
        </MotionDiv>
      </div>
    </div>
  );

}