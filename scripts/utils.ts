import * as fs from "fs";
import * as path from "path";

export interface ScrapedVerse {
  verse: number;
  verseEnd?: number;
  text: string;
}

export interface ScrapedChapter {
  book: string;
  bookNumber: number;
  chapter: number;
  verses: ScrapedVerse[];
}

/**
 * Save a chapter's data as JSON to the data directory.
 */
export function saveChapter(
  lang: string,
  bookNumber: number,
  chapter: number,
  data: ScrapedChapter
): void {
  const dir = path.join("public", "data", lang, String(bookNumber));
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${chapter}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Sleep for a given number of milliseconds (polite delay between requests).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Book metadata — matches bookMapping.ts but standalone for scripts.
 */
export const bookList = [
  { name: "Genesis", bookNumber: 1, abbr3: "gen", bibleApiName: "genesis", norskBibelCode: "gen", chapters: 50 },
  { name: "Exodus", bookNumber: 2, abbr3: "exo", bibleApiName: "exodus", norskBibelCode: "exod", chapters: 40 },
  { name: "Leviticus", bookNumber: 3, abbr3: "lev", bibleApiName: "leviticus", norskBibelCode: "lev", chapters: 27 },
  { name: "Numbers", bookNumber: 4, abbr3: "num", bibleApiName: "numbers", norskBibelCode: "num", chapters: 36 },
  { name: "Deuteronomy", bookNumber: 5, abbr3: "deu", bibleApiName: "deuteronomy", norskBibelCode: "deut", chapters: 34 },
  { name: "Joshua", bookNumber: 6, abbr3: "jos", bibleApiName: "joshua", norskBibelCode: "josh", chapters: 24 },
  { name: "Judges", bookNumber: 7, abbr3: "jdg", bibleApiName: "judges", norskBibelCode: "judg", chapters: 21 },
  { name: "Ruth", bookNumber: 8, abbr3: "rut", bibleApiName: "ruth", norskBibelCode: "ruth", chapters: 4 },
  { name: "1 Samuel", bookNumber: 9, abbr3: "1sa", bibleApiName: "1 samuel", norskBibelCode: "1sam", chapters: 31 },
  { name: "2 Samuel", bookNumber: 10, abbr3: "2sa", bibleApiName: "2 samuel", norskBibelCode: "2sam", chapters: 24 },
  { name: "1 Kings", bookNumber: 11, abbr3: "1ki", bibleApiName: "1 kings", norskBibelCode: "1kgs", chapters: 22 },
  { name: "2 Kings", bookNumber: 12, abbr3: "2ki", bibleApiName: "2 kings", norskBibelCode: "2kgs", chapters: 25 },
  { name: "1 Chronicles", bookNumber: 13, abbr3: "1ch", bibleApiName: "1 chronicles", norskBibelCode: "1chr", chapters: 29 },
  { name: "2 Chronicles", bookNumber: 14, abbr3: "2ch", bibleApiName: "2 chronicles", norskBibelCode: "2chr", chapters: 36 },
  { name: "Ezra", bookNumber: 15, abbr3: "ezr", bibleApiName: "ezra", norskBibelCode: "ezra", chapters: 10 },
  { name: "Nehemiah", bookNumber: 16, abbr3: "neh", bibleApiName: "nehemiah", norskBibelCode: "neh", chapters: 13 },
  { name: "Esther", bookNumber: 17, abbr3: "est", bibleApiName: "esther", norskBibelCode: "esth", chapters: 10 },
  { name: "Job", bookNumber: 18, abbr3: "job", bibleApiName: "job", norskBibelCode: "job", chapters: 42 },
  { name: "Psalms", bookNumber: 19, abbr3: "psa", bibleApiName: "psalms", norskBibelCode: "ps", chapters: 150 },
  { name: "Proverbs", bookNumber: 20, abbr3: "pro", bibleApiName: "proverbs", norskBibelCode: "prov", chapters: 31 },
  { name: "Ecclesiastes", bookNumber: 21, abbr3: "ecc", bibleApiName: "ecclesiastes", norskBibelCode: "eccl", chapters: 12 },
  { name: "Song of Solomon", bookNumber: 22, abbr3: "sol", bibleApiName: "song of solomon", norskBibelCode: "song", chapters: 8 },
  { name: "Isaiah", bookNumber: 23, abbr3: "isa", bibleApiName: "isaiah", norskBibelCode: "isa", chapters: 66 },
  { name: "Jeremiah", bookNumber: 24, abbr3: "jer", bibleApiName: "jeremiah", norskBibelCode: "jer", chapters: 52 },
  { name: "Lamentations", bookNumber: 25, abbr3: "lam", bibleApiName: "lamentations", norskBibelCode: "lam", chapters: 5 },
  { name: "Ezekiel", bookNumber: 26, abbr3: "eze", bibleApiName: "ezekiel", norskBibelCode: "ezek", chapters: 48 },
  { name: "Daniel", bookNumber: 27, abbr3: "dan", bibleApiName: "daniel", norskBibelCode: "dan", chapters: 12 },
  { name: "Hosea", bookNumber: 28, abbr3: "hos", bibleApiName: "hosea", norskBibelCode: "hos", chapters: 14 },
  { name: "Joel", bookNumber: 29, abbr3: "joe", bibleApiName: "joel", norskBibelCode: "joel", chapters: 3 },
  { name: "Amos", bookNumber: 30, abbr3: "amo", bibleApiName: "amos", norskBibelCode: "amos", chapters: 9 },
  { name: "Obadiah", bookNumber: 31, abbr3: "oba", bibleApiName: "obadiah", norskBibelCode: "obad", chapters: 1 },
  { name: "Jonah", bookNumber: 32, abbr3: "jon", bibleApiName: "jonah", norskBibelCode: "jonah", chapters: 4 },
  { name: "Micah", bookNumber: 33, abbr3: "mic", bibleApiName: "micah", norskBibelCode: "mic", chapters: 7 },
  { name: "Nahum", bookNumber: 34, abbr3: "nah", bibleApiName: "nahum", norskBibelCode: "nah", chapters: 3 },
  { name: "Habakkuk", bookNumber: 35, abbr3: "hab", bibleApiName: "habakkuk", norskBibelCode: "hab", chapters: 3 },
  { name: "Zephaniah", bookNumber: 36, abbr3: "zep", bibleApiName: "zephaniah", norskBibelCode: "zeph", chapters: 3 },
  { name: "Haggai", bookNumber: 37, abbr3: "hag", bibleApiName: "haggai", norskBibelCode: "hag", chapters: 2 },
  { name: "Zechariah", bookNumber: 38, abbr3: "zec", bibleApiName: "zechariah", norskBibelCode: "zech", chapters: 14 },
  { name: "Malachi", bookNumber: 39, abbr3: "mal", bibleApiName: "malachi", norskBibelCode: "mal", chapters: 4 },
  { name: "Matthew", bookNumber: 40, abbr3: "mat", bibleApiName: "matthew", norskBibelCode: "matt", chapters: 28 },
  { name: "Mark", bookNumber: 41, abbr3: "mar", bibleApiName: "mark", norskBibelCode: "mark", chapters: 16 },
  { name: "Luke", bookNumber: 42, abbr3: "luk", bibleApiName: "luke", norskBibelCode: "luke", chapters: 24 },
  { name: "John", bookNumber: 43, abbr3: "joh", bibleApiName: "john", norskBibelCode: "john", chapters: 21 },
  { name: "Acts", bookNumber: 44, abbr3: "act", bibleApiName: "acts", norskBibelCode: "acts", chapters: 28 },
  { name: "Romans", bookNumber: 45, abbr3: "rom", bibleApiName: "romans", norskBibelCode: "rom", chapters: 16 },
  { name: "1 Corinthians", bookNumber: 46, abbr3: "1co", bibleApiName: "1 corinthians", norskBibelCode: "1cor", chapters: 16 },
  { name: "2 Corinthians", bookNumber: 47, abbr3: "2co", bibleApiName: "2 corinthians", norskBibelCode: "2cor", chapters: 13 },
  { name: "Galatians", bookNumber: 48, abbr3: "gal", bibleApiName: "galatians", norskBibelCode: "gal", chapters: 6 },
  { name: "Ephesians", bookNumber: 49, abbr3: "eph", bibleApiName: "ephesians", norskBibelCode: "eph", chapters: 6 },
  { name: "Philippians", bookNumber: 50, abbr3: "php", bibleApiName: "philippians", norskBibelCode: "phil", chapters: 4 },
  { name: "Colossians", bookNumber: 51, abbr3: "col", bibleApiName: "colossians", norskBibelCode: "col", chapters: 4 },
  { name: "1 Thessalonians", bookNumber: 52, abbr3: "1th", bibleApiName: "1 thessalonians", norskBibelCode: "1thess", chapters: 5 },
  { name: "2 Thessalonians", bookNumber: 53, abbr3: "2th", bibleApiName: "2 thessalonians", norskBibelCode: "2thess", chapters: 3 },
  { name: "1 Timothy", bookNumber: 54, abbr3: "1ti", bibleApiName: "1 timothy", norskBibelCode: "1tim", chapters: 6 },
  { name: "2 Timothy", bookNumber: 55, abbr3: "2ti", bibleApiName: "2 timothy", norskBibelCode: "2tim", chapters: 4 },
  { name: "Titus", bookNumber: 56, abbr3: "tit", bibleApiName: "titus", norskBibelCode: "titus", chapters: 3 },
  { name: "Philemon", bookNumber: 57, abbr3: "phm", bibleApiName: "philemon", norskBibelCode: "phlm", chapters: 1 },
  { name: "Hebrews", bookNumber: 58, abbr3: "heb", bibleApiName: "hebrews", norskBibelCode: "heb", chapters: 13 },
  { name: "James", bookNumber: 59, abbr3: "jam", bibleApiName: "james", norskBibelCode: "jas", chapters: 5 },
  { name: "1 Peter", bookNumber: 60, abbr3: "1pe", bibleApiName: "1 peter", norskBibelCode: "1pet", chapters: 5 },
  { name: "2 Peter", bookNumber: 61, abbr3: "2pe", bibleApiName: "2 peter", norskBibelCode: "2pet", chapters: 3 },
  { name: "1 John", bookNumber: 62, abbr3: "1jo", bibleApiName: "1 john", norskBibelCode: "1john", chapters: 5 },
  { name: "2 John", bookNumber: 63, abbr3: "2jo", bibleApiName: "2 john", norskBibelCode: "2john", chapters: 1 },
  { name: "3 John", bookNumber: 64, abbr3: "3jo", bibleApiName: "3 john", norskBibelCode: "3john", chapters: 1 },
  { name: "Jude", bookNumber: 65, abbr3: "jud", bibleApiName: "jude", norskBibelCode: "jude", chapters: 1 },
  { name: "Revelation", bookNumber: 66, abbr3: "rev", bibleApiName: "revelation", norskBibelCode: "rev", chapters: 22 },
];

