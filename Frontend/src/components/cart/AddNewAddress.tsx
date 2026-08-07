"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Input } from "@heroui/react";
import { useCreateAddress } from '@/services/Address/CreateAddress';
import { IAddress } from '@/types/User';
import { useUpdateAddress } from '@/services/Address/UpdateAddress';

const addressSchema = z.object({
    name: z.string().min(1),
    postalCode: z.string().min(4).max(20),
    location: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
    address: z.string().min(5),
    state: z.string().min(1),
    city: z.string().min(1).transform(s => String(s).toLowerCase()),
})
type AddressFormValues = z.infer<typeof addressSchema>;


interface AddNewAddressProps {
    isAdding: boolean;
    setIsAdding: (open: boolean) => void;
    editingAddress?: IAddress | null;
}

export default function AddNewAddress({
    isAdding,
    setIsAdding,
    editingAddress,
}: AddNewAddressProps) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            location: {
                lat: 0,
                lng: 0,
            },
        },
    });

    useEffect(() => {
        if (editingAddress) {
            reset({
                name: editingAddress.name,
                address: editingAddress.address,
                city: editingAddress.city,
                state: editingAddress.state,
                postalCode: editingAddress.postalCode,
                location: editingAddress.location ?? {
                    lat: 0,
                    lng: 0,
                },
            });
        } else {
            reset({
                name: "",
                address: "",
                city: "",
                state: "",
                postalCode: "",
                location: {
                    lat: 0,
                    lng: 0,
                },
            });
        }
    }, [editingAddress, reset]);

    const { mutate: updateAddress, isPending: updating } = useUpdateAddress();
    const { mutate: createAddress, isPending } = useCreateAddress();

    const onSubmit = (data: AddressFormValues) => {
        if (editingAddress) {
            updateAddress(
                {
                    id: editingAddress._id!,
                    ...data,
                },
                {
                    onSuccess: () => {
                        setIsAdding(false);
                        reset();
                    },
                }
            );
            return;
        }

        createAddress(data, {
            onSuccess: () => {
                setIsAdding(false);
                reset();
            },
        });
    };

    if (!isAdding) return null;
 
    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="card p-6 space-y-6 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-bold tracking-tight">
                {editingAddress ? "Edit Address" : "Add New Address"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider">Label</label>
                    <Input size="sm" placeholder="e.g. Home" {...register("name")} isInvalid={!!errors.name} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider">City</label>
                    <Input size="sm" placeholder="Tehran" {...register("city")} isInvalid={!!errors.city} />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider">Street Address</label>
                    <Input size="sm" placeholder="Main St, No 123" {...register("address")} isInvalid={!!errors.address} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider">State</label>
                    <Input size="sm" placeholder="Tehran" {...register("state")} isInvalid={!!errors.state} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider">Postal Code</label>
                    <Input size="sm" placeholder="1234567890" {...register("postalCode")} isInvalid={!!errors.postalCode} />
                </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Button
                    type="submit"
                    size="sm"
                    className="btn-primary"
                    isLoading={isPending || updating}
                >
                    {editingAddress ? "Update" : "Save"}
                </Button>
                <Button
                    size="sm"
                    variant="flat"
                    onPress={() => {
                        reset();
                        setIsAdding(false);
                    }}
                    className="btn-secondary"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}