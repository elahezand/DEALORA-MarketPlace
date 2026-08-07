"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MotionDiv } from "@/utils/providers/MotionWrapper";

const PaymentFailedPage = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/cart");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border border-border">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 dark:bg-red-900 rounded-full p-4">
              <svg
                className="w-12 h-12 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            پرداخت ناموفق
          </h1>
          <p className="text-muted-foreground mb-2">
            متاسفانه پرداخت شما تایید نشد
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            لطفا دوباره تلاش کنید یا از روش پرداخت دیگری استفاده نمایید
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>نکته:</strong> سفارش شما محفوظ است و می‌توانید دوباره پرداخت کنید
            </p>
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <Link
              href="/cart"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              بازگشت به سبد خرید
            </Link>
            <Link
              href="/"
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              صفحه اصلی
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            در 5 ثانیه به سبد خرید منتقل می‌شوید
          </p>
        </div>
      </MotionDiv>
    </div>
  );
};

export default PaymentFailedPage;
