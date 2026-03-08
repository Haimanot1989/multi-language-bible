/**
 * Scrape English KJV Bible from bible-api.com
 *
 * API: https://bible-api.com/{book}+{chapter}?translation=kjv
 * Returns JSON with verses array.
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";

const DELAY_MS = 250; // polite delay between requests

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

async function scrapeChapter(
  bookName: string,
  bookNumber: number,
  chapter: number
): Promise<ScrapedChapter | null> {
  const query = encodeURIComponent(`${bookName} ${chapter}`);
  const url = `https://bible-api.com/${query}?translation=kjv`;

  try {
    const response = await fetch(url);
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
    console.error(`  ✗ Error fetching ${bookName} ${chapter}:`, err);
    return null;
  }
}

async function main() {
  console.log("🇬🇧 Scraping English KJV from bible-api.com...\n");

  let totalChapters = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const book of bookList) {
    console.log(`📖 ${book.name} (${book.chapters} chapters)`);

    for (let ch = 1; ch <= book.chapters; ch++) {
      const data = await scrapeChapter(book.bibleApiName, book.bookNumber, ch);

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
  }

  console.log(
    `\n✅ English KJV complete: ${successCount}/${totalChapters} chapters scraped (${errorCount} errors)`
  );
}

main().catch(console.error);

