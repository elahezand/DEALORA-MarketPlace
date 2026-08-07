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

export interface StoresResponse {
    data: {
        success: boolean;
        data: IStore[];
        pagination?: any;
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
    meta?: any;
    createdAt: string;
    updatedAt: string;
    listings?: any[];
    orders?: any[];
    reviews?: any[];
}

export interface UserType {
    user: IUser;
}

