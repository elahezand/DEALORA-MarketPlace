import Link from "next/link";
import { getListingPrice } from "@/utils/price";
import { getUrl } from "@/utils/helper";

interface Product {
  _id: string;
  title: string;
  slug?: string;
  listingType?: "user_ad" | "store_product";
  minPrice?: number | null;
  images?: string[];
  condition?: string;
}

export default function ProductsGrid({ data }: { data: Product[] }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--foreground-muted)] py-16">
        This store hasn't listed any products yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full">
      {data.map((product) => (
        <Link
          key={product._id}
          href={`/posts/${product._id}`}
          className="
        group flex flex-col gap-2
        rounded-[var(--radius)]
        border border-[var(--border)]
        bg-[var(--card-solid)]
        overflow-hidden
        hover:shadow-md
        transition-all duration-200
      "
        >
          <div className="w-full aspect-square bg-[var(--background-soft)] overflow-hidden">
            {product.images?.[0] ? (
              <img loading="lazy" decoding="async"
                src={getUrl(product.images[0])||""}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : null}
          </div>

          <div className="p-3">
            <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-1">
              {product.title}
            </h3>

            {typeof product.minPrice === "number" && (
              <p className="text-sm font-black text-primary-600 dark:text-primary-400 mt-1">
                From $
                {getListingPrice({
                  listingType: "store_product",
                  ...product,
                }).toLocaleString()}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}