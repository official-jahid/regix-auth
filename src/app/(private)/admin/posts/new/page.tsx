import { Metadata } from "next";
import { getPostPickerOptions } from "@/server/posts";
import PostForm from "../_components/PostForm";

export const metadata: Metadata = {
  title: "New post | REGIX Studio",
  description: "Create a post",
};

const NewPostPage = async () => {
  const { categoryOptions, tagOptions } = await getPostPickerOptions();

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New post</h1>
      <PostForm
        defaults={{
          title: "",
          excerpt: "",
          content: "",
          coverUrl: "",
          status: "draft",
          categoryIds: [],
          tagIds: [],
        }}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
      />
    </section>
  );
};

export default NewPostPage;
