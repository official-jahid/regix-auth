"use client";

import ThemeToggleButton from "@/components/Buttons/ThemeToggleButton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/shadcnui/sidebar";
import {
  BellIcon,
  BookOpenIcon,
  GlobeIcon,
  HomeIcon,
  KeyIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setAuthenticated(data.authenticated);
          setIsAdmin(data.user?.role === "ADMIN");
          setUsername(data.user?.username || "");

          if (data.authenticated) {
            const notificationsRes = await fetch("/api/notifications");
            if (notificationsRes.ok) {
              const notificationsData = await notificationsRes.json();
              setUnreadCount(notificationsData.unreadCount || 0);
            }
          }
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

  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent cursor-pointer"
              onClick={() => router.push("/")}>
              <div className="bg-primary flex aspect-square size-8 items-center justify-center rounded-lg text-white">
                <ShieldIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Regix Auth</span>
                {authenticated && username && (
                  <span className="text-muted-foreground text-xs">
                    @{username}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive("/")}
                  onClick={() => router.push("/")}>
                  <HomeIcon />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {authenticated && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/dashboard")}
                      onClick={() => router.push("/dashboard")}>
                      <LayoutDashboardIcon />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/chat")}
                      onClick={() => router.push("/chat")}>
                      <MessageSquareIcon />
                      <span>Messages</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/profile")}
                      onClick={() => router.push("/profile")}>
                      <UserIcon />
                      <span>Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/notifications")}
                      onClick={() => router.push("/notifications")}>
                      <BellIcon />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-primary ml-auto rounded-full px-2 py-0.5 text-[10px] text-white">
                          {unreadCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/docs")}
                      onClick={() => router.push("/docs")}>
                      <BookOpenIcon />
                      <span>API Docs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive("/docs-bn")}
                      onClick={() => router.push("/docs-bn")}>
                      <GlobeIcon />
                      <span>বাংলা ডক্স</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive("/dashboard/admin")}
                        onClick={() => router.push("/dashboard/admin")}>
                        <KeyIcon />
                        <span>Admin Panel</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!authenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive("/auth")}
                    onClick={() => router.push("/auth")}>
                    Login
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive("/auth/register")}
                    onClick={() => router.push("/auth/register")}>
                    Register
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center">
            <ThemeToggleButton />
          </SidebarMenuItem>
          {authenticated && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
