import { registerUserAction } from "@/actions/auth-actions";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await registerUserAction(null, formData);

  if (result.success) {
    return Response.json(result);
  }

  return Response.json(result, { status: 400 });
}