/**
 * Re-scrape only the specific chapters that still have gaps,
 * using the corrected noStart/noEnd parsing.
 */
import { bookList, saveChapter, sleep, type ScrapedChapter } from "./utils.js";
import * as fs from "fs";

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

const chaptersToFix = [
  { lang: "am", apiLang: "amharic", book: 49, chapter: 5 },
  { lang: "ti", apiLang: "tigrinya", book: 18, chapter: 34 },
  { lang: "ti", apiLang: "tigrinya", book: 19, chapter: 37 },
  { lang: "ti", apiLang: "tigrinya", book: 19, chapter: 71 },
  { lang: "ti", apiLang: "tigrinya", book: 20, chapter: 7 },
  { lang: "ti", apiLang: "tigrinya", book: 66, chapter: 21 },
];

async function main() {
  const results: string[] = [];

  for (const ch of chaptersToFix) {
    const bookInfo = bookList.find((b) => b.bookNumber === ch.book);
    if (!bookInfo) continue;

    const url = `http://bible.geezexperience.com/server/list_api.php?language=${ch.apiLang}&book=${ch.book}&chapter=${ch.chapter}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as GeezVerse[];

      const verses = data.map((v) => {
        const verse = parseInt(v.noStart, 10) || parseInt(v.no, 10);
        const noEnd = parseInt(v.noEnd, 10);
        return {
          verse,
          ...(noEnd > verse ? { verseEnd: noEnd } : {}),
          text: v.article.trim(),
        };
      });

      const chapterData: ScrapedChapter = {
        book: bookInfo.name,
        bookNumber: ch.book,
        chapter: ch.chapter,
        verses,
      };
      saveChapter(ch.lang, ch.book, ch.chapter, chapterData);

      const combined = verses.filter((v) => v.verseEnd).length;
      results.push(`✓ ${ch.lang}/${ch.book}/${ch.chapter} — ${verses.length} verses, ${combined} combined`);
    } catch (err) {
      results.push(`✗ ${ch.lang}/${ch.book}/${ch.chapter} — ERROR: ${err}`);
    }

    await sleep(300);
  }

  fs.writeFileSync("scripts/fix6-report.txt", results.join("\n"), "utf-8");
}

main();

