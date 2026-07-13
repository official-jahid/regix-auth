"use client";

import { Separator } from "@/components/shadcnui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/shadcnui/sidebar";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const AppSidebar = dynamic(
  () =>
    import("@/components/app-sidebar").then((mod) => ({
      default: mod.AppSidebar,
    })),
  { ssr: false },
);

export default function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-2" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
          </header>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  );
}
