"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/shadcnui/sidebar";
import { authClient } from "@/lib/auth-client";
import {
  BookOpen,
  LayoutDashboard,
  LogIn,
  MoonStarIcon,
  Sparkles,
  SunIcon,
  User,
  UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";

const NavItems = [
  { label: "Features", href: "/features", icon: Sparkles },
  { label: "Documentation", href: "/docs", icon: BookOpen },
  { label: "Login", href: "/auth", icon: LogIn, guestOnly: true },
  {
    label: "Register",
    href: "/auth/register",
    icon: UserPlus,
    guestOnly: true,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    authOnly: true,
  },
  { label: "Profile", href: "/profile", icon: User, authOnly: true },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors">
      <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonStarIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="truncate">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  const visibleItems = NavItems.filter((item) => {
    if (item.authOnly) return isLoggedIn;
    if (item.guestOnly) return !isLoggedIn;
    return true;
  });

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/");
                  }}
                />
              }>
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <User className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Auth App</span>
                <span className="text-muted-foreground text-xs">
                  Regix Auth
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={
                        <a
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            (router.push as any)(item.href);
                          }}
                        />
                      }>
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
