import { Metadata } from "next";
import AnnouncementForm from "../_components/AnnouncementForm";

export const metadata: Metadata = {
  title: "New announcement | REGIX Studio",
  description: "Create a member announcement",
};

const NewAnnouncementPage = () => {
  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-4xl font-semibold">New announcement</h1>
      <AnnouncementForm />
    </section>
  );
};

export default NewAnnouncementPage;
