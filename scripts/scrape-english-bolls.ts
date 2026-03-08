/**
 * Alternative English KJV scraper using Bolls.life
 * Falls back to this when bible-api.com rate limits too aggressively.
 *
 * API: https://bolls.life/get-text/KJV/{bookNumber}/{chapter}/
 * Returns JSON array of { pk, verse, text, chapter, book }
 * Note: KJV text includes Strong's numbers in <S>...</S> tags that must be stripped.
 *
 * Includes resume support (skips already-downloaded chapters).
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";
import { existsSync } from "fs";
import { resolve } from "path";

const DELAY_MS = 300;

interface BollsVerse {
  pk: number;
  verse: number;
  text: string;
  chapter: number;
  book: number;
}

function stripStrongsNumbers(text: string): string {
  // Remove Strong's number tags like <S>1234</S>
  return text.replace(/<S>\d+<\/S>/g, "").replace(/\s{2,}/g, " ").trim();
}

function chapterExists(bookNumber: number, chapter: number): boolean {
  const filePath = resolve("public/data/en", String(bookNumber), `${chapter}.json`);
  return existsSync(filePath);
}

async function scrapeChapter(
  bookName: string,
  bookNumber: number,
  chapter: number
): Promise<ScrapedChapter | null> {
  const url = `https://bolls.life/get-text/KJV/${bookNumber}/${chapter}/`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ✗ HTTP ${response.status} for ${bookName} ${chapter}`);
      return null;
    }

    const data = (await response.json()) as BollsVerse[];

    if (!Array.isArray(data) || data.length === 0) {
      console.error(`  ✗ No verses for ${bookName} ${chapter}`);
      return null;
    }

    return {
      book: bookName,
      bookNumber,
      chapter,
      verses: data.map((v) => ({
        verse: v.verse,
        text: stripStrongsNumbers(v.text),
      })),
    };
  } catch (err) {
    console.error(`  ✗ Error fetching ${bookName} ${chapter}:`, err);
    return null;
  }
}

async function main() {
  console.log("🇬🇧 Scraping English KJV from bolls.life (alternative)...\n");

  let totalChapters = 0;
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const book of bookList) {
    console.log(`📖 ${book.name} (${book.chapters} chapters)`);

    for (let ch = 1; ch <= book.chapters; ch++) {
      if (chapterExists(book.bookNumber, ch)) {
        skippedCount++;
        totalChapters++;
        continue;
      }

      const data = await scrapeChapter(book.name, book.bookNumber, ch);

      if (data) {
        saveChapter("en", book.bookNumber, ch, data);
        successCount++;
        process.stdout.write(`  ✓ Chapter ${ch} (${data.verses.length} verses)\n`);
      } else {
        errorCount++;
      }

      totalChapters++;
      await sleep(DELAY_MS);
    }

    if (skippedCount > 0) {
      process.stdout.write(`  ⏭ ${skippedCount} chapters already exist\n`);
      skippedCount = 0;
    }
  }

  console.log(
    `\n✅ English KJV complete: ${successCount} new + ${skippedCount} skipped / ${totalChapters} total (${errorCount} errors)`
  );
}

main().catch(console.error);

