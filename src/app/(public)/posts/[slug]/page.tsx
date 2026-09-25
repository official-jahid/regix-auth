import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/shadcnui/badge";
import { getPublishedPostBySlug } from "@/server/public";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return {};
  }
  return {
    title: `${post.title} | REGIX Studio`,
    description: post.excerpt ?? "A post from REGIX Studio",
  };
};

const PostDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-4xl font-semibold">{post.title}</h1>
      <p className="text-muted-foreground text-sm">
        {post.publishedAt?.toLocaleDateString() ?? ""}
        {post.excerpt ? ` · ${post.excerpt}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {post.categories.map((link) => (
          <Link
            key={link.category.slug}
            href={`/categories/${link.category.slug}`}>
            <Badge variant="secondary">{link.category.name}</Badge>
          </Link>
        ))}
        {post.tags.map((link) => (
          <Link
            key={link.tag.slug}
            href={`/tags/${link.tag.slug}`}>
            <Badge variant="outline">{link.tag.name}</Badge>
          </Link>
        ))}
      </div>
      <article className="whitespace-pre-wrap">{post.content}</article>
    </main>
  );
};

export default PostDetailPage;
