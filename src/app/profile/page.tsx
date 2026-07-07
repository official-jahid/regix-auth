import { redirect } from "next/navigation";

const ProfileRedirect = () => {
  redirect("/dashboard");
  return null;
};

export default ProfileRedirect;
