/**
 * Re-scrape only chapters that have combined (gapped) verses in Amharic and Tigrinya.
 * Detects which chapters have verse number gaps, then re-fetches them from the API
 * to get the verseEnd information.
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";
import * as fs from "fs";
import * as path from "path";

const DELAY_MS = 250;

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

interface ChapterToFix {
  lang: "am" | "ti";
  apiLang: string;
  bookNumber: number;
  bookName: string;
  chapter: number;
}

function findChaptersWithGaps(): ChapterToFix[] {
  const results: ChapterToFix[] = [];
  const langConfigs: { lang: "am" | "ti"; apiLang: string }[] = [
    { lang: "am", apiLang: "amharic" },
    { lang: "ti", apiLang: "tigrinya" },
  ];

  for (const { lang, apiLang } of langConfigs) {
    const langDir = path.join("public", "data", lang);
    if (!fs.existsSync(langDir)) continue;

    const bookDirs = fs.readdirSync(langDir).filter((f) => !f.includes(".")).sort((a, b) => +a - +b);

    for (const bookDir of bookDirs) {
      const bookNumber = parseInt(bookDir, 10);
      const bookInfo = bookList.find((b) => b.bookNumber === bookNumber);
      if (!bookInfo) continue;

      const chapterDir = path.join(langDir, bookDir);
      const chapterFiles = fs.readdirSync(chapterDir).filter((f) => f.endsWith(".json"));

      for (const chFile of chapterFiles) {
        const chapterNum = parseInt(chFile.replace(".json", ""), 10);
        const data = JSON.parse(fs.readFileSync(path.join(chapterDir, chFile), "utf-8"));
        const verses = data.verses;

        // Check if any verse already has verseEnd (already fixed)
        const alreadyFixed = verses.some((v: any) => v.verseEnd !== undefined);
        if (alreadyFixed) continue;

        // Check for gaps
        let hasGap = false;
        for (let i = 0; i < verses.length - 1; i++) {
          if (verses[i + 1].verse - verses[i].verse > 1) {
            hasGap = true;
            break;
          }
        }

        if (hasGap) {
          results.push({
            lang,
            apiLang,
            bookNumber,
            bookName: bookInfo.name,
            chapter: chapterNum,
          });
        }
      }
    }
  }

  return results;
}

async function scrapeChapter(
  apiLang: string,
  bookNumber: number,
  chapter: number
): Promise<{ verse: number; verseEnd?: number; text: string }[] | null> {
  const url = `http://bible.geezexperience.com/server/list_api.php?language=${apiLang}&book=${bookNumber}&chapter=${chapter}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as GeezVerse[];
    if (!Array.isArray(data) || data.length === 0) return null;

    return data.map((v) => {
      const verse = parseInt(v.noStart, 10) || parseInt(v.no, 10);
      const noEnd = parseInt(v.noEnd, 10);
      return {
        verse,
        ...(noEnd > verse ? { verseEnd: noEnd } : {}),
        text: v.article.trim(),
      };
    });
  } catch {
    return null;
  }
}

async function main() {
  console.log("🔍 Finding chapters with verse gaps...\n");

  const chaptersToFix = findChaptersWithGaps();
  console.log(`Found ${chaptersToFix.length} chapters to re-scrape.\n`);

  if (chaptersToFix.length === 0) {
    console.log("✅ No gaps found — nothing to do!");
    return;
  }

  let success = 0;
  let errors = 0;

  for (const ch of chaptersToFix) {
    const verses = await scrapeChapter(ch.apiLang, ch.bookNumber, ch.chapter);

    if (verses) {
      const chapterData: ScrapedChapter = {
        book: ch.bookName,
        bookNumber: ch.bookNumber,
        chapter: ch.chapter,
        verses,
      };
      saveChapter(ch.lang, ch.bookNumber, ch.chapter, chapterData);
      success++;
      console.log(`  ✓ ${ch.lang}/${ch.bookNumber}/${ch.chapter} (${verses.length} verses, ${verses.filter((v) => v.verseEnd).length} combined)`);
    } else {
      errors++;
      console.error(`  ✗ ${ch.lang}/${ch.bookNumber}/${ch.chapter} — failed to fetch`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ Done: ${success} chapters re-scraped, ${errors} errors.`);
}

main().catch(console.error);

