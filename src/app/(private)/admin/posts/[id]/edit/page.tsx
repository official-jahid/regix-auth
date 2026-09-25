import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, getPostPickerOptions } from "@/server/posts";
import PostForm from "../../_components/PostForm";

export const metadata: Metadata = {
  title: "Edit post | REGIX Studio",
  description: "Edit a post",
};

const EditPostPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const [post, { categoryOptions, tagOptions }] = await Promise.all([
    getPost(id),
    getPostPickerOptions(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">Edit post</h1>
      <PostForm
        postId={post.id}
        defaults={{
          title: post.title,
          excerpt: post.excerpt ?? "",
          content: post.content,
          coverUrl: post.coverUrl ?? "",
          status:
            post.status === "published" ? "published"
            : post.status === "archived" ? "archived"
            : "draft",
          categoryIds: post.categories.map((link) => link.categoryId),
          tagIds: post.tags.map((link) => link.tagId),
        }}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
      />
    </section>
  );
};

export default EditPostPage;
