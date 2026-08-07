"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { usePut } from "@/utils/hooks/useReactQueryHooks";
import { useGetProfile } from "@/services/Profile/getProfile";
import { ListingProps } from "@/types/Listings";

interface EditListingProps {
  listing: ListingProps | null;
  listingId: string;
}

export default function EditListing({ listing, listingId }: EditListingProps) {
  const router = useRouter();
  const { user, isLoading: profileLoading } = useGetProfile();

  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [price, setPrice] = useState(listing?.price ?? 0);
  const [condition, setCondition] = useState<"new" | "used">(listing?.condition ?? "new");
  const [shippingType, setShippingType] = useState(listing?.shipping?.type ?? "standard");
  const [shippingCost, setShippingCost] = useState(listing?.shipping?.cost ?? 0);

  const { mutate: updateListing, isPending } = usePut<any, any>(`/listings/${listingId}`, {
    onSuccess: () => {
      toast.success("Listing updated successfully");
      router.push("/dashboard/listings");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update listing");
    },
  });

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-[var(--foreground)] font-bold">Listing not found</p>
        <Link href="/dashboard/listings" className="btn-primary !w-auto px-5 h-10 text-sm mt-2">
          Back to Listings
        </Link>
      </div>
    );
  }

  // Ownership is also enforced server-side (PUT will 403 for a non-owner),
  // but we check here too so the user gets a clear message instead of a failed save.
  const isOwner = profileLoading || !listing.user || listing.user._id === user?._id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateListing({
      listingType: listing.listingType,
      title,
      description,
      price: Number(price),
      condition,
      shipping: {
        type: shippingType,
        cost: Number(shippingCost) || 0,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/listings"
          className="p-2 rounded-lg hover:bg-[var(--background-soft)] transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 text-[var(--foreground-muted)]" />
        </Link>
        <div>
          <p className="menu-section-title mb-1">Listings</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            Edit Listing
          </h1>
        </div>
      </div>

      {!isOwner ? (
        <div className="card rounded-2xl border border-[var(--destructive)]/30 bg-[var(--destructive-bg)] p-5">
          <p className="text-sm font-bold text-[var(--destructive)]">
            You don&apos;t have permission to edit this listing.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[var(--foreground)]">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              required
              className="h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[var(--foreground)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={3000}
              rows={5}
              required
              className="px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--foreground)]">Price</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--foreground)]">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as "new" | "used")}
                className="h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)]"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--foreground)]">Shipping Type</label>
              <select
                value={shippingType}
                onChange={(e) => setShippingType(e.target.value as "standard" | "express" | "free")}
                className="h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)]"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="free">Free</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--foreground)]">Shipping Cost</label>
              <input
                type="number"
                min={0}
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                disabled={shippingType === "free"}
                className="h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] disabled:opacity-50"
              />
            </div>
          </div>

          <p className="text-xs text-[var(--foreground-muted)]">
            Note: images, category, and location aren&apos;t editable here yet — this form updates
            the listing&apos;s title, description, price, condition, and shipping only.
          </p>

          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
            <Link
              href="/dashboard/listings"
              className="px-5 h-10 flex items-center rounded-lg text-sm font-bold border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary !w-auto px-5 h-10 text-sm disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
