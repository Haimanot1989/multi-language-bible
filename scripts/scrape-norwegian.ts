/**
 * Scrape Norwegian Bokmål Bible from bolls.life
 *
 * API: https://bolls.life/get-text/NB/{bookNumber}/{chapter}/
 * Returns JSON array of { pk, verse, text, ... }
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";

const DELAY_MS = 250;

interface BollsVerse {
  pk: number;
  verse: number;
  text: string;
  chapter: number;
  book: number;
}

async function scrapeChapter(
  bookName: string,
  bookNumber: number,
  chapter: number
): Promise<ScrapedChapter | null> {
  const url = `https://bolls.life/get-text/NB/${bookNumber}/${chapter}/`;

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
        text: v.text.replace(/<[^>]*>/g, "").trim(), // strip any HTML tags
      })),
    };
  } catch (err) {
    console.error(`  ✗ Error fetching ${bookName} ${chapter}:`, err);
    return null;
  }
}

async function main() {
  console.log("🇳🇴 Scraping Norwegian Bokmål from bolls.life...\n");

  let totalChapters = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const book of bookList) {
    console.log(`📖 ${book.name} (${book.chapters} chapters)`);

    for (let ch = 1; ch <= book.chapters; ch++) {
      const data = await scrapeChapter(book.name, book.bookNumber, ch);

      if (data) {
        saveChapter("no", book.bookNumber, ch, data);
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
    `\n✅ Norwegian Bokmål complete: ${successCount}/${totalChapters} chapters scraped (${errorCount} errors)`
  );
}

main().catch(console.error);

