import { redirect } from "next/navigation";

const TaxonomyPage = () => {
  redirect("/admin/taxonomy/categories");
};

export default TaxonomyPage;
