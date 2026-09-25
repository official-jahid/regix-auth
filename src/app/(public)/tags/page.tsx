import Link from "next/link";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { getActiveTags } from "@/server/public";

export const metadata: Metadata = {
  title: "Tags | REGIX Studio",
  description: "Browse posts by tag",
};

const TagsPage = async () => {
  const tags = await getActiveTags();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <h1 className="text-4xl font-semibold">Tags</h1>
      {tags.length === 0 && (
        <p className="text-muted-foreground">No tags yet.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}>
            <Card>
              <CardHeader>
                <CardTitle>{tag.name}</CardTitle>
                <CardDescription>
                  {tag.description ?? "No description yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {tag._count.posts} {tag._count.posts === 1 ? "post" : "posts"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default TagsPage;
