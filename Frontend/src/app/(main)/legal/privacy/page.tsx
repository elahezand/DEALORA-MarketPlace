import StaticPageLayout from "@/components/shared/StaticPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      subtitle="Last updated: 2026. This page explains what information we collect and how we use it."
    >
      <p>
        Dealora ("we", "our", "us") respects your privacy. This policy describes what
        personal data we collect when you use our marketplace, why we collect it, and
        the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account details you provide, such as your phone number, name, and email address.</li>
        <li>Listings, messages, and reports you create while using the platform.</li>
        <li>Basic usage data (pages visited, actions taken) used to keep the service reliable and secure.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To operate your account, listings, cart, and orders.</li>
        <li>To connect buyers and sellers through messaging.</li>
        <li>To detect fraud, abuse, and violations of our listing rules.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell your personal data. Information is shared only with the other
        party of a transaction (for example, a seller you contact) or where required by law.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update or delete your account details from your dashboard settings at any
        time, or contact us via the <a href="/contact-us" className="text-[var(--primary-600)] font-semibold hover:underline">Contact Us</a> page for any request regarding your data.
      </p>
    </StaticPageLayout>
  );
}
