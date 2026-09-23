import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/interceptor";
import { ListingProps } from "@/types/Listings";

export const PRODUCTS_QUERY_KEY = "admin-products";

export interface ProductVariantInput {
  _id?: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  discount: number;
  stock: number;
}

export interface ProductInput {
  title: string;
  description: string;
  categoryPath: string[];
  condition: "new" | "used";
  status: "draft" | "active" | "inactive";
  shipping: { type: "standard" | "express" | "free"; cost: number };
  tags: string[];
  specs: Record<string, string>;
  images: string[];
  variants: ProductVariantInput[];
}

type SaveResponse = { success: boolean; message: string; data: ListingProps };

const errorMessage = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } })
    ?.response?.data;
  const first = data?.errors?.[0];
  return first ? `${first.field}: ${first.message}` : data?.message || fallback;
};

const toFormData = (payload: ProductInput, files: File[]) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify({ ...payload, listingType: "store_product" }));
  files.forEach((file) => formData.append("pics", file));
  return formData;
};

export const useSaveProduct = (id?: string, onSuccess?: (productId: ListingProps) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, files }: { payload: ProductInput; files: File[] }) => {
      const body = toFormData(payload, files);
      const res = id
        ? await api.put<SaveResponse>(`/listings/admin/${id}`, body)
        : await api.post<SaveResponse>("/listings/admin", body);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(id ? "Product updated" : "Product created");
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      onSuccess?.(res.data);
    },
    onError: (err) => toast.error(errorMessage(err, "Failed to save product")),
  });
};

export const useChangeProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductInput["status"] }) =>
      (await api.patch(`/listings/${id}/status`, { status })).data,
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
    },
    onError: (err) => toast.error(errorMessage(err, "Failed to update status")),
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/listings/admin/${id}`)).data,
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
    },
    onError: (err) => toast.error(errorMessage(err, "Failed to delete product")),
  });
};
