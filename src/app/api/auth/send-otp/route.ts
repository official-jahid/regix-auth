import { sendDiscordOtpAction } from "@/actions/auth-actions";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await sendDiscordOtpAction(null, formData);
  return Response.json(result);
}