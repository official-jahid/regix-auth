// Standalone Discord bot entry point - run with: bun run bot
// Or together with the web server: bun run dev
import { startBot } from "./index.js";

startBot().catch((err) => {
  console.error("Bot startup failed:", err);
  process.exit(1);
});
