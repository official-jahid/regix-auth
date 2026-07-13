"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { useSidebar } from "@/components/shadcnui/sidebar";
import {
  BookOpen,
  Bot,
  Cpu,
  Globe,
  Key,
  Lock,
  Menu,
  Shield,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const programmingLanguages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
] as const;

const uiLanguages = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "ne", label: "नेपाली (Nepali)" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ru", label: "Русский (Russian)" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "pt", label: "Português" },
  { value: "ko", label: "한국어 (Korean)" },
] as const;

const contentData: Record<string, Record<string, any>> = {
  en: {
    gettingStarted: {
      title: "Getting Started",
      sections: [
        {
          title: "Installation",
          content:
            "Install Regix Auth in your project using your preferred package manager.",
          code: {
            javascript: `npm install @regix/auth\n// or\nyarn add @regix-auth\n// or\nbun add @regix/auth`,
            typescript: `npm install @regix/auth\n// or\nyarn add @regix-auth\n// or\nbun add @regix/auth`,
            python: `pip install regix-auth`,
            java: `// In your pom.xml\n<dependency>\n  <groupId>com.regix</groupId>\n  <artifactId>regix-auth</artifactId>\n  <version>1.0.0</version>\n</dependency>`,
            csharp: `Install-Package RegixAuth`,
            c: `# Clone and build from source\ngit clone https://github.com/official-jahid/regix-auth.git\ncd regix-auth && make`,
            cpp: `# Clone and build from source\ngit clone https://github.com/official-jahid/regix-auth.git\ncd regix-auth && cmake . && make`,
          },
        },
        {
          title: "Quick Start",
          content: "Initialize the auth client with your credentials.",
          code: {
            javascript: `import { AuthClient } from '@regix/auth';\n\nconst auth = new AuthClient({\n  baseUrl: 'https://api.regix-auth.com',\n  apiKey: process.env.REGIX_API_KEY\n});`,
            typescript: `import { AuthClient } from '@regix/auth';\nimport type { AuthConfig, User } from '@regix/auth/types';\n\nconst config: AuthConfig = {\n  baseUrl: 'https://api.regix-auth.com',\n  apiKey: process.env.REGIX_API_KEY\n};\n\nconst auth = new AuthClient(config);`,
            python: `from regix_auth import AuthClient\n\nauth = AuthClient(\n    base_url='https://api.regix-auth.com',\n    api_key='your-api-key'\n)`,
            java: `import com.regix.auth.AuthClient;\n\nAuthClient auth = new AuthClient.Builder()\n    .baseUrl(\"https://api.regix-auth.com\")\n    .apiKey(\"your-api-key\")\n    .build();`,
            csharp: `using RegixAuth;\n\nvar auth = new AuthClient(new AuthConfig {\n    BaseUrl = \"https://api.regix-auth.com\",\n    ApiKey = \"your-api-key\"\n});`,
            c: `#include <regix/auth.h>\n\nauth_client_t *auth = auth_client_new(\n    \"https://api.regix-auth.com\",\n    \"your-api-key\"\n);`,
            cpp: `#include <regix/auth.hpp>\n\nauto auth = regix::AuthClient(\n    \"https://api.regix-auth.com\",\n    \"your-api-key\"\n);`,
          },
        },
      ],
    },
    authentication: {
      title: "Authentication",
      sections: [
        {
          title: "User Registration",
          content: "Register new users with email and password.",
          code: {
            javascript: `const response = await auth.register({\n  username: 'johndoe',\n  email: 'john@example.com',\n  password: 'SecurePass123!'\n});`,
            typescript: `const response = await auth.register<RegisterResponse>({\n  username: 'johndoe',\n  email: 'john@example.com',\n  password: 'SecurePass123!'\n});`,
            python: `response = auth.register(\n    username='johndoe',\n    email='john@example.com',\n    password='SecurePass123!'\n)`,
            java: `RegisterResponse response = auth.register(\n    "johndoe",\n    "john@example.com",\n    "SecurePass123!"\n);`,
            csharp: `var response = await auth.RegisterAsync(\n    "johndoe",\n    "john@example.com",\n    "SecurePass123!"\n);`,
            c: `auth_response_t *response = auth_register(\n    auth,\n    \"johndoe\",\n    \"john@example.com\",\n    \"SecurePass123!\"\n);`,
            cpp: `auto response = auth.register(\n    "johndoe",\n    "john@example.com",\n    "SecurePass123!"\n);`,
          },
        },
        {
          title: "Login",
          content: "Authenticate users with username and password.",
          code: {
            javascript: `const session = await auth.login({\n  username: 'johndoe',\n  password: 'SecurePass123!'\n});`,
            typescript: `const session = await auth.login<SessionResponse>({\n  username: 'johndoe',\n  password: 'SecurePass123!'\n});`,
            python: `session = auth.login(\n    username='johndoe',\n    password='SecurePass123!'\n)`,
            java: `SessionResponse session = auth.login(\n    "johndoe",\n    "SecurePass123!"\n);`,
            csharp: `var session = await auth.LoginAsync(\n    "johndoe",\n    "SecurePass123!"\n);`,
            c: `session_t *session = auth_login(\n    auth,\n    \"johndoe\",\n    \"SecurePass123!\"\n);`,
            cpp: `auto session = auth.login(\n    "johndoe",\n    "SecurePass123!"\n);`,
          },
        },
      ],
    },
    licenseKeys: {
      title: "License Keys",
      sections: [
        {
          title: "Generate Keys",
          content: "Generate premium license keys for your users.",
          code: {
            javascript: `const keys = await auth.generateKeys({\n  count: 5,\n  duration: 30\n});`,
            typescript: `const keys = await auth.generateKeys<GenerateKeysResponse>({\n  count: 5,\n  duration: 30\n});`,
            python: `keys = auth.generate_keys(count=5, duration=30)`,
            java: `GenerateKeysResponse keys = auth.generateKeys(5, 30);`,
            csharp: `var keys = await auth.GenerateKeysAsync(5, 30);`,
            c: `keys_t *keys = auth_generate_keys(auth, 5, 30);`,
            cpp: `auto keys = auth.generateKeys(5, 30);`,
          },
        },
        {
          title: "Redeem Key",
          content: "Redeem a license key for a user.",
          code: {
            javascript: `const result = await auth.redeemKey(\n  'XXXXX-XXXXX-XXXXX-XXXXX'\n);`,
            typescript: `const result = await auth.redeemKey<RedeemResponse>(\n  'XXXXX-XXXXX-XXXXX-XXXXX'\n);`,
            python: `result = auth.redeem_key('XXXXX-XXXXX-XXXXX-XXXXX')`,
            java: `RedeemResponse result = auth.redeemKey(\n    "XXXXX-XXXXX-XXXXX-XXXXX"\n);`,
            csharp: `var result = await auth.RedeemKeyAsync(\n    "XXXXX-XXXXX-XXXXX-XXXXX"\n);`,
            c: `key_result_t *result = auth_redeem_key(\n    auth,\n    \"XXXXX-XXXXX-XXXXX-XXXXX\"\n);`,
            cpp: `auto result = auth.redeemKey(\n    "XXXXX-XXXXX-XXXXX-XXXXX"\n);`,
          },
        },
      ],
    },
    hwid: {
      title: "HWID / Device Auth",
      sections: [
        {
          title: "Device Verification",
          content:
            "Verify a device using HWID and SID for desktop authentication.",
          code: {
            javascript: `const verified = await auth.verifyDevice({\n  hwid: 'HARDWARE-ID-HERE',\n  sid: 'SECURITY-ID-HERE'\n});`,
            typescript: `const verified = await auth.verifyDevice<DeviceResponse>({\n  hwid: 'HARDWARE-ID-HERE',\n  sid: 'SECURITY-ID-HERE'\n});`,
            python: `verified = auth.verify_device(\n    hwid='HARDWARE-ID-HERE',\n    sid='SECURITY-ID-HERE'\n)`,
            java: `DeviceResponse verified = auth.verifyDevice(\n    "HARDWARE-ID-HERE",\n    "SECURITY-ID-HERE"\n);`,
            csharp: `var verified = await auth.VerifyDeviceAsync(\n    "HARDWARE-ID-HERE",\n    "SECURITY-ID-HERE"\n);`,
            c: `#include <regix/hwid.h>\n\nchar hwid[64];\nget_hwid(hwid, sizeof(hwid));\n\nbool verified = auth_verify_device(auth, hwid, sid);`,
            cpp: `#include <regix/hwid.hpp>\n\nstd::string hwid = regix::get_hwid();\nbool verified = auth.verifyDevice(hwid, sid);`,
          },
        },
      ],
    },
    discordBot: {
      title: "Discord Bot",
      sections: [
        {
          title: "Bot Commands",
          content: "Interact with the built-in Discord bot for management.",
          code: {
            javascript: `// The bot auto-registers all slash commands on startup\n// Available commands: /help, /stats, /userinfo, /keyinfo\n// Admin: /genuser, /blacklist, /genlicense, /reset`,
            typescript: `// All commands are type-safe with Discord.js types\nimport { SlashCommandBuilder } from 'discord.js';\n\nexport const data = new SlashCommandBuilder()\n  .setName('stats')\n  .setDescription('View system statistics');`,
            python: `# Python bot wrapper example\nfrom regix_auth import DiscordBot\n\nbot = DiscordBot(token='your-bot-token')\nbot.start()`,
            java: `// Java Discord bot integration\nDiscordBot bot = new DiscordBot("your-bot-token");\nbot.registerCommands();\nbot.start();`,
            csharp: `// C# Discord bot integration\nvar bot = new DiscordBot("your-bot-token");\nawait bot.StartAsync();`,
            c: `// C Discord bot integration - uses REST API\n// See API documentation for endpoint details`,
            cpp: `// C++ Discord bot integration\n// See API documentation for endpoint details`,
          },
        },
      ],
    },
    api: {
      title: "API Reference",
      sections: [
        {
          title: "REST Endpoints",
          content: "Full REST API reference for all endpoints.",
          code: {
            javascript: `// All endpoints available via fetch\nconst res = await fetch('/api/admin/stats', {\n  headers: { Authorization: 'Bearer SECRET_KEY' }\n});\nconst stats = await res.json();`,
            typescript: `// Typed API client example\ninterface StatsResponse {\n  totalUsers: number;\n  totalKeys: number;\n  activeKeys: number;\n}\n\nconst res = await fetch('/api/admin/stats', {\n  headers: { Authorization: 'Bearer SECRET_KEY' }\n});\nconst stats: StatsResponse = await res.json();`,
            python: `import requests\n\nres = requests.get(\n    'https://your-domain.com/api/admin/stats',\n    headers={'Authorization': 'Bearer SECRET_KEY'}\n)\nstats = res.json()`,
            java: `// Java HTTP client example\nHttpClient client = HttpClient.newHttpClient();\nHttpRequest request = HttpRequest.newBuilder()\n    .uri(URI.create(\"https://your-domain.com/api/admin/stats\"))\n    .header(\"Authorization\", \"Bearer SECRET_KEY\")\n    .GET()\n    .build();\n\nHttpResponse<String> response = client.send(request, BodyHandlers.ofString());`,
            csharp: `// C# HTTP client example\nusing var client = new HttpClient();\nclient.DefaultRequestHeaders.Add(\n    \"Authorization\", \"Bearer SECRET_KEY\"\n);\nvar response = await client.GetAsync(\n    \"https://your-domain.com/api/admin/stats\"\n);\nvar stats = await response.Content.ReadAsStringAsync();`,
            c: `// C libcurl example\nCURL *curl = curl_easy_init();\nstruct curl_slist *headers = NULL;\nheaders = curl_slist_append(headers, \"Authorization: Bearer SECRET_KEY\");\ncurl_easy_setopt(curl, CURLOPT_URL, \"https://api.example.com/stats\");\ncurl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\ncurl_easy_perform(curl);`,
            cpp: `// C++ cpprestsdk example\nweb::http::client::http_client client(\n    \"https://your-domain.com/api/admin/stats\"\n);\n\nweb::http::http_request req(web::http::methods::GET);\nreq.headers().add(\"Authorization\", \"Bearer SECRET_KEY\");\n\nauto response = client.request(req).get();\nauto stats = response.extract_json().get();`,
          },
        },
      ],
    },
    security: {
      title: "Security",
      sections: [
        {
          title: "Rate Limiting",
          content: "Built-in rate limiting with three tiers of protection.",
          code: {
            javascript: `// Configure rate limiting\nconst auth = new AuthClient({\n  rateLimits: {\n    auth: { maxRequests: 5, windowMs: 60000 },\n    api: { maxRequests: 20, windowMs: 60000 },\n    bot: { maxRequests: 60, windowMs: 60000 }\n  }\n});`,
            typescript: `interface RateLimitConfig {\n  auth: { maxRequests: number; windowMs: number };\n  api: { maxRequests: number; windowMs: number };\n  bot: { maxRequests: number; windowMs: number };\n}`,
            python: `# Rate limits are enforced server-side\nauth = AuthClient(\n    base_url='https://api.regix-auth.com',\n    rate_limit_auth=5,\n    rate_limit_api=20\n)`,
            java: `// Server-side rate limiting with config\nRateLimiter limiter = new RateLimiter.Builder()\n    .authLimit(5)\n    .apiLimit(20)\n    .windowMs(60000)\n    .build();`,
            csharp: `// Server-side rate limiting\nvar limiter = new RateLimiter(options => {\n    options.AuthLimit = 5;\n    options.ApiLimit = 20;\n    options.WindowMs = 60000;\n});`,
            c: `// Server-side rate limiting is configured via environment variables`,
            cpp: `// Server-side rate limiting is configured via environment variables`,
          },
        },
        {
          title: "CSRF Protection",
          content: "Double-submit cookie pattern for CSRF protection.",
          code: {
            javascript: `// CSRF token is automatically included in requests\nconst response = await fetch('/api/some-endpoint', {\n  method: 'POST',\n  credentials: 'include',\n  headers: {\n    'x-csrf-token': getCsrfToken()\n  }\n});`,
            typescript: `// Typed CSRF helper\nfunction getCsrfToken(): string {\n  const match = document.cookie.match(/csrf_token=([^;]+)/);\n  return match ? match[1] : '';\n}`,
            python: `import requests\n\nsession = requests.Session()\n# CSRF cookie is handled automatically\nresponse = session.post(\n    'https://your-domain.com/api/endpoint',\n    headers={'x-csrf-token': session.cookies.get('csrf_token')}\n)`,
            java: `// Java CSRF example\nString csrfToken = getCookie("csrf_token");\nHttpRequest request = HttpRequest.newBuilder()\n    .header("x-csrf-token", csrfToken)\n    .POST(...)\n    .build();`,
            csharp: `// C# CSRF example\nvar csrfToken = await GetCookieAsync("csrf_token");\nclient.DefaultRequestHeaders.Add(\n    "x-csrf-token", csrfToken\n);`,
            c: `// C CSRF example - read cookie and send header\nchar csrf[128];\nget_cookie("csrf_token", csrf, sizeof(csrf));\n// Then include in request headers`,
            cpp: `// C++ CSRF example\nstd::string csrf = get_cookie("csrf_token");\n// Then include in request headers`,
          },
        },
      ],
    },
  },
};

