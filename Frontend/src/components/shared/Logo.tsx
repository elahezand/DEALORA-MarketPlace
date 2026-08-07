// components/global/Logo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}
 export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-1 select-none mr-24 ${className}`}>
      <div className="shrink-0 w-full h-full"> 
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 40 40"
          fill="none"
          color=' hsl(222 60% 35%)'
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          <path d="M8 12V8C8 6.89543 8.89543 6 10 6H30C31.1046 6 32 6.89543 32 8V32C32 33.1046 31.1046 34 30 34H10C8.89543 34 8 33.1046 8 32V28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 26L26 14" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="26" cy="26" r="3" fill="#ef4444" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center whitespace-nowrap">
          <span className="font-sans font-black text-xl tracking-tight text-[var(--primary-600)] leading-none">
            DEAL<span className="text-[var(--destructive)] font-medium">ORA</span>
          </span>
          <span className="text-[8px] font-bold tracking-[0.25em] text-slate-400 uppercase mt-1">
            MARKETPLACE
          </span>
        </div>
      )}
    </div>
  );
}

