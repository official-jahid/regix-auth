import { SidebarProvider } from "@/components/shadcnui/sidebar";
import { Metadata } from "next";
import { Suspense } from "react";
import DocsContent from "./DocsContent";

export const metadata: Metadata = {
  title: "Documentation | Regix Auth",
  description:
    "Comprehensive documentation for Regix Auth — multi-language, multi-programming language API reference.",
};

function DocsContentFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground animate-pulse">
        Loading documentation...
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <SidebarProvider defaultOpen={true}>
      <Suspense fallback={<DocsContentFallback />}>
        <DocsContent />
      </Suspense>
    </SidebarProvider>
  );
}
