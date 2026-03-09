/**
 * Diagnostic: Fetch raw API data for chapters with remaining gaps
 * to see what the API actually returns, including noStart/noEnd fields.
 */

interface GeezVerse {
  id: string;
  book: string;
  chapter: string;
  no: string;
  noStart: string;
  noEnd: string;
  article: string;
  pARAGRAPH: string;
  entryDate: string | null;
  remark: string | null;
  linking: string;
}

const chapters = [
  { lang: "amharic", book: 49, chapter: 5, label: "am/49/5 (Ephesians 5)" },
  { lang: "tigrinya", book: 18, chapter: 34, label: "ti/18/34 (Job 34)" },
  { lang: "tigrinya", book: 19, chapter: 37, label: "ti/19/37 (Psalm 37)" },
  { lang: "tigrinya", book: 19, chapter: 71, label: "ti/19/71 (Psalm 71)" },
  { lang: "tigrinya", book: 20, chapter: 7, label: "ti/20/7 (Proverbs 7)" },
  { lang: "tigrinya", book: 66, chapter: 21, label: "ti/66/21 (Revelation 21)" },
];

import * as fs from "fs";

async function main() {
  const results: string[] = [];

  for (const ch of chapters) {
    const url = `http://bible.geezexperience.com/server/list_api.php?language=${ch.lang}&book=${ch.book}&chapter=${ch.chapter}`;
    try {
      const response = await fetch(url);
      const data = (await response.json()) as GeezVerse[];

      results.push(`\n=== ${ch.label} ===`);
      results.push(`Total entries from API: ${data.length}`);
      for (const v of data) {
        results.push(`  no=${v.no} noStart=${v.noStart} noEnd=${v.noEnd} text=${v.article.substring(0, 60)}...`);
      }
    } catch (err) {
      results.push(`\n=== ${ch.label} === ERROR: ${err}`);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  const output = results.join("\n");
  fs.writeFileSync("scripts/api-diagnostic.txt", output, "utf-8");
}

main();

