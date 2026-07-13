import ParticleBackground from "@/components/ParticleBackground";
import ThemeProvider from "@/components/Providers/ThemeProvider";
import SidebarWrapper from "@/components/SidebarWrapper";
import { geistMono, geistSans, orbitron, spaceGrotesk } from "@/lib/fonts";
import { ReactNode } from "react";
import "./globals.css";

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${spaceGrotesk.variable} antialiased`}
      suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ParticleBackground />
        <ThemeProvider
          attribute={"class"}
          defaultTheme="dark"
          enableSystem={false}>
          <SidebarWrapper>{children}</SidebarWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
