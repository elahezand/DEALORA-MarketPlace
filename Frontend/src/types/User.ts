import { IStore } from "./Store"
import { IPagination } from "./common";

export interface IAddress {
  _id: string;   
  name: string;
  postalCode: string;
  address: string;
  city: string;
  state: string;
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
    data: IUser[];
    pagination?: IPagination;
  
}
export type CreateAddressPayload = Omit<IAddress, "_id" | "id">;



export type UpdateAddressPayload = Partial<IAddress> & {
    id: string;
};

