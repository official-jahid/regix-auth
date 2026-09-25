import { Metadata } from "next";
import PostCard from "@/components/Content/PostCard";
import { getPublishedPosts } from "@/server/public";

export const metadata: Metadata = {
  title: "Posts | REGIX Studio",
  description: "Published posts from REGIX Studio",
};

const PostsPage = async () => {
  const posts = await getPublishedPosts();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <h1 className="text-4xl font-semibold">Posts</h1>
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

export default PostsPage;
