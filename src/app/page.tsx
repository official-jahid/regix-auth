import UserProfileCard from "@/components/UserProfileCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Auth App",
  description: "Home page of auth profile project",
};

const page = () => {
  return (
    <section className="grid grid-cols-3 place-items-center gap-4 pt-22 pb-3">
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
      <UserProfileCard />
    </section>
  );
};

export default page;
