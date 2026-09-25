import { Metadata } from "next";
import ResellerForm from "../_components/ResellerForm";

export const metadata: Metadata = {
  title: "New reseller | REGIX Studio",
  description: "Create a reseller account",
};

const NewResellerPage = () => {
  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New reseller</h1>
      <ResellerForm />
    </section>
  );
};

export default NewResellerPage;
