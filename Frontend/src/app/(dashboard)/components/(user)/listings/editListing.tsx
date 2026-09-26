"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineXMark, HiOutlinePhoto } from "react-icons/hi2";
import { useUpdateListing } from "@/services/Listings/useUpdateListing";
import { useGetProfile } from "@/services/Profile/useGetProfile";
import { ListingProps } from "@/types/Listings";
import { getUrl } from "@/utils/helper";

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


  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const { mutate: updateListing, isPending } = useUpdateListing(
    listingId,
    () => {
      router.push("/dashboard/listings");
    }
  );

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


  const isOwner = profileLoading || !listing.owner || listing.owner._id === user?._id;

  const handleFilesSelected = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files) return;

    const fileArr = Array.from(files);
    const updatedFiles = [...newImages, ...fileArr].slice(0, 10);

    const updatedPreviews = updatedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    newPreviews.forEach((url) => URL.revokeObjectURL(url));

    setNewImages(updatedFiles);
    setNewPreviews(updatedPreviews);

    e.target.value = "";
  };


  const removeStagedImage = (index: number) => {
    const updatedFiles = newImages.filter((_, i) => i !== index);
    const updatedPreviews = newPreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages(updatedFiles);
    setNewPreviews(updatedPreviews);
  };

  const clearStagedImages = () => {
    newPreviews.forEach((p) => URL.revokeObjectURL(p));
    setNewImages([]);
    setNewPreviews([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateListing(
      {
        listingType: listing.listingType,
        title,
        description,
        price: Number(price),
        condition,
        shipping: {
          type: shippingType,
          cost: Number(shippingCost) || 0,
        },
        ...(newImages.length > 0 && { pics: newImages }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-10 mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link aria-label="Back to my listings"
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
          {/* PHOTOS */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-[var(--foreground)]">Photos</label>

            {newPreviews.length === 0 ? (
              <>
                <span className="text-xs text-[var(--foreground-muted)]">
                  Current photos — upload new ones below to replace this whole gallery.
                </span>
                <div className="flex flex-wrap gap-3">
                  {(listing.images?.length ? listing.images : []).map((img, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-soft)]"
                    >
                      <Image
                        src={getUrl(img) || ""}
                        alt={`${listing.title} photo ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {!listing.images?.length && (
                    <div className="w-20 h-20 rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--foreground-subtle)]">
                      <HiOutlinePhoto size={22} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-[var(--destructive)]">
                  These {newPreviews.length} photo{newPreviews.length === 1 ? "" : "s"} will replace the current gallery when you save.
                </span>
                <div className="flex flex-wrap gap-3">
                  {newPreviews.map((src, i) => (
                    <div
                      key={src}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)] group"
                    >
                      <Image src={src} alt={`New photo ${i + 1}`} fill unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeStagedImage(i)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove photo"
                      >
                        <HiOutlineXMark size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearStagedImages}
                  className="text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] w-fit"
                >
                  Cancel photo change (keep current gallery)
                </button>
              </>
            )}

            <label className="w-fit cursor-pointer text-xs font-bold px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors">
              {newPreviews.length ? "Choose different photos" : "Upload new photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
            </label>
          </div>

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
            Note: category and location aren&apos;t editable here yet — this form updates
            the listing&apos;s photos, title, description, price, condition, and shipping.
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