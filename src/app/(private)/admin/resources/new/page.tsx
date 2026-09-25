import { Metadata } from "next";
import ResourceForm from "../_components/ResourceForm";

export const metadata: Metadata = {
  title: "New resource | REGIX Studio",
  description: "Create a member resource",
};

const NewResourcePage = () => {
  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New resource</h1>
      <ResourceForm />
    </section>
  );
};

export default NewResourcePage;
