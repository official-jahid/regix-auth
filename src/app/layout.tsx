import { AppSidebar } from "@/components/Navigation/AppSidebar";
import ThemeProvider from "@/components/Providers/ThemeProvider";
import ToastProvider from "@/components/Providers/ToastProvider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/shadcnui/sidebar";
import { notoSansHeading, nunitoSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import "./globals.css";

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        "font-sans",
        nunitoSans.variable,
        notoSansHeading.variable,
      )}
      suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute={"class"}
          defaultTheme="dark"
          enableSystem={false}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="bg-background/80 sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4 backdrop-blur-sm">
                <SidebarTrigger className="-ml-2" />
                <span className="text-sm font-semibold">Regix Auth</span>
              </header>
              <main className="flex-1">{children}</main>
            </SidebarInset>
          </SidebarProvider>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
