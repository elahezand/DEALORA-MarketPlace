import StaticPageLayout from "@/components/shared/StaticPageLayout";

export default function TermsPage() {
  return (
    <StaticPageLayout
      title="Terms of Service"
      subtitle="These terms govern your use of the Dealora marketplace."
    >
      <p>
        By creating an account or using Dealora, you agree to the following terms.
        Please read them carefully.
      </p>

      <h2>Using the platform</h2>
      <ul>
        <li>You must provide accurate information when creating an account or a listing.</li>
        <li>Listings must comply with our content and category rules; prohibited items will be removed.</li>
        <li>You are responsible for the accuracy of your own listings and messages.</li>
      </ul>

      <h2>Orders &amp; payments</h2>
      <p>
        When you place an order through checkout, you agree to pay the listed price and
        applicable shipping costs. Sellers are responsible for fulfilling orders they accept.
      </p>

      <h2>Account suspension</h2>
      <p>
        We may suspend or ban accounts that violate these terms, post prohibited content,
        or attempt to defraud other users.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Dealora acts as a marketplace connecting buyers and sellers. We are not a party to
        transactions between users and are not liable for disputes arising from them, beyond
        the protections explicitly offered at checkout.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent through our{" "}
        <a href="/contact-us" className="text-[var(--primary-600)] font-semibold hover:underline">Contact Us</a> page.
      </p>
    </StaticPageLayout>
  );
}
