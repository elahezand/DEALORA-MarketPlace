"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import ImageGallery from "./ImageGallery";
import ListingSkeleton from "./ListingSkeleton";
import TrustBadge from "./TrustBadge";
import StatBox from "./StateBox";
import SectionHeading from "./SectionHeading";
import MapSection from "./MapSection";
import BreadCrumbs from "./BreadCrumbs";
import { useGetProfile } from "@/services/Profile/getProfile";
import { ListingProps } from "@/types/Listings";
import { useAddToCart } from "@/services/Cart/cart";
import { useToggleFavorite, useIsFavorited } from "@/services/Favorites/favorites";
import { toast } from "sonner";
import {
    Eye,
    Truck,
    Clock3,
    MessageCircle,
    BadgeCheck,
    ShieldCheck,
    Phone,
    MapPin,
    Tag,
    PackageCheck,
    Sparkles,
    ChevronDown,
    ChevronUp,
    MapPinned,
    ShoppingCart,
    Flag,
    Store as StoreIcon,
    Loader2
} from "lucide-react";

const AuthModal = dynamic(() => import("../../modals/AuthModal"), { ssr: false });
const ReportModal = dynamic(() => import("../../modals/ReportModal"), { ssr: false });
const ContactSellerModal = dynamic(() => import("../../modals/ContactSellerModal"), { ssr: false });

interface ListingComponentProps {
    data: ListingProps | null;
}

