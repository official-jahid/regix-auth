"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";

const UserMenu = ({ hideRegister = false }: { hideRegister?: boolean }) => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (isPending) {
    return <span className="text-muted-foreground text-sm">Loading</span>;
  }

  if (!session) {
    if (hideRegister) {
      return (
        <Link
          href="/login"
          className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Login
        </Link>
      );
    }
    return (
      <span className="flex items-center gap-2">
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Login
        </Link>
        <Link
          href="/register"
          className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Register
        </Link>
      </span>
    );
  }

  const user = session.user;
  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        className="rounded-full">
        <Avatar>
          <AvatarImage
            src={user.image ?? undefined}
            alt={user.name ?? "User"}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.name ?? user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin</Link>
          </DropdownMenuItem>
        )}
        {user.role === "reseller" && (
          <DropdownMenuItem asChild>
            <Link href="/admin/licenses">Licenses</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}>
          {isSigningOut ? "Signing out" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
