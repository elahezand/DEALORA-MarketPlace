'use client';
import Link from "next/link";
import { useGetMyCart, useRemoveFromCart, useUpdateCart } from "@/services/Cart/cart";
import { Loader2, Trash2, X, ShoppingBag, Truck, Tag, Plus, Minus, AlertCircle } from "lucide-react";

type CartDrawerProps = { setIsOpen: (open: boolean) => void; };

const getOfferId = (item: any): string | null => item?.offer?._id ?? item?.offer ?? null;
const getProductId = (item: any): string | null => item?.product?._id ?? item?.product ?? null;

export default function CartDrawer({ setIsOpen }: CartDrawerProps) {
    const { data: cart, isLoading } = useGetMyCart();

    const { mutate: removeItem } = useRemoveFromCart();
    const { mutate: updateCart } = useUpdateCart();

    const items = cart?.data?.items || [];
    const pricing = cart?.data?.pricing || { subtotal: 0, discount: 0, shippingCost: 0, total: 0 };

    const toPayloadItem = (i: any) => ({
        offer: getOfferId(i),
        product: getProductId(i),
        variantId: i.variantId,
        quantity: i.quantity,
        priceSnapshot: i.priceSnapshot,
    });

    const handleRemove = (item: any) => {
        const offerId = getOfferId(item);
        removeItem({ offerId: offerId ?? item.variantId });
    };

    const handleQuantityChange = (item: any, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemove(item);
            return;
        }

        const targetOfferId = getOfferId(item);

        const updatedItems = items.map((i: any) => {
            const isTarget =
                String(getOfferId(i)) === String(targetOfferId) &&
                String(i.variantId) === String(item.variantId);

            const payloadItem = toPayloadItem(i);
            return isTarget ? { ...payloadItem, quantity: newQuantity } : payloadItem;
        });

        updateCart({ items: updatedItems });
    };

    return (
        <div className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white z-[1001] shadow-2xl flex flex-col border-l border-[var(--border)] animate-in slide-in-from-right duration-300">
            
            <div className="flex-none p-5 border-b border-[var(--border)] flex justify-between items-center bg-white">
                <h2 className="text-lg font-bold text-[var(--primary-900)] flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[var(--primary-400)]" /> Shopping Cart
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-[var(--muted)] rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {isLoading ? (
                    <div className="flex justify-center mt-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary-400)]" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center mt-20 space-y-2">
                        <ShoppingBag className="w-12 h-12 mx-auto text-slate-200" />
                        <p className="text-slate-400 text-sm">Your cart is empty</p>
                    </div>
                ) : (
                    items.map((item: any) => (
                        <div key={item._id ?? `${getOfferId(item)}-${item.variantId}`} className="flex gap-4 p-2 group">
                            <div className="w-20 h-20 bg-slate-50 border border-[var(--border)] rounded-[var(--radius)] flex-shrink-0 overflow-hidden">
                                {item.product?.images?.[0] && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.product.images[0]} alt={item.product?.title || ""} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                <h3 className="font-medium text-sm text-[var(--primary-900)] leading-tight line-clamp-2">{item.product?.title}</h3>
                                
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden h-8">
                                        {/* دکمه منفی: اگر ۱ بود حذف کن، اگر بیشتر بود کم کن */}
                                        <button 
                                            onClick={() => handleQuantityChange(item, item.quantity - 1)} 
                                            className="px-2 h-full hover:bg-slate-100 transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-8 text-center">{item.quantity}</span>
                                        {/* دکمه مثبت */}
                                        <button 
                                            onClick={() => handleQuantityChange(item, item.quantity + 1)} 
                                            className="px-2 h-full hover:bg-slate-100 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-[var(--primary-600)]">${item.price}</p>
                                </div>
                            </div>
                            <button onClick={() => handleRemove(item)} className="self-start text-slate-300 hover:text-[var(--destructive)] transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {items.length > 0 && (
                <div className="flex-none p-5 border-t border-[var(--border)] bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
                    <div className="space-y-3 mb-5 text-sm">
                        <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${pricing.subtotal}</span></div>
                        <div className="flex justify-between text-slate-500"><span className="flex items-center gap-1.5"><Truck className="w-4 h-4"/> Shipping</span><span>{pricing.shippingCost === 0 ? "Free" : `$${pricing.shippingCost}`}</span></div>
                        {pricing.discount > 0 && (
                            <div className="flex justify-between text-[var(--destructive)] font-bold"><span className="flex items-center gap-1.5"><Tag className="w-4 h-4"/> Discount</span><span>-${pricing.discount}</span></div>
                        )}
                        <div className="h-[1px] bg-[var(--border)]" />
                        <div className="flex justify-between items-center text-[var(--primary-900)] font-black text-xl">
                            <span>Order Total</span><span>${pricing.total}</span>
                        </div>
                    </div>
                    <Link
                        href="/cart/checkout"
                        onClick={() => setIsOpen(false)}
                        className="btn-primary w-full h-14 text-base font-bold shadow-[var(--btn-shadow)] transition-all active:scale-[0.98] flex items-center justify-center"
                    >
                        Proceed to Checkout
                    </Link>
                    <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Secure & fast checkout
                    </p>
                </div>
            )}
        </div>
    );
}