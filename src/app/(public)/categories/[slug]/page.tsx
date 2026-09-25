import { Metadata } from "next";
import { notFound } from "next/navigation";
import PostCard from "@/components/Content/PostCard";
import { getActiveCategoryBySlug } from "@/server/public";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const category = await getActiveCategoryBySlug(slug);
  if (!category) {
    return {};
  }
  return {
    title: `${category.seoTitle ?? category.name} | REGIX Studio`,
    description: category.seoDescription ?? category.description ?? undefined,
  };
};

const CategoryDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const category = await getActiveCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const posts = category.posts.map((link) => link.post);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <h1 className="text-4xl font-semibold">{category.name}</h1>
      {category.description && (
        <p className="text-muted-foreground">{category.description}</p>
      )}
      {posts.length === 0 && (
        <p className="text-muted-foreground">No published posts yet.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
          />
        ))}
      </div>
    </main>
  );
};

export default CategoryDetailPage;
