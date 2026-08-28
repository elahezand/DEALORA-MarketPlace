import { MotionDiv } from "../../utils/providers/MotionWrapper";
import SectionHeader from "./sectionHeader";
const STEPS = [
  {
    icon: "🔍",
    title: "Search",
    desc: "Find exactly what you need with filters for city, price, and category.",
  },
  {
    icon: "💬",
    title: "Message",
    desc: "Chat directly with the seller or official store to work out the details.",
  },
  {
    icon: "🤝",
    title: "Deal",
    desc: "Meet up in person or use secure shipping from verified stores.",
  },
];

export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader
        eyebrow="Getting Started"
        title="How it works"
        subtitle="Just three steps to your first buy or sale."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STEPS.map((step, i) => (
          <MotionDiv
            key={i}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="
              relative flex flex-col items-center text-center gap-3
              p-6 rounded-[var(--radius)]
              border border-[var(--border)]
              bg-[var(--card-solid)]
            "
          >
            <span className="absolute top-3 left-4 text-[10px] font-bold text-[var(--foreground-muted)]/50 tracking-widest">
              0{i + 1}
            </span>
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950/60 text-2xl">
              {step.icon}
            </div>
            <h3 className="font-bold text-[var(--foreground)]">{step.title}</h3>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">{step.desc}</p>
          </MotionDiv>
        ))}
      </div>
    </div>
  );
}