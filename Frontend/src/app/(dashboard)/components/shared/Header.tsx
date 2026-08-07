"use client";

import { useRef, useEffect } from "react";
import { ThemeSwitcher } from "@/context/ThemeSwitcher";
import { HiOutlineBellAlert } from "react-icons/hi2";
import { IUser } from "@/types/User";
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarLeftExpandFilled,
} from "react-icons/tb";

interface AppHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  user?: IUser | null}

export function AppHeader({ isOpen, onToggle, user }: AppHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = user?.username
    ? user.username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 w-full h-16 flex items-center bg-[var(--card)] border-b border-[var(--border-strong)] backdrop-blur-md">
      <div className="flex w-full items-center justify-between px-4 md:px-6 gap-4">

        {/* Left: toggle + search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggle}
            aria-label="Toggle Sidebar"
            className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--background-soft)] hover:bg-[var(--border)] text-[var(--foreground)] transition-all duration-200"
          >
            {isOpen
              ? <TbLayoutSidebarLeftCollapseFilled size={20} />
              : <TbLayoutSidebarLeftExpandFilled size={20} />
            }
          </button>

          <div className="relative w-full hidden sm:block">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search listings, orders..."
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 h-5 rounded border border-[var(--border-strong)] bg-[var(--card-solid)] text-[10px] font-black text-[var(--foreground-subtle)] select-none pointer-events-none">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right: bell + theme + user */}
        <div className="flex items-center gap-2">

          <button className="relative w-10 h-10 flex items-center justify-center rounded-[var(--radius)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors">
            <HiOutlineBellAlert size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--destructive)] ring-2 ring-[var(--card)] animate-pulse" />
          </button>

          <div className="h-5 w-px bg-[var(--border-strong)]" />

          <ThemeSwitcher />

          <div className="h-5 w-px bg-[var(--border-strong)]" />

          {user && (
            <div className="user-chip cursor-pointer">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--gradient)] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
                  {user.username}
                </span>
                <span className="text-[11px] text-[var(--foreground-subtle)] whitespace-nowrap">
                  {user.phone}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}