/**
 * Scrape Norwegian Bible (NB 88/07) from les.norsk-bibel.no
 *
 * URL: https://les.norsk-bibel.no/index_reader.php?res={norskBibelCode}:{chapter}
 * HTML contains: <div class="verse N"><p ...><sup ...>N</sup>&nbsp;<span ...>TEXT</span></p></div>
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";

const DELAY_MS = 300;

function extractVerses(html: string): { verse: number; text: string }[] {
  const verses: { verse: number; text: string }[] = [];

  // Pattern: class="verse N"><p ...><sup ...>N</sup>&nbsp;<span ...>TEXT</span></p>
  const regex = /class="verse (\d+)"><p[^>]*><sup[^>]*>\d+<\/sup>&nbsp;<span[^>]*>(.*?)<\/span><\/p>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const verseNum = parseInt(match[1], 10);
    // Strip HTML tags from verse text
    let text = match[2].replace(/<[^>]+>/g, "").trim();
    // Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
      .trim();

    if (verseNum > 0 && text.length > 0) {
      verses.push({ verse: verseNum, text });
    }
  }

  return verses;
}

async function scrapeChapter(
  bookName: string,
  bookNumber: number,
  norskBibelCode: string,
  chapter: number
): Promise<ScrapedChapter | null> {
  const url = `https://les.norsk-bibel.no/index_reader.php?res=${norskBibelCode}:${chapter}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ✗ HTTP ${response.status} for ${bookName} ${chapter}`);
      return null;
    }

    // Read as buffer and decode as UTF-8 to preserve ø, å, æ
    const buffer = await response.arrayBuffer();
    const html = new TextDecoder("utf-8").decode(buffer);

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
  console.log("🇳🇴 Scraping Norwegian NB 88/07 from les.norsk-bibel.no...\n");

  let totalChapters = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const book of bookList) {
    console.log(`📖 ${book.name} (${book.chapters} chapters) [${book.norskBibelCode}]`);

    for (let ch = 1; ch <= book.chapters; ch++) {
      const data = await scrapeChapter(book.name, book.bookNumber, book.norskBibelCode, ch);

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
    `\n✅ Norwegian NB 88/07 complete: ${successCount}/${totalChapters} chapters scraped (${errorCount} errors)`
  );
}

main().catch(console.error);

