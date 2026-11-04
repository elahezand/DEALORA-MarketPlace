import ListingSkeleton from "@/components/posts/listingDetail/ListingSkeleton";

export default function ListingLoading() {
  return (
    <div className="max-w-7xl w-full p-4 md:p-6 mx-auto">
      <ListingSkeleton />
    </div>
  );
}
