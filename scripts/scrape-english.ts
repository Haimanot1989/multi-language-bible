/**
 * Scrape English KJV Bible from bible-api.com
 *
 * API: https://bible-api.com/{book}+{chapter}?translation=kjv
 * Returns JSON with verses array.
 *
 * Includes retry with exponential backoff for 429 rate limits,
 * and resume support (skips already-downloaded chapters).
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";
import { existsSync } from "fs";
import { resolve } from "path";

const BASE_DELAY_MS = 1000; // 1 second between requests
const MAX_RETRIES = 5;

interface BibleApiVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleApiResponse {
  reference: string;
  verses: BibleApiVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
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
  const query = encodeURIComponent(`${bookName} ${chapter}`);
  const url = `https://bible-api.com/${query}?translation=kjv`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        const waitTime = BASE_DELAY_MS * Math.pow(2, attempt + 1); // 2s, 4s, 8s, 16s, 32s
        process.stdout.write(`  ⏳ Rate limited, waiting ${waitTime / 1000}s...\n`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        console.error(`  ✗ HTTP ${response.status} for ${bookName} ${chapter}`);
        return null;
      }

      const data = (await response.json()) as BibleApiResponse;

      if (!data.verses || data.verses.length === 0) {
        console.error(`  ✗ No verses for ${bookName} ${chapter}`);
        return null;
      }

      return {
        book: bookName,
        bookNumber,
        chapter,
        verses: data.verses.map((v) => ({
          verse: v.verse,
          text: v.text.trim(),
        })),
      };
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = BASE_DELAY_MS * Math.pow(2, attempt);
        process.stdout.write(`  ⚠ Error, retrying in ${waitTime / 1000}s...\n`);
        await sleep(waitTime);
        continue;
      }
      console.error(`  ✗ Error fetching ${bookName} ${chapter} after ${MAX_RETRIES} retries:`, err);
      return null;
    }
  }

  console.error(`  ✗ Failed after ${MAX_RETRIES} retries for ${bookName} ${chapter}`);
  return null;
}

async function main() {
  console.log("🇬🇧 Scraping English KJV from bible-api.com...\n");
  console.log("Using 1s delay + exponential backoff for rate limits.\n");

  let totalChapters = 0;
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const book of bookList) {
    console.log(`📖 ${book.name} (${book.chapters} chapters)`);

    for (let ch = 1; ch <= book.chapters; ch++) {
      // Skip already downloaded chapters
      if (chapterExists(book.bookNumber, ch)) {
        skippedCount++;
        totalChapters++;
        process.stdout.write(`  ⏭ Chapter ${ch} (already exists)\n`);
        continue;
      }

      const data = await scrapeChapter(book.bibleApiName, book.bookNumber, ch);

      if (data) {
        saveChapter("en", book.bookNumber, ch, data);
        successCount++;
        process.stdout.write(`  ✓ Chapter ${ch} (${data.verses.length} verses)\n`);
      } else {
        errorCount++;
      }

      totalChapters++;
      await sleep(BASE_DELAY_MS);
    }
  }

  console.log(
    `\n✅ English KJV complete: ${successCount} new + ${skippedCount} existing / ${totalChapters} total (${errorCount} errors)`
  );
}

main().catch(console.error);
