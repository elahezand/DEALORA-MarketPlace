"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useGetProfile } from "@/services/Profile/getProfile";
import AddNewAddress from "@/components/cart/AddNewAddress";
import { AddressCard } from "@/components/cart/AddressCart";
import { PersonalInfoForm } from "@/app/(dashboard)/components/shared/PersonalInfoForm";
import { IAddress } from "@/types/User";

export default function SettingsPage() {
  const { user } = useGetProfile();
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="flex flex-col gap-5 pb-10 max-w-6xl mx-auto">
      <div>
        <p className="menu-section-title mb-1">Account</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Settings
        </h1>
      </div>

      <PersonalInfoForm
        initialUsername={user?.username}
        initialEmail={user?.email}
        phone={user?.phone}
        profilePicture={user?.profilePicture}
      />

      {/* Address Management Section */}
      <div className="card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <h1 className="!text-2xl font-bold text-[var(--foreground)] tracking-tight">
            Addresses
          </h1>
          <Button
            variant="light"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="text-[var(--primary-600)] dark:text-[var(--accent-400)] font-semibold hover:opacity-80 transition-opacity"
          >
            {isAdding ? "Cancel" : "+ Add New"}
          </Button>
        </div>

        <div className="space-y-3">
          {user?.addresses && user.addresses.length > 0 ? (
            user.addresses.map((addr: IAddress) => (
              <AddressCard key={addr._id || addr._id} addr={addr} />
            ))
          ) : (
            <p className="text-sm text-gray-500 py-2">No addresses registered yet.</p>
          )}
        </div>

        {isAdding && (
          <div className="border-t border-[var(--border)] py-8 transition-all">
            <AddNewAddress isAdding={isAdding} setIsAdding={setIsAdding} />
          </div>
        )}
      </div>
    </div>
  );
}