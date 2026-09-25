import { Metadata } from "next";
import TagForm from "../_components/TagForm";

export const metadata: Metadata = {
  title: "New tag | REGIX Studio",
  description: "Create a post tag",
};

const NewTagPage = () => {
  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New tag</h1>
      <TagForm
        defaults={{
          name: "",
          description: "",
          color: "",
          sortOrder: 0,
          status: "active",
        }}
      />
    </section>
  );
};

export default NewTagPage;
