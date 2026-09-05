import { IPagination } from "./common";

export interface IStoreAddress {
    province?: string | null;
    city?: string | null;
    street?: string | null;
    postalCode?: string | null;
    coordinates?: {
        lat?: number | null;
        lng?: number | null;
    };
}

export interface IStore {
    _id: string;
    owner: string;
    name: string;
    slug?: string;
    logo?: string | null;
    address?: IStoreAddress;
    phone?: string | null;
    isVerified?: boolean;
    meta?: {
        ratings?: number;
        reviewsCount?: number;
    };
}

export interface StoreResponse {
    data: {
        success: boolean;
        data: IStore;
    };
}

export interface AdminStoreRow extends Omit<IStore, "owner"> {
    owner: { _id: string; username?: string; phone?: string } | string;
}

export interface AdminStoresResponse {
    stores: {
        data: AdminStoreRow[];
        pagination?: {
            hasMore: boolean;
            limit: number;
            nextCursor: string | null;
        };
    };
}

export interface StoresResponse {
    data: {
        success: boolean;
        data: IStore[];
        pagination?: IPagination;
    };
}
export interface IAddress {
    _id?: string;
    name: string;
    postalCode: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
    state: string;
    city: string;
}

export interface IUser {
    _id: string;
    username?: string;
    phone: string;
    email?: string;
    role: ("USER" | "ADMIN" | "SELLER")[];
    store?: IStore | null;
    addresses: IAddress[];
    profilePicture?: string | null;
    favorites: string[];
    refreshToken?: string;
    meta?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    listings?: unknown[];
    orders?: unknown[];
    reviews?: unknown[];
}

export interface UserType {
    user: IUser;
}

export interface AdminUsersResponse {
    users: {
        data: IUser[];
        pagination?: {
            hasMore: boolean;
            limit: number;
            nextCursor: string | null;
        };
    };
}

