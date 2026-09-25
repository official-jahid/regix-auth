import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, getCategoryOptions } from "@/server/categories";
import CategoryForm from "../../_components/CategoryForm";

export const metadata: Metadata = {
  title: "Edit category | REGIX Studio",
  description: "Edit a post category",
};

const EditCategoryPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const [category, parentOptions] = await Promise.all([
    getCategory(id),
    getCategoryOptions(id),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">Edit category</h1>
      <CategoryForm
        categoryId={category.id}
        defaults={{
          name: category.name,
          description: category.description ?? "",
          parentId: category.parentId,
          color: category.color ?? "",
          icon: category.icon ?? "",
          sortOrder: category.sortOrder,
          status: category.status === "inactive" ? "inactive" : "active",
          seoTitle: category.seoTitle ?? "",
          seoDescription: category.seoDescription ?? "",
        }}
        parentOptions={parentOptions}
      />
    </section>
  );
};

export default EditCategoryPage;
