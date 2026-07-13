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
  ArrowLeft,
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

const THEMES = [
  { name: "dark", label: "Dark", icon: MoonStarIcon },
  { name: "light", label: "Light", icon: SunIcon },
  { name: "midnight", label: "Midnight", icon: MoonStarIcon },
  { name: "crimson", label: "Crimson", icon: SunIcon },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-muted-foreground px-2 text-[10px] font-medium tracking-wider uppercase">
        Theme
      </span>
      <div className="flex flex-wrap gap-1 px-1">
        {THEMES.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => setTheme(t.name)}
              className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                isActive ?
                  "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground"
              }`}>
              <Icon
                className={`size-3 ${isActive ? "text-primary" : ""} ${
                  t.name === "dark" ? "rotate-0"
                  : t.name === "light" ? "scale-100"
                  : ""
                }`}
              />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
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

  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

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
        {/* Back button */}
        {canGoBack && pathname !== "/" && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          router.back();
                        }}
                      />
                    }>
                    <ArrowLeft className="size-4" />
                    <span>Back</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation items */}
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
                            router.push(item.href as any);
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
