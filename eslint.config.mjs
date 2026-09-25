import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",
    // Local reference copy of the legacy Express app, not part of the Next build.
    "referance/**",
    // Vendored agent skills, linted upstream.
    ".agents/**",
  ]),
  // Generated shadcn primitives keep their registry style, which calls setState
  // synchronously inside effects in a few files. Silence only that rule there.
  {
    files: ["src/components/shadcnui/**", "src/hooks/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
