/**
 * Scrape Amharic Bible from bible.org
 *
 * URL pattern: https://bible.org/sites/bible.org/resources/foreign/amharic/{abbr3}-{chapter}.htm
 * - abbr3: 3-letter book abbreviation (e.g., "joh", "psa", "mat")
 * - chapter: zero-padded for < 10 (e.g., "07")
 * - Special: Philippians uses "php" instead of "phi"
 *
 * HTML page contains verses as text that needs to be parsed.
 */
import { parse as parseHTML } from "node-html-parser";
import { bookList, saveChapter, sleep, type ScrapedChapter, type ScrapedVerse } from "./utils.js";

const DELAY_MS = 300;

function padChapter(ch: number): string {
  return ch < 10 ? `0${ch}` : String(ch);
}

function extractVerses(html: string): ScrapedVerse[] {
  const root = parseHTML(html);
  const verses: ScrapedVerse[] = [];

  // The bible.org Amharic pages have the text content in the body.
  // Verses are typically numbered with patterns like "1 ", "2 ", etc.
  // Let's try to get all text content and split by verse numbers.

  // Try to find the main content area
  const body = root.querySelector("body");
  if (!body) return verses;

  const text = body.text.trim();

  // Try to split by verse numbers: look for patterns like "1 text 2 text 3 text"
  // Verse numbers in Amharic pages appear as standalone numbers
  const verseMatches = text.match(/(\d+)\s+([^\d]+)/g);

  if (verseMatches) {
    for (const match of verseMatches) {
      const m = match.match(/^(\d+)\s+(.+)$/s);
      if (m) {
        const verseNum = parseInt(m[1], 10);
        const verseText = m[2].trim();
        if (verseNum > 0 && verseText.length > 0) {
          verses.push({ verse: verseNum, text: verseText });
        }
      }
    }
  }

  // Deduplicate and sort by verse number
  const seen = new Set<number>();
  const uniqueVerses: ScrapedVerse[] = [];
  for (const v of verses) {
    if (!seen.has(v.verse)) {
      seen.add(v.verse);
      uniqueVerses.push(v);
    }
  }

  return uniqueVerses.sort((a, b) => a.verse - b.verse);
}

async function scrapeChapter(
  bookName: string,
  bookNumber: number,
  abbr3: string,
  chapter: number
): Promise<ScrapedChapter | null> {
  const chapterStr = padChapter(chapter);
  const url = `https://bible.org/sites/bible.org/resources/foreign/amharic/${abbr3}-${chapterStr}.htm`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ✗ HTTP ${response.status} for ${bookName} ${chapter} (${url})`);
      return null;
    }

    const html = await response.text();
    const verses = extractVerses(html);

    if (verses.length === 0) {
      console.error(`  ✗ No verses parsed for ${bookName} ${chapter}`);
      return null;
    }

    return {
      book: bookName,
      bookNumber,
      chapter,
      verses,
    };
  } catch (err) {
    console.error(`  ✗ Error fetching ${bookName} ${chapter}:`, err);
    return null;
  }
}

async function main() {
  console.log("🇪🇹 Scraping Amharic from bible.org...\n");

  let totalChapters = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const book of bookList) {
    console.log(`📖 ${book.name} (${book.chapters} chapters) [${book.abbr3}]`);

    for (let ch = 1; ch <= book.chapters; ch++) {
      const data = await scrapeChapter(book.name, book.bookNumber, book.abbr3, ch);

      if (data) {
        saveChapter("am", book.bookNumber, ch, data);
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
    `\n✅ Amharic complete: ${successCount}/${totalChapters} chapters scraped (${errorCount} errors)`
  );
}

main().catch(console.error);

