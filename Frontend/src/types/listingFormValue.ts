export interface FormValues {
    snapshot: {
        title: string;
        description: string;
        images: string[];
        specs: Record<string, any>;
        categoryPath: string[];
    };
    location: {
        state: string;
        city: string;
    };
    price: number;
    shipping: {
        type: "standard" | "express";
        cost: number;
    };
    condition: "new" | "used";
}