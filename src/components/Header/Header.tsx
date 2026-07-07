"use client";

import { BookOpenIcon, LayoutDashboardIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggleButton from "../Buttons/ThemeToggleButton";
import { Button } from "../shadcnui/button";

const Header = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setAuthenticated(data.authenticated);
          setIsAdmin(data.user?.role === "ADMIN");
        }
      } catch {
        setAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/auth");
  };

  return (
    <header
      className="bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-sm"
      aria-label="app-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href={"/"}>
          <h1
            className="text-2xl font-semibold"
            aria-label="App Name">
            REGIX AUTH
          </h1>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href={"/"}
            className="hover:text-primary text-sm">
            Home
          </Link>
          <Link
            href={"/docs"}
            className="hover:text-primary flex items-center gap-1 text-sm">
            <BookOpenIcon className="h-3.5 w-3.5" /> Docs
          </Link>
          {authenticated ?
            <>
              <Link
                href={"/dashboard"}
                className="hover:text-primary flex items-center gap-1 text-sm">
                <LayoutDashboardIcon className="h-4 w-4" /> Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href={"/dashboard/admin"}
                  className="hover:text-primary flex items-center gap-1 text-sm">
                  Admin
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}>
                <LogOutIcon className="mr-1 h-4 w-4" /> Logout
              </Button>
            </>
          : <>
              <Link
                href={"/auth"}
                className="hover:text-primary text-sm">
                Login
              </Link>
              <Link
                href={"/auth/register"}
                className="hover:text-primary text-sm">
                Register
              </Link>
            </>
          }
          <ThemeToggleButton />
        </nav>
      </div>
    </header>
  );
};

export default Header;
