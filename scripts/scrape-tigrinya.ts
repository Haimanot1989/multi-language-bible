/**
 * Scrape Tigrinya Bible from bible.geezexperience.com
 *
 * API: http://bible.geezexperience.com/server/list_api.php?language=tigrinya&book={bookNumber}&chapter={chapter}
 * Returns JSON array with { id, book, chapter, no, article, ... }
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";

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

async function scrapeChapter(
  bookName: string,
  bookNumber: number,
  chapter: number
): Promise<ScrapedChapter | null> {
  const url = `http://bible.geezexperience.com/server/list_api.php?language=tigrinya&book=${bookNumber}&chapter=${chapter}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ✗ HTTP ${response.status} for ${bookName} ${chapter}`);
      return null;
    }

    const data = (await response.json()) as GeezVerse[];

    if (!Array.isArray(data) || data.length === 0) {
      console.error(`  ✗ No verses for ${bookName} ${chapter}`);
      return null;
    }

    return {
      book: bookName,
      bookNumber,
      chapter,
      verses: data.map((v) => {
        const verse = parseInt(v.noStart, 10) || parseInt(v.no, 10);
        const noEnd = parseInt(v.noEnd, 10);
        return {
          verse,
          ...(noEnd > verse ? { verseEnd: noEnd } : {}),
          text: v.article.trim(),
        };
      }),
    };
  } catch (err) {
    console.error(`  ✗ Error fetching ${bookName} ${chapter}:`, err);
    return null;
  }
}

async function main() {
  console.log("🇪🇷 Scraping Tigrinya from bible.geezexperience.com...\n");

  let totalChapters = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const book of bookList) {
    console.log(`📖 ${book.name} (${book.chapters} chapters)`);

    for (let ch = 1; ch <= book.chapters; ch++) {
      const data = await scrapeChapter(book.name, book.bookNumber, ch);

      if (data) {
        saveChapter("ti", book.bookNumber, ch, data);
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
    `\n✅ Tigrinya complete: ${successCount}/${totalChapters} chapters scraped (${errorCount} errors)`
  );
}

main().catch(console.error);

