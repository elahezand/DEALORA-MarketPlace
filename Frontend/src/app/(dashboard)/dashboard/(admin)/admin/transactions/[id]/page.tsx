"use client";

import { useParams } from "next/navigation";
import TransactionDetail from "@/components/dashboard/admin/transactions/TransactionDetail";

export default function AdminTransactionDetailRoute() {
  const params = useParams<{ id: string }>();
  return <TransactionDetail orderId={params.id} />;
}
