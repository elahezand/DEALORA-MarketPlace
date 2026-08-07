import StaticPageLayout from "@/components/shared/StaticPageLayout";

export default function CareersPage() {
  return (
    <StaticPageLayout
      title="Careers at Dealora"
      subtitle="We're building the easiest way to buy and sell locally — and we're always glad to hear from people who want to help."
    >
      <p>
        We don't have open positions listed right now, but we're happy to keep good people
        in mind for future roles across engineering, operations, and support.
      </p>

      <h2>Get in touch</h2>
      <p>
        If you'd like to introduce yourself, send us a message (with a link to your resume or
        portfolio) through our{" "}
        <a href="/contact-us" className="text-[var(--primary-600)] font-semibold hover:underline">
          Contact Us
        </a>{" "}
        page and mention the role you're interested in.
      </p>
    </StaticPageLayout>
  );
}
