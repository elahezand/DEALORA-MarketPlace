interface UnderlineWordProps {
  children: React.ReactNode;
  className?: string;
}

export default function UnderlineWord({ children, className = "" }: UnderlineWordProps) {
  return (
    <span className={`relative inline-block px-1 ${className}`}>
      {children}
      <svg
        className="absolute left-0 -bottom-1 w-full h-[0.35em]"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M2 8.5C15 6 30 5 50 6C70 7 85 5.5 98 7.5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </span>
  );
}