import { MotionDiv } from "../../utils/providers/MotionWrapper";
export default function AppDownloadBanner() {
  return (
    <MotionDiv
      initial={{ y: 15, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="
        rounded-2xl border border-[var(--border)]
        bg-[var(--card-solid)]
        p-8 sm:p-10
        flex flex-col md:flex-row items-center justify-between gap-8
      "
    >
      <div className="flex flex-col gap-2 text-center md:text-left max-w-md">
        <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Get our app</h3>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          Search faster, get instant notifications for messages, and manage your listings from anywhere.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--foreground-muted)] text-center">
          QR Code
        </div>
        <div className="flex flex-col gap-2">
          <a
            href="#"
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[var(--foreground)] text-[var(--background)] text-center"
          >
            Download on App Store
          </a>
          <a
            href="#"
            className="px-5 py-2.5 rounded-lg text-xs font-bold border border-[var(--border)] text-[var(--foreground)] text-center"
          >
            Get it on Google Play
          </a>
        </div>
      </div>
    </MotionDiv>
  );
}