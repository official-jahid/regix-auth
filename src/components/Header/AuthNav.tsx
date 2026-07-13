"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";

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
        href={"/dashboard"}>
        Dashboard
      </Link>

      <Link
        className="hover:underline"
        href={"/profile"}>
        Profile
      </Link>
    </>
  );
};

export default AuthNav;