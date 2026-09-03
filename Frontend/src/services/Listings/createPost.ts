import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

function isFileLike(value: any): value is File {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.arrayBuffer === "function"
  );
}

function toFormData(payload: Record<string, any>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;

    // Files
    if (Array.isArray(value) && value.some(isFileLike)) {
      value.forEach((file: any) => {
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
  const { mutate: rawMutate, isPending } = usePost<any, FormData>(
    "/listings",
    {
      onSuccess: () => {
        toast.success("Post Created Successfully :)");
      },

      onError: (error: any) => {
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

  const mutate = (payload: Record<string, any>) => {
    rawMutate(toFormData(payload));
  };

  return {
    mutate,
    isPending,
  };
};