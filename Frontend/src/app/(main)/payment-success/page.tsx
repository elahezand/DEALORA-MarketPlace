"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MotionDiv } from "@/utils/providers/MotionWrapper";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);

      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-muted-foreground">Processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border border-border">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
              <svg
                className="w-12 h-12 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Payment Successful
          </h1>
          <p className="text-muted-foreground mb-6">
            Your order has been placed successfully
          </p>

          {orderId && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Order ID:</p>
              <p className="text-lg font-mono font-bold text-foreground break-all">
                {orderId}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-8">
            You can track your order status from the dashboard
          </p>

          <div className="flex gap-4 flex-col sm:flex-row">
            <Link
              href={orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders"}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View Order
            </Link>
            <Link
              href="/"
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Please wait or click one of the buttons above
          </p>
        </div>
      </MotionDiv>
    </div>
  );
};

export default PaymentSuccessPage;