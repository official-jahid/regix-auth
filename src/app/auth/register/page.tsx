import RegisterForm from "@/components/Form/RegisterForm";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register | Regix Auth",
  description: "Create your Regix Auth account",
};

export default function RegisterPage() {
  return (
    <section className="grid min-h-dvh place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">Register</CardTitle>
        </CardHeader>

        <CardContent>
          <RegisterForm />
        </CardContent>

        <CardFooter className="justify-center gap-1 text-sm">
          Already have an account?
          <Link
            href="/auth"
            className="text-primary font-medium hover:underline">
            Login
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
