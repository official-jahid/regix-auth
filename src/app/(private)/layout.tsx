import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";

const PrivateLayout = async ({ children }: LayoutProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Header />

      <div className="pt-16">{children}</div>

      <Footer />
    </>
  );
};

export default PrivateLayout;
