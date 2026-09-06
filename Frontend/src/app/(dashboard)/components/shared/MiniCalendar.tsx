"use client";

import { useMemo, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MiniCalendarProps {
  compact?: boolean;
  className?: string;
}

export default function MiniCalendar({ compact = false, className = "" }: MiniCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function goPrev() {
    setCursor(new Date(year, month - 1, 1));
  }
  function goNext() {
    setCursor(new Date(year, month + 1, 1));
  }
  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className={`card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] ${compact ? "p-4" : "p-5"} ${className}`}>
      <div className={`flex items-center justify-between ${compact ? "mb-3" : "mb-4"}`}>
        <h3 className={`font-bold text-[var(--foreground)] ${compact ? "text-xs" : "text-sm"}`}>
          {MONTHS[month]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className={`flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors ${compact ? "w-6 h-6" : "w-7 h-7"}`}
          >
            <HiChevronLeft className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </button>
          {!compact && (
            <button
              type="button"
              onClick={goToday}
              className="text-[14px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg text-[var(--primary-600)] dark:text-[var(--accent-400)] hover:bg-[var(--primary-500)]/10 transition-colors"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className={`flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors ${compact ? "w-6 h-6" : "w-7 h-7"}`}
          >
            <HiChevronRight className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-7 mb-1 ${compact ? "gap-0.5" : "gap-1"}`}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className={`text-center font-bold uppercase tracking-wider text-[var(--foreground-subtle)] ${compact ? "text-[9px] py-0.5" : "text-[10px] py-1"}`}
          >
            {compact ? d.slice(0, 1) : d}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${compact ? "gap-1.5" : "gap-1"}`}>
        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <div
              key={day}
              className={`flex items-center justify-center rounded-lg font-semibold transition-colors ${compact ? "h-7 text-xs" : "aspect-square text-xs"} ${
                isToday(day)
                  ? "bg-[var(--primary-600)] dark:bg-[var(--accent-500)] text-white"
                  : "text-[var(--foreground)] hover:bg-[var(--background-soft)]"
              }`}
            >
              {day}
            </div>
          )
        )}
      </div>
    </div>
  );
}