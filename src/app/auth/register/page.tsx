import RegisterForm from "@/components/Form/RegisterForm";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/shadcnui/card";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register | Auth App",
  description: "Register page of auth profile project",
};

const page = () => {
  return (
    <section className="grid h-dvh place-items-center">
      <Card className="w-xs">
        <CardHeader className="text-center text-2xl">Register Form</CardHeader>

        <CardContent>
          <RegisterForm />
        </CardContent>

        <CardFooter className="justify-center gap-1">
          Already have an account?
          <Link
            href={"/auth"}
            className="text-primary hover:underline">
            Login
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
};

export default page;
