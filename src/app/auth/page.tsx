import LoginForm from "@/components/Form/LoginForm";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/shadcnui/card";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | Auth App",
  description: "Login page of auth profile project",
};

const page = () => {
  return (
    <section className="grid h-dvh place-items-center">
      <Card className="w-xs">
        <CardHeader className="text-center text-2xl">Login Form</CardHeader>

        <CardContent>
          <LoginForm />
        </CardContent>

        <CardFooter className="justify-center gap-1">
          Don't have an account?
          <Link
            href={"/auth/register"}
            className="text-primary hover:underline">
            Register
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
};

export default page;
