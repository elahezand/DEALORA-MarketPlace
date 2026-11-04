import type { Metadata } from "next";

// the page itself is a client component, so its metadata lives here
export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers to common questions about buying, selling and payments on Dealora.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
