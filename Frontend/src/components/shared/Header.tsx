"use client";
import React, { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import AuthRequiredListener from "./AuthRequiredListener";
import UserMenu from "./UserMenu";
import AdminNoteModal from "./AdminNoteModal";
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import dynamic from "next/dynamic";
import CartIcon from "./CartIcon";
import NotificationsBell from "@/components/dashboard/shared/NotificationsBell";
import { HiOutlineUser, HiOutlineBellAlert } from "react-icons/hi2";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/services/interceptor";
import clsx from "clsx";
import Link from "next/link";
import { ThemeSwitcher } from "@/context/ThemeSwitcher";
import { toast } from "sonner";
import { IoLocationSharp } from "react-icons/io5";
import Logo from "./Logo";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useGetProfile } from "@/services/Profile/useGetProfile";
import { useQueryClient } from "@tanstack/react-query";

const AuthModal = dynamic(() => import("../modals/AuthModal"), { ssr: false });
const LocationsModal = dynamic(() => import("../modals/locations"), { ssr: false });

type NavItem = { label: string; href: string };

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useGetProfile();


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationsModalOpen, setIsLocationsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isAdmin = !!user?.role?.includes("ADMIN");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Listings", href: "/posts" },
      { label: "Stores", href: "/stores" },
      { label: "Post an Ad", href: "/posts/new" },
      { label: "Support", href: "/supports" },
      { label: "About", href: "/about" },
      { label: "Contact US", href: "/contact-us" },

    ],
    []
  );


  const isActive = useCallback(
    (href: string) => {
      const base = href.split("?")[0];
      if (base === "/") return pathname === "/";
      return pathname === base || pathname.startsWith(base + "/");
    },
    [pathname]
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAuthModal = useCallback(() => setIsAuthOpen(true), []);

  const handleLogout = useCallback(() => {
    startTransition(() => {
      void (async () => {
        try {
          // skipRefresh: logout works with the refresh cookie alone, no need to refresh first
          await api.post("/auth/logout", {}, { withCredentials: true, skipRefresh: true });
          queryClient.setQueryData(["/auth/me", undefined], null);

          toast.success("Logged out successfully");
          setIsMenuOpen(false);
          router.replace("/");
        } catch {
          toast.error("An error occurred during logout");
        }
      })();
    });
  }, [router, queryClient]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full">
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="xl"
        className={clsx(
          // only paint properties animate; animating height/margin/max-width on every
          // scroll-state change caused layout work and showed up as non-composited animation
          "transition-[background-color,box-shadow,border-color] duration-300 ease-out",
          isScrolled
            ? "glass-navbar h-18 max-w-[calc(100%-2rem)] mx-auto mt-4"
            : "bg-transparent h-20"
        )}
        classNames={{
          wrapper: "px-6 gap-4 h-full",
        }}
      >
        {/* BRAND & LOCATION */}
        <NavbarContent justify="start" className="gap-6">
          <NavbarBrand
            as={Link}
            href="/"
            className="flex-grow-0 transition-transform active:scale-95"
          >
            <Logo showText={true} className="w-[50px] h-[50px] object-contain" />
          </NavbarBrand>
          <NavbarItem className="hidden md:flex">
            <button
              onClick={() => setIsLocationsModalOpen(true)}
              className="location-btn hover:text-[var(--primary-400)] transition-colors duration-200"
            >
              <IoLocationSharp className="text-[var(--primary-400)] text-2xl" />
              <span>Location</span>
            </button>
          </NavbarItem>
        </NavbarContent>

        {/* DESKTOP NAVIGATION */}
        <NavbarContent className="hidden lg:flex gap-1" justify="center">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isPostAd = item.label === "Post an Ad";

            return (
              <NavbarItem key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "nav-link",
                    active && !isPostAd && "nav-link-active",
                    isPostAd && "nav-link-accent"
                  )}
                >
                  {item.label}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        {/* MOBILE TOGGLE */}
        <NavbarContent className="lg:hidden flex-grow-0" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="text-[var(--foreground)]"
            icon={
              isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )
            }
          />
        </NavbarContent>

        {/* ACTIONS */}
        <NavbarContent justify="end" className="gap-4">
          <NavbarItem className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
            <CartIcon />
          </NavbarItem>
          {user && (
            <NavbarItem>
              <NotificationsBell />
            </NavbarItem>
          )}
          {isAdmin && (
            <NavbarItem>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(true)}
                title="New notification"
                className="relative w-10 h-10 flex items-center justify-center rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <HiOutlineBellAlert size={20} />
              </button>
            </NavbarItem>
          )}
          <ThemeSwitcher />
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <NavbarItem>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="btn-primary !h-10 flex items-center gap-2">
                <HiOutlineUser className="text-base" />
                <span>Sign In</span>
              </button>
            </NavbarItem>
          )}
        </NavbarContent>

        {/* MOBILE MENU */}
        <NavbarMenu className="mobile-menu pt-6 px-6 shadow-2xl z-[9999] fixed top-20 left-0 right-0">
          <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-2">
              <span className="menu-section-title px-3">
                Navigation
              </span>

              {navItems.map((item) => {
                const isPostAd = item.label === "Post an Ad";

                return (
                  <NavbarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={clsx(
                        "nav-link block w-full",
                        isActive(item.href) && !isPostAd && "nav-link-active",
                        isPostAd && "nav-link-accent"
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavbarMenuItem>
                );
              })}
            </div>

            <div className="divider my-2" />

            <div className="flex flex-col gap-2">
              <span className="menu-section-title px-3">
                Quick Control
              </span>

              <NavbarMenuItem>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLocationsModalOpen(true);
                  }}
                  className="nav-link flex items-center gap-3 w-full text-left"
                >
                  <IoLocationSharp className="text-[var(--primary-400)] text-lg" />
                  <span>Change Location</span>
                </button>
              </NavbarMenuItem>
            </div>
          </div>
        </NavbarMenu>
      </Navbar>
      <AuthModal isOpen={isAuthOpen} setIsOpen={setIsAuthOpen} />
      <Suspense fallback={null}>
        <AuthRequiredListener onAuthRequired={openAuthModal} />
      </Suspense>
      <LocationsModal isOpen={isLocationsModalOpen} setIsOpen={setIsLocationsModalOpen} />

      {isAdmin && (
        <AdminNoteModal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} userId={user?._id} />
      )}
    </div>
  );
}