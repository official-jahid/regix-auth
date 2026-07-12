"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import LogoutButton from "../Buttons/LogoutButton";

const AuthNav = () => {
  const { data } = authClient.useSession();

  if (!data) {
    return (
      <>
        <Link
          className="hover:underline"
          href={"/auth"}>
          Login
        </Link>
        <Link
          className="hover:underline"
          href={"/auth/register"}>
          Register
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        className="hover:underline"
        href={"/profile"}>
        Profile
      </Link>

      <LogoutButton />
    </>
  );
};

export default AuthNav;
