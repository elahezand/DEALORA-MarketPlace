// same spinner the AuthGuard shows, so navigating between dashboard pages looks the same
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  );
}
