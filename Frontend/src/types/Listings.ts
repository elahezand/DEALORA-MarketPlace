export interface CategoryPathItem {
  _id: string;
  title: string;
  slug: string;
}

export interface ListingVariant {
  _id: string;
  attributes: Record<string, string>;
  sku: string;
  price?: number;
  stock: number;
}

export interface ListingProps {
  _id: string;
  listingType: "user_ad" | "store_product";
  user?: {
    _id: string;
    name: string;
    phone: string
  };
  store?: {
    _id: string;
    name: string;
  };

  title: string;
  slug?: string;
  description: string;
  images: string[];

  categoryPath: CategoryPathItem[];

  specs?: Record<string, string>;
  tags?: string[];

  price: number;
  condition: "new" | "used";

  status: "pending" | "accepted" | "rejected" | "deleted" | "active" | "inactive" | "draft";

  shipping: {
    type: "standard" | "express" | "free";
    cost: number;
  };

  location?: {
    state: string;
    city: string;
    lat?: number;
    lng?: number;
  };

  variants?: ListingVariant[];

  metrics: {
    views: number;
    sold?: number;
  };

  shortIdentifier?: string;
  createdAt: string;
  updatedAt: string;
  offers: any
}

export interface ListingTypeResponse {
  data: ListingProps;
}

export default interface ListingsTypeResponse{
  success: boolean;
  data: {
    data: ListingProps[];
    pagination?: {
      hasMore: boolean;
      limit: number;
      nextCursor: string | null;
    };
  };
}
export interface InfiniteListingsSectionProps {
    initialData: ListingProps[];
    initialPagination: any;
    selectedFilter: string;
    setSelectedFilter: (id: string) => void;
}


export interface SmartSearchItem {
  _id: string;
  type: "post";
  title: string;
  image: string;
  searchableText: string;
  route: string;
  metadata: {
    price: number;
    categoryPath: string[];
    condition: "new" | "used";
    status: "pending" | "accepted" | "rejected" | "deleted" | "active" | "inactive" | "draft";
    shippingType: "standard" | "express" | "free";
    createdAt: string;
  };
}

export const convertToSmartSearchItems = (posts: ListingProps[]): SmartSearchItem[] => {
  return posts.map((post) => {
    const parts = [
      post.title,
      post.condition,
      post.status,
      post.shipping.type,
    ].filter(Boolean);

    return {
      _id: post._id,
      type: "post",
      title: post.title,
      image: post.images?.[0] || "",
      searchableText: parts.join(" "),
      route: `/listings/${post._id}`,
      metadata: {
        price: post.price,
        categoryPath: post.categoryPath.map((c) => c.title),
        condition: post.condition,
        status: post.status,
        shippingType: post.shipping.type,
        createdAt: post.createdAt,
      },
    };
  });
};