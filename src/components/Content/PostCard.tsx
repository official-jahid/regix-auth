import Link from "next/link";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

type PostCardPost = {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  categories: { category: { name: string; slug: string } }[];
  tags: { tag: { name: string; slug: string } }[];
};

const PostCard = ({ post }: { post: PostCardPost }) => {
  const published =
    post.publishedAt?.toLocaleDateString() ?? "Unpublished date";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>
          {post.excerpt ?? "No excerpt yet."} · {published}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <Link
          href={`/posts/${post.slug}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Read post
        </Link>
      </CardContent>
    </Card>
  );
};

export default PostCard;
