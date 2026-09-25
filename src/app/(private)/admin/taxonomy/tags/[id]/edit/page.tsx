import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTag } from "@/server/tags";
import TagForm from "../../_components/TagForm";

export const metadata: Metadata = {
  title: "Edit tag | REGIX Studio",
  description: "Edit a post tag",
};

const EditTagPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const tag = await getTag(id);

  if (!tag) {
    notFound();
  }

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">Edit tag</h1>
      <TagForm
        tagId={tag.id}
        defaults={{
          name: tag.name,
          description: tag.description ?? "",
          color: tag.color ?? "",
          sortOrder: tag.sortOrder,
          status: tag.status === "inactive" ? "inactive" : "active",
        }}
      />
    </section>
  );
};

export default EditTagPage;
