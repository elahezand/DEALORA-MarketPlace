import QueryProvider from "../utils/providers/providers";
import { Providers } from "../utils/providers/ProvidersHeroUi";
import { Inter, Roboto, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html dir="ltr">
      <body
        className={`${inter.variable} ${roboto.variable} ${playfairDisplay.variable}`}
      >
        <Toaster
          position="top-center"
          offset="5rem"
          richColors
          style={{ zIndex: 999999, pointerEvents: "auto" }}
          toastOptions={{
            style: {
              background: "var(--card-solid, #ffffff)",
              color: "var(--foreground, #000000)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: "var(--radius, 14px)",
              fontFamily: "var(--font-sans)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              minWidth: "360px",
              maxWidth: "500px",
              padding: "16px",
              fontSize: "15px",
              pointerEvents: "auto",
            },
            actionButtonStyle: {
              backgroundColor: "var(--destructive, #ef4444)",
              color: "#ffffff",
              fontWeight: "600",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              pointerEvents: "auto",
            },
            cancelButtonStyle: {
              backgroundColor: "var(--background-soft, #f3f4f6)",
              color: "var(--foreground, #111827)",
              fontWeight: "500",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              pointerEvents: "auto",
            },
          }}
        />

        <QueryProvider>
          <Providers>{children}</Providers>
        </QueryProvider>
      </body>
    </html>
  );
}