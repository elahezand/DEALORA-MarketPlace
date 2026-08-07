import StaticPageLayout from "@/components/shared/StaticPageLayout";

export default function CookiesPage() {
  return (
    <StaticPageLayout
      title="Cookies Policy"
      subtitle="How Dealora uses cookies and similar technologies."
    >
      <p>
        We use a small number of cookies to keep the marketplace working reliably and secure.
      </p>

      <h2>Essential cookies</h2>
      <p>
        These keep you signed in (access and refresh tokens) and remember basic preferences
        such as your selected theme. The platform will not function correctly without them.
      </p>

      <h2>Analytics</h2>
      <p>
        We may use anonymous usage data to understand how the marketplace is used, so we can
        keep improving it. This data is not used to identify you personally.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can control or delete cookies through your browser settings at any time. Disabling
        essential cookies will sign you out and may prevent core features (cart, messaging,
        dashboard) from working.
      </p>
    </StaticPageLayout>
  );
}
