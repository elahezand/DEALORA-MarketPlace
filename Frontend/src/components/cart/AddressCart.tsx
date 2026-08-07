import { IAddress } from "@/types/User";
import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { useDeleteAddress } from "@/services/Address/DeleteAddress";
import AddNewAddress from "./AddNewAddress";

export const AddressCard = ({
    addr,
    isSelected,
    onSelect,
}: {
    addr: IAddress;
    isSelected?: boolean;
    onSelect?: () => void;
    onEdit?: (address: IAddress) => void;
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const { mutate: deleteAddress } = useDeleteAddress();

    return (
        <>
            <div
                onClick={onSelect}
                className={`w-full cursor-pointer flex items-center justify-between p-5 rounded-[var(--radius)] border backdrop-blur-md transition-all duration-200
      ${isSelected
                        ? "border-[var(--primary-400)] bg-[var(--primary-50)]/40 dark:bg-[var(--primary-900)]/30 shadow-md scale-[1.01]"
                        : "border-[var(--border)] bg-[var(--card)] dark:bg-[var(--card-solid)] hover:border-[var(--border-strong)] hover:translate-y-[-2px] shadow-sm"
                    }`}
            >
                <div className="flex-1 text-left space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--primary-600)] text-white dark:bg-[var(--accent-500)]">
                            {addr.name}
                        </span>
                        <span className="text-xs text-[var(--foreground-muted)] font-semibold">
                            {addr.state} • {addr.city}
                        </span>
                    </div>

                    <p className="text-sm font-medium text-[var(--foreground)]">
                        {addr.address}
                    </p>

                    <p className="text-xs text-[var(--foreground-subtle)]">
                        Postal Code: {addr.postalCode}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAdding(true)
                        }}
                        className="text-[var(--foreground-subtle)] hover:text-[var(--primary-500)] p-2 rounded-lg hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-900)] transition-all duration-200"
                    >
                        <Pencil size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteAddress({ id: addr._id! });
                        }}
                        className="text-[var(--foreground-subtle)] hover:text-[var(--destructive)] p-2 rounded-lg hover:bg-[var(--destructive-bg)] dark:hover:bg-red-950/30 transition-all duration-200"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

            </div>
            {isAdding && (
                <div className="border-t border-[var(--border)] py-8 transition-all">
                    <AddNewAddress
                        isAdding={isAdding}
                        setIsAdding={setIsAdding}
                        editingAddress={addr}
                    />
                </div>
            )}
        </>
    );
};