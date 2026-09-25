import { headers } from "next/headers";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProduct } from "@/server/products";
import ProductForm from "../../_components/ProductForm";

export const metadata: Metadata = {
  title: "Edit product | REGIX Studio",
  description: "Edit a licensed product",
};

const EditProductPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/admin/products");
  }

  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">Edit product</h1>
      <ProductForm
        productId={product.id}
        defaults={{
          name: product.name,
          description: product.description ?? "",
          version: product.version ?? "",
          expiryDays: product.expiryDays,
          sortOrder: product.sortOrder,
          status: product.status === "inactive" ? "inactive" : "active",
        }}
      />
    </section>
  );
};

export default EditProductPage;
