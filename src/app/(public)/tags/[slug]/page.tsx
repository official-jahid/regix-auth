import { Metadata } from "next";
import { notFound } from "next/navigation";
import PostCard from "@/components/Content/PostCard";
import { getActiveTagBySlug } from "@/server/public";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const tag = await getActiveTagBySlug(slug);
  if (!tag) {
    return {
      title: "Tag | REGIX Studio",
    };
  }
  return {
    title: `${tag.name} | REGIX Studio`,
    description: tag.description ?? `Posts tagged ${tag.name}`,
  };
};

const TagDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const tag = await getActiveTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const posts = tag.posts.map((link) => link.post);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <h1 className="text-4xl font-semibold">{tag.name}</h1>
      {tag.description && (
        <p className="text-muted-foreground">{tag.description}</p>
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

export default TagDetailPage;
