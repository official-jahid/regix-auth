import { serverEnv } from "@/lib/env/serverEnv";
import { Resend } from "resend";

const resend = new Resend(serverEnv.RESEND_API_KEY);

const FROM_EMAIL = "Regix Auth <onboarding@resend.dev>";

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
): Promise<{ success: boolean; error?: string }> {
  const subject =
    type === "EMAIL_VERIFICATION" ?
      "Verify your email address - Regix Auth"
    : "Reset your password - Regix Auth";

  const message =
    type === "EMAIL_VERIFICATION" ?
      "Your email verification OTP code is:"
    : "Your password reset OTP code is:";

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 24px; color: #111; margin: 0;">Regix Auth</h1>
            <p style="color: #666; margin: 8px 0 0 0;">${subject}</p>
          </div>
          <div style="background: white; padding: 32px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">${message}</p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">
              ${otp}
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
              This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Regix Auth. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("OTP email send failure:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 24px; color: #111; margin: 0;">Regix Auth</h1>
            <p style="color: #666; margin: 8px 0 0 0;">${subject}</p>
          </div>
          <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">${message}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Regix Auth. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend notification error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Notification email send failure:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
