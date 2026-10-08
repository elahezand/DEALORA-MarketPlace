/**
 * The admin overview must reflect what the admin just did (approved an offer, verified a store...).
 * The app-wide default keeps data 5 minutes, which left these widgets stale after every action.
 */
export const ADMIN_FRESH = {
  staleTime: 15 * 1000,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: true,
};
