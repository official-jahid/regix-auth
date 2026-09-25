import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import { LayoutProps } from "@/lib/types";

const PublicLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header minimal />

      <div className="flex flex-1 flex-col pt-16">{children}</div>

      <Footer />
    </div>
  );
};

export default PublicLayout;
