"use client";

/* last fallback: an error in the root layout itself (error.tsx can't catch that one) */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 22 }}>Something went wrong</h1>
          <p style={{ color: "#64748b" }}>Dealora couldn&apos;t load. Please try again.</p>
          <button type="button" onClick={reset} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 10, border: "1px solid #cbd5e1", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
