"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, type MouseEvent } from "react";
import { RiComputerFill, RiSunLine } from "react-icons/ri";
import { IoMoon } from "react-icons/io5";

type ThemeName = "light" | "dark" | "system";

const OPTIONS: { value: ThemeName; label: string }[] = [
  { value: "light", label: "Light theme" },
  { value: "dark", label: "Dark theme" },
  { value: "system", label: "System theme" },
];

const NEXT: Record<ThemeName, ThemeName> = { light: "dark", dark: "system", system: "light" };

function ThemeIcon({ theme, className }: { theme: ThemeName; className: string }) {
  if (theme === "light") return <RiSunLine className={`${className} text-amber-500`} aria-hidden />;
  if (theme === "dark") return <IoMoon className={`${className} text-indigo-400`} aria-hidden />;
  return <RiComputerFill className={`${className} text-blue-500`} aria-hidden />;
}

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const current = (theme as ThemeName) || "system";

  // circular reveal from the click point, where the browser supports it
  const applyTheme = (next: ThemeName, e: MouseEvent<HTMLButtonElement>) => {
    if (!document.startViewTransition) {
      setTheme(next);
      return;
    }
    const root = document.documentElement;
    root.style.setProperty("--x", `${e.clientX}px`);
    root.style.setProperty("--y", `${e.clientY}px`);
    document.startViewTransition(() => setTheme(next));
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={(e) => applyTheme(NEXT[current], e)}
        aria-label={`Theme: ${current}. Switch to ${NEXT[current]}`}
        title={`Switch to ${NEXT[current]} theme`}
        className="p-2 rounded-full border transition-all cursor-pointer duration-300 border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-lg hover:scale-110"
      >
        <ThemeIcon theme={current} className="w-6 h-6" />
      </button>

      <div
        role="group"
        aria-label="Choose a theme"
        className="absolute z-[999999] left-1/2 -translate-x-1/2 mt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-300 flex space-x-2 bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={(e) => applyTheme(option.value, e)}
            aria-label={option.label}
            aria-pressed={current === option.value}
            title={option.label}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 ${current === option.value ? "bg-gray-100 dark:bg-neutral-700" : ""
              }`}
          >
            <ThemeIcon theme={option.value} className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
}
