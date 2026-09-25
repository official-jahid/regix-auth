import { Metadata } from "next";
import { getCategoryOptions } from "@/server/categories";
import CategoryForm from "../_components/CategoryForm";

export const metadata: Metadata = {
  title: "New category | REGIX Studio",
  description: "Create a post category",
};

const NewCategoryPage = async () => {
  const parentOptions = await getCategoryOptions();

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New category</h1>
      <CategoryForm
        defaults={{
          name: "",
          description: "",
          parentId: null,
          color: "",
          icon: "",
          sortOrder: 0,
          status: "active",
          seoTitle: "",
          seoDescription: "",
        }}
        parentOptions={parentOptions}
      />
    </section>
  );
};

export default NewCategoryPage;
