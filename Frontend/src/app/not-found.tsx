"use client";
import Link from "next/link";
import {
  MotionDiv,
  MotionH1,
  MotionH2,
  MotionP,
} from "../utils/providers/MotionWrapper";
import { FcSearch } from "react-icons/fc";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Effect */}
      <MotionDiv
        className="absolute inset-0 opacity-10 dark:opacity-5"
        animate={{
          background: [
            "radial-gradient(circle at 20% 20%, var(--primary-500) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 80%, var(--primary-500) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 20%, var(--primary-500) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Main Card */}
      <div className="text-center relative z-10 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 p-8 md:p-12 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto">
        <MotionDiv
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <MotionH1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-[6rem] md:text-[8rem] font-black text-[var(--destructive)] mb-2 leading-none"
          >
            404
          </MotionH1>

          <MotionDiv
            className="flex justify-center mb-6"
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <FcSearch className="w-24 h-24" />
          </MotionDiv>

          <MotionH2
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4"
          >
            Page Not Found
          </MotionH2>

          <MotionP
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto"
          >
            The page you are looking for has been moved or doesn't exist.
          </MotionP>

          {/* Action Buttons */}
          <MotionDiv
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <Link
              href="/"
              className="btn-primary"
            >
              Go to Homepage
            </Link>

            <Link
              href="/posts"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-2 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold transition-all"
            >
              Search Site
            </Link>
          </MotionDiv>
        </MotionDiv>
      </div>
    </div>
  );
}