import type { Metadata } from "next";

// the page itself is a client component, so its metadata lives here
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Send the Dealora team a message.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
