/**
 * Fix remaining gaps where the API's noEnd field was unreliable.
 * For verses with no verseEnd that are followed by a gap, infer verseEnd
 * from the next verse's number.
 */
import * as fs from "fs";
import * as path from "path";

function fixGapsInFile(filePath: string): boolean {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const verses = data.verses;
  let fixed = false;

  for (let i = 0; i < verses.length - 1; i++) {
    const curr = verses[i];
    const next = verses[i + 1];
    const currEnd = curr.verseEnd ?? curr.verse;
    if (next.verse - currEnd > 1) {
      // Gap detected — infer verseEnd
      curr.verseEnd = next.verse - 1;
      fixed = true;
    }
  }

  if (fixed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
  return fixed;
}

function main() {
  const results: string[] = [];

  for (const lang of ["am", "ti"]) {
    const langDir = path.join("public", "data", lang);
    if (!fs.existsSync(langDir)) continue;

    const bookDirs = fs.readdirSync(langDir)
      .filter((f: string) => !f.includes("."))
      .sort((a: string, b: string) => +a - +b);

    for (const bookDir of bookDirs) {
      const chapterDir = path.join(langDir, bookDir);
      const chapterFiles = fs.readdirSync(chapterDir)
        .filter((f: string) => f.endsWith(".json"));

      for (const chFile of chapterFiles) {
        const filePath = path.join(chapterDir, chFile);
        if (fixGapsInFile(filePath)) {
          results.push(`Fixed: ${lang}/${bookDir}/${chFile}`);
        }
      }
    }
  }

  if (results.length > 0) {
    console.log(`Fixed ${results.length} files:`);
    results.forEach((r) => console.log(`  ${r}`));
  } else {
    console.log("No gaps found — nothing to fix.");
  }
}

main();

