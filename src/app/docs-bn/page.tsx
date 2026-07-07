import {
  ArrowLeftIcon,
  BookOpenIcon,
  BotIcon,
  CodeIcon,
  FileTextIcon,
  GlobeIcon,
  KeyIcon,
  SettingsIcon,
  TerminalIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ডকুমেন্টেশন - Regix Auth",
  description:
    "Regix Auth অথেন্টিকেশন সিস্টেমের সম্পূর্ণ ডকুমেন্টেশন (বাংলায়)",
};

const DocsBnPage = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-6 pt-24">
      <div className="space-y-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm">
          <ArrowLeftIcon className="h-4 w-4" /> হোম পেজে ফিরে যান
        </Link>
        <h1 className="text-4xl font-bold">ডকুমেন্টেশন</h1>
        <p className="text-muted-foreground text-lg">
          Regix Auth সিস্টেম সেটআপ এবং ব্যবহারের সম্পূর্ণ গাইড
        </p>
      </div>

      <Section
        icon={BookOpenIcon}
        title="কুইক স্টার্ট">
        <div className="space-y-4">
          <h3 className="font-semibold">প্রয়োজনীয়তা</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Node.js 24+ এবং Bun</li>
            <li>SQLite (অন্তর্ভুক্ত)</li>
            <li>Discord Application (ঐচ্ছিক)</li>
          </ul>
          <h3 className="font-semibold">ইনস্টলেশন</h3>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{`git clone https://github.com/official-jahid/regix-auth.git
cd regix-auth
bun install
cp .env.example .env
bun migrate:dev
bun seed
bun dev  # ওয়েব + Discord বট শুরু হবে`}</code>
          </pre>
          <h3 className="font-semibold">ডিফল্ট অ্যাডমিন</h3>
          <div className="bg-muted rounded-lg p-4">
            <p>
              <strong>ইমেইল:</strong> jahidekbalmallick@gmail.com
            </p>
            <p>
              <strong>ইউজারনেম:</strong> ceojahid
            </p>
            <p className="text-destructive mt-2 text-sm">
              ⚠️ প্রথম লগইনে পাসওয়ার্ড পরিবর্তন করুন!
            </p>
          </div>
        </div>
      </Section>

      <Section
        icon={TerminalIcon}
        title="সার্ভিস API (অটোমেশন)">
        <p className="text-muted-foreground mb-4 text-sm">
          পাওয়ারশেল স্ক্রিপ্ট, ক্লাউডফ্লেয়ার ওয়ার্কার্স, CI/CD পাইপলাইন বা
          যেকোনো CLI অটোমেশনের জন্য এই এন্ডপয়েন্ট ব্যবহার করুন।
          সার্ভার-টু-সার্ভার অথেন্টিকেশনের জন্য <code>SECRET_KEY</code>{" "}
          প্রয়োজন।
        </p>

        <div className="space-y-4">
          <div className="bg-muted border-primary rounded-lg border-l-4 p-4">
            <h3 className="mb-2 font-semibold">PowerShell উদাহরণ</h3>
            <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
              <code>{`$secretKey = "RegixSecretKey2024!@#$%^"
$body = @{
  action = "verify"
  secretKey = $secretKey
  username = "ceojahid"
  password = "RegixAdmin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/service/auth" \\
  -Method POST -Body $body -ContentType "application/json"`}</code>
            </pre>
          </div>

          <div className="bg-muted rounded-lg border-l-4 border-orange-500 p-4">
            <h3 className="mb-2 font-semibold">Cloudflare Worker উদাহরণ</h3>
            <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
              <code>{`export default {
  async fetch(request, env) {
    const auth = await fetch("https://yourdomain.com/api/service/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkLicense",
        secretKey: env.SECRET_KEY,
        licenseKey: request.headers.get("X-License-Key")
      })
    });
    const result = await auth.json();
    if (!result.valid) return Response.json({ error: "লাইসেন্স অবৈধ" }, { status: 403 });
    // আপনার ওয়ার্কার লজিক চালিয়ে যান...
  }
}`}</code>
            </pre>
          </div>

          <div className="bg-muted rounded-lg border-l-4 border-green-500 p-4">
            <h3 className="mb-2 font-semibold">cURL উদাহরণ</h3>
            <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
              <code>{`curl -X POST http://localhost:3000/api/service/auth \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "verify",
    "secretKey": "RegixSecretKey2024!@#$%^",
    "username": "ceojahid",
    "password": "RegixAdmin123!",
    "licenseKey": "ABCDE-12345-FGHIJ-67890"
  }'`}</code>
            </pre>
          </div>
        </div>

        <h3 className="mt-6 mb-2 font-semibold">উপলব্ধ অ্যাকশন</h3>
        <div className="space-y-3">
          <ApiEndpoint
            method="POST"
            path="/api/service/auth"
            body={`{ "action": "verify", "secretKey": "...", "username": "...", "password": "...", "licenseKey"?: "..." }`}
            description="ইউজার ক্রেডেনশিয়াল যাচাই করুন এবং ঐচ্ছিকভাবে লাইসেন্স কী ভ্যালিডেট করুন। রিডিম না করা কী অটো-রিডিম করে।"
          />
          <ApiEndpoint
            method="POST"
            path="/api/service/auth"
            body={`{ "action": "registerDevice", "secretKey": "...", "username": "...", "password": "...", "hwid": "...", "sid"?: "..." }`}
            description="অথেন্টিকেটেড ইউজারের জন্য HWID দ্বারা ডিভাইস রেজিস্টার বা আপডেট করুন।"
          />
          <ApiEndpoint
            method="POST"
            path="/api/service/auth"
            body={`{ "action": "checkLicense", "secretKey": "...", "licenseKey": "..." }`}
            description="অথেন্টিকেশন ছাড়াই লাইসেন্স কী-এর বৈধতা এবং অবস্থা পরীক্ষা করুন।"
          />
        </div>
      </Section>

      <Section
        icon={CodeIcon}
        title="REST API রেফারেন্স">
        <p className="text-muted-foreground mb-4 text-sm">
          ওয়েব ইন্টিগ্রেশনের জন্য সেশন-বেসড API এন্ডপয়েন্ট।
        </p>
        <div className="space-y-3">
          <ApiEndpoint
            method="POST"
            path="/api/auth/login"
            description="ইমেইল/ইউজারনেম + পাসওয়ার্ড দিয়ে লগইন"
            body={`{ "email": "...", "username": "...", "password": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/register"
            description="নতুন অ্যাকাউন্ট তৈরি করুন"
            body={`{ "email": "...", "username": "...", "password": "...", "displayName": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/send-otp"
            description="ইমেইল যাচাই বা পাসওয়ার্ড রিসেটের জন্য OTP পাঠান"
            body={`{ "email": "...", "type": "EMAIL_VERIFICATION"|"PASSWORD_RESET" }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/verify-otp"
            description="OTP কোড যাচাই করুন"
            body={`{ "email": "...", "code": "123456", "type": "EMAIL_VERIFICATION"|"PASSWORD_RESET" }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/forgot-password"
            description="পাসওয়ার্ড রিসেট OTP পাঠান"
            body={`{ "email": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/reset-password"
            description="OTP দিয়ে পাসওয়ার্ড রিসেট করুন"
            body={`{ "email": "...", "code": "123456", "newPassword": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/logout"
            description="সেশন নষ্ট করুন"
            auth
          />
          <ApiEndpoint
            method="GET"
            path="/api/auth/session"
            description="বর্তমান ইউজার সেশন দেখুন"
            auth
          />
          <ApiEndpoint
            method="POST"
            path="/api/device/register"
            description="ডিভাইস রেজিস্টার করুন (HWID/SID)"
            auth
            body={`{ "hwid": "...", "sid": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/device/verify"
            description="এক্সটার্নাল অ্যাপ অথের জন্য HWID/SID যাচাই করুন"
            body={`{ "username": "...", "hwid": "...", "sid": "...", "licenseKey": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/keys/generate"
            description="প্রিমিয়াম কী জেনারেট করুন (অ্যাডমিন)"
            auth
            body={`{ "count": 1, "duration": 30, "isLifetime": false }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/keys/redeem"
            description="প্রিমিয়াম লাইসেন্স কী রিডিম করুন"
            auth
            body={`{ "key": "ABCDE-12345-FGHIJ-67890" }`}
          />
          <ApiEndpoint
            method="PATCH"
            path="/api/user/update-profile"
            description="ডিসপ্লে নাম, অ্যাভাটার, ইউজারনেম আপডেট করুন"
            auth
            body={`{ "displayName": "...", "avatarUrl": "...", "username": "..." }`}
          />
          <ApiEndpoint
            method="PATCH"
            path="/api/user/update-credentials"
            description="পাসওয়ার্ড পরিবর্তন করুন"
            auth
            body={`{ "currentPassword": "...", "newPassword": "..." }`}
          />
        </div>
      </Section>

      <Section
        icon={BotIcon}
        title="Discord বট">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            বিল্ট-ইন Discord বট ওয়েব সার্ভারের সাথে একসাথে চলে।
          </p>
          <h3 className="font-semibold">শুরু করুন</h3>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{`bun dev     # ওয়েব + বট একসাথে
bun bot     # শুধু বট`}</code>
          </pre>
          <h3 className="font-semibold">অ্যাডমিন কমান্ড</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "/genkey",
              "/genlicense",
              "/genuser",
              "/blacklist",
              "/unblacklist",
              "/whitelist",
              "/unwhitelist",
              "/reset",
              "/resetpassword",
              "/resetusername",
              "/help",
            ].map((cmd) => (
              <div
                key={cmd}
                className="bg-muted rounded-lg p-2 font-mono text-xs">
                {cmd}
              </div>
            ))}
          </div>
          <h3 className="font-semibold">ইউজার কমান্ড</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {["/userinfo", "/keyinfo", "/licenseinfo", "/stats", "/help"].map(
              (cmd) => (
                <div
                  key={cmd}
                  className="bg-muted rounded-lg p-2 font-mono text-xs">
                  {cmd}
                </div>
              ),
            )}
          </div>
        </div>
      </Section>

      <Section
        icon={KeyIcon}
        title="প্রিমিয়াম লাইসেন্স কী">
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>
            কনফিগারযোগ্য মেয়াদ: ১ দিন, ৭ দিন, ৩০ দিন, ৯০ দিন, ১ বছর, লাইফটাইম
          </li>
          <li>বাল্ক জেনারেশন (একবারে ১০০টি পর্যন্ত কী)</li>
          <li>শেয়ারিং প্রতিরোধে IP-লকিং</li>
          <li>
            কী ফরম্যাট: <code>XXXXX-XXXXX-XXXXX-XXXXX</code>
          </li>
          <li>
            অ্যাডমিন প্যানেল: <code>/dashboard/admin</code>
          </li>
        </ul>
      </Section>

      <Section
        icon={SettingsIcon}
        title="অ্যাডমিন গাইড">
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>ইউজার ম্যানেজমেন্ট:</strong> দেখুন, ব্ল্যাকলিস্ট করুন,
            অ্যাক্টিভেট করুন, রোল পরিবর্তন করুন, ডিলিট করুন
          </li>
          <li>
            <strong>কী ম্যানেজমেন্ট:</strong> জেনারেট, দেখুন,
            অ্যাক্টিভেট/ডিঅ্যাক্টিভেট করুন
          </li>
          <li>
            <strong>ড্যাশবোর্ড স্ট্যাটস:</strong> মোট ইউজার, অ্যাক্টিভ,
            ব্ল্যাকলিস্টেড, কী সংখ্যা
          </li>
          <li>
            অ্যাক্সেস করুন: <code>/dashboard/admin</code>
          </li>
        </ul>
      </Section>

      <Section
        icon={GlobeIcon}
        title="প্রোডাকশন ডিপ্লয়মেন্ট">
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>
            <code>NODE_ENV=production</code> সেট করুন
          </li>
          <li>
            <code>SECRET_KEY</code>, <code>JWT_SECRET</code>,{" "}
            <code>SESSION_SECRET</code> এর জন্য শক্তিশালী র‍্যান্ডম স্ট্রিং
            জেনারেট করুন
          </li>
          <li>
            আপনার ডোমেইনে <code>NEXT_PUBLIC_APP_URL</code> আপডেট করুন
          </li>
          <li>
            <code>bun run build && next start</code>
          </li>
          <li>প্রোডাকশনের জন্য HTTPS এবং রেট লিমিটিং সক্ষম করুন</li>
        </ul>
      </Section>

      <Section
        icon={FileTextIcon}
        title="লিংক">
        <div className="space-y-2">
          <Link
            href="https://github.com/official-jahid/regix-auth"
            className="text-primary block hover:underline"
            target="_blank">
            গিটহাব রিপোজিটরি
          </Link>
          <Link
            href="https://github.com/official-jahid/regix-auth/issues"
            className="text-primary block hover:underline"
            target="_blank">
            সমস্যা রিপোর্ট করুন
          </Link>
          <Link
            href="/docs"
            className="text-primary block hover:underline">
            📖 English Documentation (ইংরেজি ডকুমেন্টেশন)
          </Link>
        </div>
      </Section>
    </div>
  );
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <Icon className="h-5 w-5" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ApiEndpoint({
  method,
  path,
  description,
  auth,
  body,
}: {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  body?: string;
}) {
  const colorMap: Record<string, string> = {
    GET: "text-blue-500",
    POST: "text-green-500",
    PATCH: "text-yellow-500",
    DELETE: "text-red-500",
  };
  return (
    <div className="bg-muted rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`font-mono text-xs font-bold ${colorMap[method] || "text-gray-500"}`}>
          {method}
        </span>
        <span className="font-mono text-xs">{path}</span>
        {auth && (
          <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-500">
            অথ
          </span>
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      {body && (
        <pre className="bg-background mt-1 overflow-x-auto rounded p-2 text-[10px]">
          <code>Body: {body}</code>
        </pre>
      )}
    </div>
  );
}

export default DocsBnPage;
