import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ListingProps } from "@/types/Listings";

function isFileLike(value: unknown): value is File {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as File).name === "string" &&
    typeof (value as File).size === "number" &&
    typeof (value as File).arrayBuffer === "function"
  );
}

function toFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;

    // Files
    if (Array.isArray(value) && value.some(isFileLike)) {
      value.forEach((file: unknown) => {
        if (isFileLike(file)) {
          formData.append("pics", file);
        }
      });
      continue;
    }

    if (isFileLike(value)) {
      formData.append("pics", value);
      continue;
    }

    // Arrays
    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(
          `${key}[]`,
          typeof item === "object"
            ? JSON.stringify(item)
            : String(item)
        );
      });
      continue;
    }

    // Objects
    if (typeof value === "object") {
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue === undefined || subValue === null) continue;

        formData.append(
          `${key}[${subKey}]`,
          typeof subValue === "object"
            ? JSON.stringify(subValue)
            : String(subValue)
        );
      }

      continue;
    }

    // Primitive values
    formData.append(key, String(value));
  }

  return formData;
}

export const useCreatePost = () => {
  const { mutate: rawMutate, isPending } = usePost<{ message: string; data: ListingProps }, FormData>(
    "/listings",
    {
      onSuccess: () => {
        toast.success("Post Created Successfully :)");
      },

      onError: (error) => {
        console.log(
          "VALIDATION ERRORS:",
          error?.response?.data?.errors
        );

        toast.error(
          error?.response?.data?.message || "Unknown Error"
        );
      },
    }
  );

  const mutate = (payload: Record<string, unknown>) => {
    rawMutate(toFormData(payload));
  };

  return {
    mutate,
    isPending,
  };
};