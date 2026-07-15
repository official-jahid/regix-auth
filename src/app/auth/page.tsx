import LoginForm from "@/components/Form/LoginForm";
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
  title: "Login | Regix Auth",
  description: "Sign in to your Regix Auth account",
};

export default function LoginPage() {
  return (
    <section className="grid min-h-dvh place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">Login</CardTitle>
        </CardHeader>

        <CardContent>
          <LoginForm />
        </CardContent>

        <CardFooter className="justify-center gap-1 text-sm">
          Don't have an account?
          <Link
            href="/auth/register"
            className="text-primary font-medium hover:underline">
            Register
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
