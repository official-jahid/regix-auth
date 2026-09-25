import Link from "next/link";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { getActiveCategories } from "@/server/public";

export const metadata: Metadata = {
  title: "Categories | REGIX Studio",
  description: "Browse posts by category",
};

const CategoriesPage = async () => {
  const categories = await getActiveCategories();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <h1 className="text-4xl font-semibold">Categories</h1>
      {categories.length === 0 && (
        <p className="text-muted-foreground">No categories yet.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}>
            <Card>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>
                  {category.description ?? "No description yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {category._count.posts}{" "}
                {category._count.posts === 1 ? "post" : "posts"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default CategoriesPage;
