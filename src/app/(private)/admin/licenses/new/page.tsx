import { Metadata } from "next";
import { getLicenseCreateContext } from "@/server/licenses";
import LicenseForm from "../_components/LicenseForm";

export const metadata: Metadata = {
  title: "New license | REGIX Studio",
  description: "Create a software license key",
};

const NewLicensePage = async () => {
  const { isAdmin, provider, products } = await getLicenseCreateContext();

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New license</h1>
      <LicenseForm
        isAdmin={isAdmin}
        defaultProvider={provider}
        products={products}
      />
    </section>
  );
};

export default NewLicensePage;
