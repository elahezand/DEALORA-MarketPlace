"use client";
import Link from "next/link";
import {
  MotionDiv,
  MotionH1,
  MotionH2,
  MotionP,
} from "../utils/providers/MotionWrapper";
import { FcCancel } from "react-icons/fc";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Gradient Effect */}
      <MotionDiv
        className="absolute inset-0 opacity-10 dark:opacity-5"
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="text-center relative z-10 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto">
        <MotionDiv
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <MotionH1
            className="text-[5rem] md:text-[7rem] font-black text-[var(--primary-600)] mb-10 leading-none"
          >
            Oops!
          </MotionH1>

          <MotionDiv
            className="flex justify-center mb-6"
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <FcCancel className="w-32 h-32" />
          </MotionDiv>

          <MotionH2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Something went wrong
          </MotionH2>

          <MotionP className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto">
            Don’t worry — this issue is on our side and we’re working to fix it.
          </MotionP>

          {/* Error Message Box */}
          <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-4 mb-8 border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
            <p className="text-[var(--destructive)] text-xs font-mono break-words">
              {error?.message ?? "An unexpected error occurred."}
            </p>
          </div>

          {/* Action Buttons */}
          <MotionDiv
            className="flex flex-col sm:flex-row gap-3 items-center justify-center"
          >
            <button
              onClick={reset}
              className="btn-primary"
            >
              Retry
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold transition-all"
            >
              Home
            </Link>

            <a
              href="mailto:support@example.com"
              className="btn-secondary"
            >
              Support
            </a>
          </MotionDiv>
        </MotionDiv>
      </div>
    </div>
  );
}