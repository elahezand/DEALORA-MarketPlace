"use client";

import { HiOutlineTruck, HiOutlineBuildingStorefront, HiOutlineClock, HiOutlineBanknotes } from "react-icons/hi2";
import { Badge } from "../../shared/table/TableParts";
import { IAdminOrder, IAdminOrderItem } from "@/types/Order";
import { groupOrderItems, partStatus, itemDueTime, PartStatus } from "@/utils/orderDates";

interface TransactionPackagesProps {
  order: IAdminOrder;
  onShip: () => void;
  onCashReceived: () => void;
  onCashNotReceived: (items: IAdminOrderItem[]) => void;
  onChangeEta: (key: string, name: string, items: IAdminOrderItem[]) => void;
  onCancelGroup: (key: string, name: string) => void;
  isConfirmingCash: boolean;
  isReporting: boolean;
  /* key of the package being cancelled right now */
  cancellingGroup?: string | null;
}

/* packages — each store's part is delivered, paid out and cancelled on its own */
export default function TransactionPackages({
  order,
  onShip: openShip,
  onCashReceived: handleCashReceived,
  onCashNotReceived: handleCashNotReceived,
  onChangeEta: openEta,
  onCancelGroup: handleCancelGroup,
  isConfirmingCash,
  isReporting,
  cancellingGroup,
}: TransactionPackagesProps) {
  const parts = groupOrderItems(order.items ?? []);
  if (parts.length < 2 && !["processing", "shipped"].includes(order.status)) return null;
  const PART_TONE: Record<PartStatus, "success" | "warning" | "destructive" | "info"> = {
    preparing: "warning", shipped: "info", delivered: "success", cancelled: "destructive",
  };
  return (
    <div className="card rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
      <p className="text-sm font-bold text-[var(--foreground)]">Packages ({parts.length})</p>
      {parts.map(({ key, items }) => {
        const status = partStatus(items);
        const name = items[0]?.storeSnapshot?.name || "Site";
        const amount = items
          .filter((item) => !item.cancelledAt)
          .reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
        const isOrderOpen = ["processing", "shipped"].includes(order.status);
        const canCancel = isOrderOpen && (status === "preparing" || status === "shipped");
        const open = items.filter((item) => !item.cancelledAt && !item.deliveredAt);
        const shippedOpen = open.filter((item) => item.fulfillment?.status === "shipped");
        const isSite = key === "site";
        // the site's own items wait for the admin to ship them
        const canShip = isSite && isOrderOpen &&
          open.some((item) => item.needsAdminShipment && item.fulfillment?.status !== "shipped");
        // cash paid to the site: shipped and not confirmed yet
        const cashOpen = isSite && isOrderOpen && order.paymentMethod === "cash"
          ? shippedOpen.filter((item) => !item.cashCollectedAt)
          : [];
        const pastDue = cashOpen.length > 0 && cashOpen.every((item) => Date.now() >= itemDueTime(item));
        return (
          <div key={key} className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <HiOutlineBuildingStorefront className="w-4 h-4 text-[var(--foreground-muted)]" />
              <span className="text-sm text-[var(--foreground)] font-semibold truncate">{name}</span>
              <Badge tone={PART_TONE[status]} label={status} />
              <span className="text-xs text-[var(--foreground-muted)]">${amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
            {canShip && (
              <button
                type="button"
                onClick={openShip}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--primary-500)]/30 text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10 transition-colors flex items-center gap-1.5"
              >
                <HiOutlineTruck className="w-4 h-4" />
                Ship
              </button>
            )}
            {cashOpen.length > 0 && (
              <button
                type="button"
                onClick={handleCashReceived}
                disabled={isConfirmingCash}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/40 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                <HiOutlineBanknotes className="w-4 h-4" />
                {isConfirmingCash ? "Saving..." : "Cash received"}
              </button>
            )}
            {cashOpen.length > 0 && pastDue && !order.cashDispute?.reportedAt && (
              <button
                type="button"
                onClick={() => handleCashNotReceived(cashOpen)}
                disabled={isReporting}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isReporting ? "Saving..." : "Not received"}
              </button>
            )}
            {isOrderOpen && shippedOpen.length > 0 && (
              <button
                type="button"
                onClick={() => openEta(key, name, shippedOpen)}
                title="Change delivery time"
                aria-label="Change delivery time"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <HiOutlineClock className="w-4 h-4" />
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => handleCancelGroup(key, name)}
                disabled={cancellingGroup === key}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/40 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {cancellingGroup === key ? "Cancelling..." : "Cancel this part"}
              </button>
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
