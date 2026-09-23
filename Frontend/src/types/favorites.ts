import { IPagination } from "./common";

export default interface FavoritesTypeResponse {
    success: boolean;
    data: {
      _id: string;
      productId: {
        _id: string;
        title: string;
        slug?: string;
        listingType?: "user_ad" | "store_product";
        /** only for user_ad */
        price?: number;
        /** server-computed display price (both types) */
        minPrice?: number | null;
        images?: string[];
        status: string;
        shortIdentifier?: string;
        condition?: string;
        metrics?: { views?: number; sold?: number };
      };
      productType: "user_ad" | "store_product";
    }[];
    pagination?: IPagination;
  
}