// Translations are auto-derived from English keys
const translations: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
  ne: "नेपाली",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  ja: "日本語",
  ru: "Русский",
  ar: "العربية",
  pt: "Português",
  ko: "한국어",
};

const navItems = [
  { id: "gettingStarted", label: "Getting Started", icon: BookOpen },
  { id: "authentication", label: "Authentication", icon: Lock },
  { id: "licenseKeys", label: "License Keys", icon: Key },
  { id: "hwid", label: "HWID / Device Auth", icon: Cpu },
  { id: "discordBot", label: "Discord Bot", icon: Bot },
  { id: "api", label: "API Reference", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
];

function LanguageFlag({ lang }: { lang: string }) {
  const flags: Record<string, string> = {
    en: "🇬🇧",
    bn: "🇧🇩",
    ne: "🇳🇵",
    hi: "🇮🇳",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ru: "🇷🇺",
    ar: "🇸🇦",
    pt: "🇵🇹",
    ko: "🇰🇷",
  };
  return <span>{flags[lang] || "🌐"}</span>;
}

export default function DocsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const activeSection = searchParams.get("section") ?? "gettingStarted";
  const activeLang = searchParams.get("lang") ?? "en";
  const activeProgLang = searchParams.get("prog") ?? "typescript";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      const url = `${pathname}?${params.toString()}`;
      router.push(url as any, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const content = contentData[activeLang] || contentData.en;
  const section = content[activeSection];
  const translation = translations[activeLang] || "English";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside
        className={`bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30 flex flex-col border-r transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-64"
        }`}>
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Menu className="size-5 shrink-0" />
          {!isCollapsed && (
            <span className="truncate text-sm font-semibold">Regix Auth</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => updateParam("section", item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeSection === item.id ?
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
                title={isCollapsed ? item.label : undefined}>
                <Icon className="size-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-2">
          <button
            onClick={() => router.push("/")}
            className="text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors">
            <span className="text-xs">←</span>
            {!isCollapsed && <span className="truncate">Back to Home</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-200 ${
          isCollapsed ? "ml-16" : "ml-64"
        }`}>
        {/* Top Bar */}
        <div className="bg-background/80 sticky top-0 z-20 flex items-center gap-3 border-b px-6 py-3 backdrop-blur-sm">
          {/* Language Select */}
          <div className="flex items-center gap-2">
            <Select
              value={activeLang}
              onValueChange={(v) => {
                if (v) updateParam("lang", v);
              }}>
              <SelectTrigger className="w-44">
                <LanguageFlag lang={activeLang} />
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <LanguageFlag lang={activeLang} />
                    {translation}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {uiLanguages.map((lang) => (
                  <SelectItem
                    key={lang.value}
                    value={lang.value}>
                    <LanguageFlag lang={lang.value} /> {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Programming Language Select */}
          <div className="flex items-center gap-2">
            <Select
              value={activeProgLang}
              onValueChange={(v) => {
                if (v) updateParam("prog", v);
              }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {programmingLanguages.map((lang) => (
                  <SelectItem
                    key={lang.value}
                    value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-6 py-8">
          {section ?
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight">
                {section.title}
              </h1>
              <div className="space-y-8">
                {section.sections?.map((sec: any, i: number) => (
                  <div
                    key={i}
                    className="bg-card rounded-2xl border p-6 shadow-sm">
                    <h2 className="mb-3 text-xl font-semibold">{sec.title}</h2>
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {sec.content}
                    </p>
                    {sec.code?.[activeProgLang] && (
                      <pre className="bg-muted overflow-x-auto rounded-xl p-4 text-xs leading-relaxed">
                        <code>{sec.code[activeProgLang]}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          : <div className="flex min-h-[50vh] items-center justify-center">
              <p className="text-muted-foreground">
                Select a section from the sidebar
              </p>
            </div>
          }
        </div>
      </main>
    </div>
  );
}
