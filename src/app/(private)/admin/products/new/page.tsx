import { headers } from "next/headers";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ProductForm from "../_components/ProductForm";

export const metadata: Metadata = {
  title: "New product | REGIX Studio",
  description: "Create a licensed product",
};

const NewProductPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/admin/products");
  }

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New product</h1>
      <ProductForm
        defaults={{
          name: "",
          description: "",
          version: "",
          expiryDays: null,
          sortOrder: 0,
          status: "active",
        }}
      />
    </section>
  );
};

export default NewProductPage;
