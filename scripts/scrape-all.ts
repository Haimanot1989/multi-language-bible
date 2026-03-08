/**
 * Run all 4 scraping scripts sequentially.
 */
import { execSync } from "child_process";

const scripts = [
  { name: "English KJV", cmd: "npx tsx scripts/scrape-english.ts" },
  { name: "Norwegian Bokmål", cmd: "npx tsx scripts/scrape-norwegian.ts" },
  { name: "Tigrinya", cmd: "npx tsx scripts/scrape-tigrinya.ts" },
  { name: "Amharic", cmd: "npx tsx scripts/scrape-amharic.ts" },
];

async function main() {
  console.log("🌍 Scraping all 4 Bible translations...\n");
  console.log("This will take a while. Grab a coffee! ☕\n");

  for (const script of scripts) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Starting: ${script.name}`);
    console.log("=".repeat(60) + "\n");

    try {
      execSync(script.cmd, { stdio: "inherit" });
    } catch (err) {
      console.error(`\n❌ Error scraping ${script.name}:`, err);
      console.log("Continuing with next language...\n");
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 All scraping complete!");
  console.log("=".repeat(60));
}

main().catch(console.error);