export default function ListingDetailsClient({ data }: ListingComponentProps) {

    const [phoneRevealed, setPhoneRevealed] = useState(false);
    const [saved, setSaved] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);

    const { user } = useGetProfile();
    const [selectedVariant, setSelectedVariant] = useState<any>(data?.variants?.[0] || null);

    const isStoreProduct = data?.listingType === "store_product";

    // React Query Cart & Favorites Hooks
    const addToCartMutation = useAddToCart();
    const { data: favoriteData } = useIsFavorited(data?._id);
    const toggleFavoriteMutation = useToggleFavorite(data?._id);

    useEffect(() => {
        if (favoriteData?.isFavorited !== undefined) {
            setSaved(favoriteData.isFavorited);
        }
    }, [favoriteData?.isFavorited]);

    const specs = useMemo(() => {
        if (!data?.specs) return {};
        if (data.specs instanceof Map) {
            return Object.fromEntries(data.specs);
        }
        if (!Array.isArray(data.specs)) {
            return data.specs as Record<string, string | number | boolean>;
        }
        const obj: Record<string, string | number | boolean> = {};
        data.specs.forEach((item: any) => {
            if (item && item.key) obj[item.key] = item.value;
        });
        return obj;
    }, [data?.specs]);

    if (!data) return <ListingSkeleton />;

    const hasSpecs = Object.keys(specs).length > 0;
    const isFreeShipping = data.shipping?.type === "free" || (data.shipping?.cost ?? 0) === 0;
    const description = data.description || "";
    const isLongDescription = description.length > 320;

    const displayLocation = !isStoreProduct && data.location
        ? [data.location.city, data.location.state].filter(Boolean).join(", ")
        : null;

    const basePrice = isStoreProduct && selectedVariant ? selectedVariant.price : data.price;
    const formattedPrice = (basePrice || 0).toLocaleString();

    const defaultOffer = data?.offers?.[0] || null;
    const defaultVariant = data?.variants?.[0] || null;

    const currentVariantStock = isStoreProduct
        ? (selectedVariant?.stock ?? defaultVariant?.stock ?? defaultOffer?.stock ?? 0)
        : null;

    const isOutOfStock = isStoreProduct ? currentVariantStock === 0 : false;
    const isAddToCartDisabled =
        addToCartMutation.isPending ||
        isOutOfStock
    // Report
   
    const handleReportClick = () => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }
        setIsReportOpen(true);
    };

    // Contact Seller
    const handleContactSeller = () => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }
        if (!data?.user?._id) {
            toast.error("Seller information isn't available for this listing right now.");
            return;
        }
        if (data.user._id === user._id) {
            toast.error("This is your own listing.");
            return;
        }
        setIsContactOpen(true);
    };

    // Add to Cart
    const handleAddToCart = (offerId?: string) => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }

        setCartError(null);

        const validOfferId =
            typeof offerId === "string" ? offerId : undefined;

        const selectedOffer = validOfferId
            ? data?.offers?.find((offer: any) => offer._id === validOfferId)
            : data?.offers?.[0];

        const targetVariant =
            selectedVariant || data?.variants?.[0];
        if (!data?._id) {
            setCartError("Product id is missing.");
            return;
        }

        if (!targetVariant?._id) {
            setCartError("Please select a product option.");
            return;
        }

        const itemPayload = {
            product: data._id,
            variantId: targetVariant._id,
            quantity: 1,
            priceSnapshot:
                selectedOffer?.price ??
                targetVariant?.price ??
                data.price ??
                0,

            ...(selectedOffer?._id && {
                offer: selectedOffer._id,
            }),
        };


        addToCartMutation.mutate(
            { items: [itemPayload] },
            { onSuccess: (res) => { toast.success("Added to cart") } }
        );
    };
    // Toggle Favorite
    const handleSaveToggle = () => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }

        const productType = isStoreProduct ? "store_product" : "user_ad";
        toggleFavoriteMutation.mutate(
            { productType },
            {
                onSuccess: (res) => {
                    const isFav = res?.isFavorited ?? !saved;
                    setSaved(isFav);
                    toast.success(isFav ? "Added to favorites" : "Removed from favorites");
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* BREADCRUMB & REPORT */}
            <div className="flex items-center justify-between gap-3">
                <BreadCrumbs categories={data.categoryPath || []} />
                <button
                    onClick={handleReportClick}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-subtle)] hover:text-[var(--destructive)] transition-colors duration-200 shrink-0"
                >
                    <Flag size={13} />
                    Report
                </button>
            </div>

            <ReportModal
                isOpen={isReportOpen}
                setIsOpen={setIsReportOpen}
                targetType="listing"
                targetId={data._id}
            />
            <AuthModal isOpen={isAuthOpen} setIsOpen={setIsAuthOpen} />
            {!isStoreProduct && (
                <ContactSellerModal
                    isOpen={isContactOpen}
                    setIsOpen={setIsContactOpen}
                    recipientId={data.user?._id || ""}
                    recipientName={data.user?.name}
                    listingId={data._id}
                    listingTitle={data.title}
                />
            )}

            {/* MAIN GRID: GALLERY & SIDEBAR */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-stretch">
                {/* LEFT COLUMN: Gallery & Trust Badges */}
                <div className="flex flex-col gap-4 min-w-0 justify-between">
                    <div className="card flex-1 overflow-hidden relative p-4">
                        <ImageGallery
                            images={data.images || []}
                            title={data.title || ""}
                            price={basePrice || 0}
                            isSaved={saved}
                            onSaveToggle={handleSaveToggle}
                        />
                    </div>
                    <div className="card overflow-hidden">
                        <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
                            <TrustBadge icon={<ShieldCheck size={15} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} label={isStoreProduct ? "Original Guarantee" : "Buyer protection"} />
                            <TrustBadge icon={<BadgeCheck size={15} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} label={isStoreProduct ? "Official Store" : "Verified seller"} />
                            <TrustBadge icon={<Truck size={15} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} label={isStoreProduct ? "Express Delivery" : "Fast shipping"} />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Buying Actions */}
                <div className="flex flex-col gap-4 min-w-0 justify-between">
                    <div className="card p-6 space-y-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--primary-50)] text-[var(--primary-700)] dark:bg-[var(--primary-950)] dark:text-[var(--accent-300)] border border-[var(--border)]">
                                    <Sparkles size={10} className="fill-current" />
                                    {isStoreProduct ? "Store Product" : `${data.condition === "new" ? "New" : "Used"} Ad`}
                                </span>
                                <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--foreground-muted)]">
                                    <Eye size={13} className="text-[var(--foreground-subtle)]" />
                                    {(data.metrics?.views ?? 0).toLocaleString()} views
                                </span>
                            </div>

                            <div className="space-y-6">
                                <h1 className="!text-2xl md:text-[18px] font-semibold leading-snug tracking-tight text-[var(--foreground)] break-words">
                                    {data.title}
                                </h1>
                                {displayLocation && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--foreground-muted)]">
                                        <MapPin size={13} className="text-[var(--foreground-subtle)]" />
                                        {displayLocation}
                                    </div>
                                )}
                            </div>

                            {/* VARIANTS PICKER (STORE PRODUCT ONLY) */}
                            {isStoreProduct && data.variants && data.variants.length > 0 && (
                                <div className="space-y-2.5 pt-4 border-t border-[var(--border)]">
                                    <span className="text-xs font-bold text-[var(--foreground-muted)]">Select Options:</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {data.variants.map((v: any, index: number) => {
                                            const attrLabel = v.attributes ? Object.values(v.attributes).join(" - ") : `Option ${index + 1}`;
                                            const isSelected = selectedVariant?._id === v._id;
                                            return (
                                                <button
                                                    key={v._id || index}
                                                    onClick={() => {
                                                        setSelectedVariant(v);
                                                        setCartError(null);
                                                    }}
                                                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${isSelected
                                                        ? "border-[var(--primary-500)] bg-[var(--primary-50)] text-[var(--primary-700)] dark:bg-[var(--primary-950)] dark:text-[var(--accent-300)] shadow-sm"
                                                        : "border-[var(--border)] hover:bg-[var(--background-soft)]"
                                                        }`}
                                                >
                                                    {attrLabel} {v.stock === 0 && <span className="text-red-500">(Out of stock)</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-[var(--border)] pt-5 flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold tracking-tight text-[var(--primary-600)] dark:text-[var(--accent-400)] tabular-nums">
                                    ${formattedPrice}
                                </span>
                                <span className="text-[12px] font-medium text-[var(--foreground-subtle)] uppercase tracking-wider">
                                    {isStoreProduct ? "Inc. VAT" : "negotiable"}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-8">
                                <StatBox label={isStoreProduct ? "Stock" : "Condition"} value={isStoreProduct ? `${currentVariantStock ?? 0} pcs` : (data.condition === "new" ? "New" : "Used")} />
                                <StatBox label="Shipping" value={isFreeShipping ? "Free" : "Paid"} accent={isFreeShipping} />
                                <StatBox label={isStoreProduct ? "Sold" : "Views"} value={isStoreProduct ? String(data.metrics?.sold || 0) : String(data.metrics?.views || 0)} />
                            </div>
                        </div>

                        {/* CTA BUTTONS */}
                        <div className="space-y-3 border-t border-[var(--border)] pt-5 mt-6">
                            {isStoreProduct ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleAddToCart()}
                                        disabled={isAddToCartDisabled}
                                        className="btn-primary !w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"
                                    >
                                        {addToCartMutation.isPending ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <ShoppingCart size={16} />
                                        )}
                                        {isOutOfStock
                                            ? "Out of Stock"
                                            : addToCartMutation.isPending
                                                ? "Adding..."
                                                : "Add to Cart"}
                                    </button>
                                    {cartError && (
                                        <p className="text-xs font-medium text-[var(--destructive)]">{cartError}</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleContactSeller}
                                        className="btn-primary !w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"
                                    >
                                        <MessageCircle size={16} />
                                        Contact seller
                                    </button>
                                    <button
                                        onClick={() => setPhoneRevealed(true)}
                                        className="btn-secondary !w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl bg-[var(--background-soft)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors duration-200"
                                    >
                                        <Phone size={15} className="text-[var(--foreground-muted)]" />
                                        <span>
                                            {phoneRevealed ? (data.user?.phone || "+1...") : "Show Phone Number"}
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* SELLER / STORE CARD */}
                    <div className="card p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm">
                                {isStoreProduct ? <StoreIcon size={20} className="text-[var(--primary-600)] dark:text-[var(--accent-400)]" /> : <BadgeCheck size={20} className="text-[var(--primary-600)] dark:text-[var(--accent-400)]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[var(--foreground)] truncate m-0 p-0 leading-tight">
                                    {isStoreProduct ? (data.store?.name || "Official Store") : "Verified seller"}
                                </p>
                                <p className="text-[11px] font-medium text-[var(--foreground-subtle)] m-0 p-0 leading-normal">
                                    {isStoreProduct ? "Authorized Marketplace Vendor" : "Member since 2021"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LOWER SECTION: Offers, Description, Specifications, Protection Notice, Map */}
            <div className="grid grid-cols-1 gap-6 mt-6">
                {/* OFFERS (STORE PRODUCT ONLY) */}
                {isStoreProduct && data.offers && data.offers.length > 0 && (
                    <div className="card p-6 space-y-4 w-full">
                        <SectionHeading icon={<StoreIcon size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} title="Other Sellers & Offers" />
                        <div className="divide-y divide-[var(--border)]">
                            {data.offers.map((offer: any) => (
                                <div key={offer._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[var(--foreground)]">{offer.store?.name || "Vendor"}</span>
                                        <span className="text-xs text-[var(--foreground-subtle)]">Condition: {offer.condition}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="block text-base font-extrabold text-[var(--foreground)]">${offer.price.toLocaleString()}</span>
                                            {offer.discount > 0 && (
                                                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                                    {offer.discount}% OFF
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(offer._id)}
                                            disabled={addToCartMutation.isPending || offer.stock === 0 || !(selectedVariant?._id || defaultVariant?._id)}
                                            className="h-9 px-4 text-xs font-bold rounded-lg btn-secondary bg-[var(--background-soft)] border-[var(--border)] hover:bg-[var(--border)] flex items-center gap-1.5"
                                        >
                                            {addToCartMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                                            Buy Offer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {cartError && (
                            <p className="text-xs font-medium text-[var(--destructive)]">{cartError}</p>
                        )}
                    </div>
                )}

                {/* DESCRIPTION & SPECS */}
                <div className="card p-6 space-y-6 w-full">
                    <div className="space-y-3">
                        <SectionHeading icon={<Clock3 size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} title="Description" />
                        <p className={`text-sm text-[var(--foreground-muted)] leading-[1.85] whitespace-pre-line font-medium ${!descExpanded && isLongDescription ? "line-clamp-5" : ""}`}>
                            {description}
                        </p>
                        {isLongDescription && (
                            <button
                                onClick={() => setDescExpanded((v) => !v)}
                                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-600)] dark:text-[var(--accent-400)] hover:underline transition-all duration-200"
                            >
                                {descExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show more</>}
                            </button>
                        )}
                    </div>

                    {hasSpecs && (
                        <div className="border-t border-[var(--border)] pt-6 space-y-4">
                            <SectionHeading icon={<Tag size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} title="Specifications" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {Object.entries(specs).map(([key, value]) => (
                                    <div key={key} className="flex rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                                        <div className="bg-[var(--background-soft)] w-1/3 px-3 py-2.5 text-xs font-bold text-[var(--foreground-muted)] capitalize flex items-center border-r border-[var(--border)]">
                                            {key.replace(/_/g, " ")}
                                        </div>
                                        <div className="px-3 py-2.5 text-xs font-semibold text-[var(--foreground)] truncate flex items-center flex-1 bg-[var(--card-solid)]">
                                            {String(value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* PROTECTION NOTICE */}
                <div className="card p-4 flex flex-col sm:flex-row items-center gap-4 justify-between w-full">
                    <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
                        <div className="h-10 w-10 rounded-full bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                            <PackageCheck size={18} className="text-[var(--primary-600)] dark:text-[var(--accent-400)]" />
                        </div>
                        <p className="text-xs font-medium text-[var(--foreground-muted)] leading-relaxed max-w-md m-0 p-0">
                            {isStoreProduct
                                ? "This order qualifies for official vendor fulfillment check and secure checkout guarantee."
                                : "Your payment is held securely until you confirm delivery. Learn more about our protection policy."}
                        </p>
                    </div>
                    <button className="btn-secondary h-9 px-4 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 bg-[var(--background-soft)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--border)]">
                        Details
                    </button>
                </div>

                {/* MAP LOCATION (NON-STORE ONLY) */}
                {!isStoreProduct && data.location && (
                    <div className="card p-6 space-y-4 w-full">
                        <SectionHeading icon={<MapPinned size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />} title="Location" />
                        <div className="rounded-xl overflow-hidden border border-[var(--border)]">
                            <MapSection
                                lat={data.location?.lat}
                                lng={data.location?.lng}
                                city={data.location?.city}
                                state={data.location?.state}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}