"use client";

import { useRouter } from "next/navigation";
import { HiOutlineShoppingCart } from "react-icons/hi2";
import { useGetMyCart } from "@/services/Cart/useGetMyCart";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { CartItem } from "@/types/Cart";
import { getUrl } from "@/utils/helper";

function ItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-[var(--background-soft)] flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3 w-2/3 rounded bg-[var(--background-soft)]" />
        <div className="h-2.5 w-1/3 rounded bg-[var(--background-soft)]" />
      </div>
    </div>
  );
}

export default function CartPreview() {
  const router = useRouter();
  const { data, isLoading } = useGetMyCart();
  const items: CartItem[] = data?.data?.items ?? [];

  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden">
      <WidgetHeader
        icon={HiOutlineShoppingCart}
        title="My Cart"
        href="/cart"
        showViewAll={items.length > 0}
      />

      {isLoading ? (
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <ItemSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 px-5">
          <p className="text-sm font-bold text-[var(--foreground)] mb-1">Your cart is empty</p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Items you add to your cart will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {items.slice(0, 4).map((item, index) => {
            const product = typeof item.productId === "object" ? item.productId : null;
            const src = getUrl(product?.images?.[0]);
            const key =
              (typeof item.offer === "object" ? item.offer?._id : item.offer) ??
              product?._id ??
              index;

            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[var(--background-soft)] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--background-soft)] border border-[var(--border)] flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {product?.images?.[0] ? (
                      <img loading="lazy" decoding="async"
                        src={src || ""}
                        alt={product?.title || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <HiOutlineShoppingCart className="w-4 h-4 text-[var(--foreground-subtle)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {product?.title || "Item"}
                    </p>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      Qty {item.quantity}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}