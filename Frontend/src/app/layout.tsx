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
          position="bottom-right"
          richColors
          style={{ zIndex: 10000, pointerEvents: "auto" }}
          toastOptions={{
            style: {
              borderRadius: "var(--radius, 14px)",
              fontFamily: "var(--font-sans)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              width: "clamp(280px, 90vw, 420px)",
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