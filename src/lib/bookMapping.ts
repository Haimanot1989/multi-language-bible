/**
 * Complete mapping of all 66 Bible books with metadata for all 4 data sources.
 *
 * - bookNumber: used by Geez Experience API (Tigrinya) and Bolls.life (Norwegian)
 * - abbr3: 3-letter abbreviation for bible.org Amharic URL
 * - bibleApiName: name used by bible-api.com for English KJV
 * - chapters: total number of chapters in the book
 */

export interface BookInfo {
  name: string;
  aliases: string[];
  bookNumber: number;
  abbr3: string;
  bibleApiName: string;
  chapters: number;
}

export const books: BookInfo[] = [
  // --- Old Testament ---
  { name: "Genesis", aliases: ["gen", "ge", "gn"], bookNumber: 1, abbr3: "gen", bibleApiName: "genesis", chapters: 50 },
  { name: "Exodus", aliases: ["exo", "ex", "exod"], bookNumber: 2, abbr3: "exo", bibleApiName: "exodus", chapters: 40 },
  { name: "Leviticus", aliases: ["lev", "le", "lv"], bookNumber: 3, abbr3: "lev", bibleApiName: "leviticus", chapters: 27 },
  { name: "Numbers", aliases: ["num", "nu", "nm", "nb"], bookNumber: 4, abbr3: "num", bibleApiName: "numbers", chapters: 36 },
  { name: "Deuteronomy", aliases: ["deu", "de", "dt", "deut"], bookNumber: 5, abbr3: "deu", bibleApiName: "deuteronomy", chapters: 34 },
  { name: "Joshua", aliases: ["jos", "josh"], bookNumber: 6, abbr3: "jos", bibleApiName: "joshua", chapters: 24 },
  { name: "Judges", aliases: ["jdg", "judg", "jg"], bookNumber: 7, abbr3: "jdg", bibleApiName: "judges", chapters: 21 },
  { name: "Ruth", aliases: ["rut", "ru"], bookNumber: 8, abbr3: "rut", bibleApiName: "ruth", chapters: 4 },
  { name: "1 Samuel", aliases: ["1sa", "1sam", "1 sam"], bookNumber: 9, abbr3: "1sa", bibleApiName: "1 samuel", chapters: 31 },
  { name: "2 Samuel", aliases: ["2sa", "2sam", "2 sam"], bookNumber: 10, abbr3: "2sa", bibleApiName: "2 samuel", chapters: 24 },
  { name: "1 Kings", aliases: ["1ki", "1kgs", "1 kgs", "1 ki"], bookNumber: 11, abbr3: "1ki", bibleApiName: "1 kings", chapters: 22 },
  { name: "2 Kings", aliases: ["2ki", "2kgs", "2 kgs", "2 ki"], bookNumber: 12, abbr3: "2ki", bibleApiName: "2 kings", chapters: 25 },
  { name: "1 Chronicles", aliases: ["1ch", "1chr", "1 chr", "1 ch"], bookNumber: 13, abbr3: "1ch", bibleApiName: "1 chronicles", chapters: 29 },
  { name: "2 Chronicles", aliases: ["2ch", "2chr", "2 chr", "2 ch"], bookNumber: 14, abbr3: "2ch", bibleApiName: "2 chronicles", chapters: 36 },
  { name: "Ezra", aliases: ["ezr", "ez"], bookNumber: 15, abbr3: "ezr", bibleApiName: "ezra", chapters: 10 },
  { name: "Nehemiah", aliases: ["neh", "ne"], bookNumber: 16, abbr3: "neh", bibleApiName: "nehemiah", chapters: 13 },
  { name: "Esther", aliases: ["est", "esth"], bookNumber: 17, abbr3: "est", bibleApiName: "esther", chapters: 10 },
  { name: "Job", aliases: ["job", "jb"], bookNumber: 18, abbr3: "job", bibleApiName: "job", chapters: 42 },
  { name: "Psalms", aliases: ["psa", "ps", "psalm"], bookNumber: 19, abbr3: "psa", bibleApiName: "psalms", chapters: 150 },
  { name: "Proverbs", aliases: ["pro", "pr", "prov"], bookNumber: 20, abbr3: "pro", bibleApiName: "proverbs", chapters: 31 },
  { name: "Ecclesiastes", aliases: ["ecc", "ec", "eccl"], bookNumber: 21, abbr3: "ecc", bibleApiName: "ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", aliases: ["sol", "song", "sos", "ss", "sg"], bookNumber: 22, abbr3: "sol", bibleApiName: "song of solomon", chapters: 8 },
  { name: "Isaiah", aliases: ["isa", "is"], bookNumber: 23, abbr3: "isa", bibleApiName: "isaiah", chapters: 66 },
  { name: "Jeremiah", aliases: ["jer", "je", "jr"], bookNumber: 24, abbr3: "jer", bibleApiName: "jeremiah", chapters: 52 },
  { name: "Lamentations", aliases: ["lam", "la"], bookNumber: 25, abbr3: "lam", bibleApiName: "lamentations", chapters: 5 },
  { name: "Ezekiel", aliases: ["eze", "ezk", "ezek"], bookNumber: 26, abbr3: "eze", bibleApiName: "ezekiel", chapters: 48 },
  { name: "Daniel", aliases: ["dan", "da", "dn"], bookNumber: 27, abbr3: "dan", bibleApiName: "daniel", chapters: 12 },
  { name: "Hosea", aliases: ["hos", "ho"], bookNumber: 28, abbr3: "hos", bibleApiName: "hosea", chapters: 14 },
  { name: "Joel", aliases: ["joe", "jl", "joel"], bookNumber: 29, abbr3: "joe", bibleApiName: "joel", chapters: 3 },
  { name: "Amos", aliases: ["amo", "am", "amos"], bookNumber: 30, abbr3: "amo", bibleApiName: "amos", chapters: 9 },
  { name: "Obadiah", aliases: ["oba", "ob", "obad"], bookNumber: 31, abbr3: "oba", bibleApiName: "obadiah", chapters: 1 },
  { name: "Jonah", aliases: ["jon", "jnh"], bookNumber: 32, abbr3: "jon", bibleApiName: "jonah", chapters: 4 },
  { name: "Micah", aliases: ["mic", "mi"], bookNumber: 33, abbr3: "mic", bibleApiName: "micah", chapters: 7 },
  { name: "Nahum", aliases: ["nah", "na"], bookNumber: 34, abbr3: "nah", bibleApiName: "nahum", chapters: 3 },
  { name: "Habakkuk", aliases: ["hab", "hb"], bookNumber: 35, abbr3: "hab", bibleApiName: "habakkuk", chapters: 3 },
  { name: "Zephaniah", aliases: ["zep", "zph"], bookNumber: 36, abbr3: "zep", bibleApiName: "zephaniah", chapters: 3 },
  { name: "Haggai", aliases: ["hag", "hg"], bookNumber: 37, abbr3: "hag", bibleApiName: "haggai", chapters: 2 },
  { name: "Zechariah", aliases: ["zec", "zch", "zech"], bookNumber: 38, abbr3: "zec", bibleApiName: "zechariah", chapters: 14 },
  { name: "Malachi", aliases: ["mal", "ml"], bookNumber: 39, abbr3: "mal", bibleApiName: "malachi", chapters: 4 },

  // --- New Testament ---
  { name: "Matthew", aliases: ["mat", "mt", "matt"], bookNumber: 40, abbr3: "mat", bibleApiName: "matthew", chapters: 28 },
  { name: "Mark", aliases: ["mar", "mk", "mrk"], bookNumber: 41, abbr3: "mar", bibleApiName: "mark", chapters: 16 },
  { name: "Luke", aliases: ["luk", "lk", "lu"], bookNumber: 42, abbr3: "luk", bibleApiName: "luke", chapters: 24 },
  { name: "John", aliases: ["joh", "jn", "jhn"], bookNumber: 43, abbr3: "joh", bibleApiName: "john", chapters: 21 },
  { name: "Acts", aliases: ["act", "ac"], bookNumber: 44, abbr3: "act", bibleApiName: "acts", chapters: 28 },
  { name: "Romans", aliases: ["rom", "ro", "rm"], bookNumber: 45, abbr3: "rom", bibleApiName: "romans", chapters: 16 },
  { name: "1 Corinthians", aliases: ["1co", "1cor", "1 cor"], bookNumber: 46, abbr3: "1co", bibleApiName: "1 corinthians", chapters: 16 },
  { name: "2 Corinthians", aliases: ["2co", "2cor", "2 cor"], bookNumber: 47, abbr3: "2co", bibleApiName: "2 corinthians", chapters: 13 },
  { name: "Galatians", aliases: ["gal", "ga"], bookNumber: 48, abbr3: "gal", bibleApiName: "galatians", chapters: 6 },
  { name: "Ephesians", aliases: ["eph", "ep"], bookNumber: 49, abbr3: "eph", bibleApiName: "ephesians", chapters: 6 },
  { name: "Philippians", aliases: ["phi", "phil", "php"], bookNumber: 50, abbr3: "php", bibleApiName: "philippians", chapters: 4 },
  { name: "Colossians", aliases: ["col", "co"], bookNumber: 51, abbr3: "col", bibleApiName: "colossians", chapters: 4 },
  { name: "1 Thessalonians", aliases: ["1th", "1thess", "1 thess", "1 th"], bookNumber: 52, abbr3: "1th", bibleApiName: "1 thessalonians", chapters: 5 },
  { name: "2 Thessalonians", aliases: ["2th", "2thess", "2 thess", "2 th"], bookNumber: 53, abbr3: "2th", bibleApiName: "2 thessalonians", chapters: 3 },
  { name: "1 Timothy", aliases: ["1ti", "1tim", "1 tim", "1 ti"], bookNumber: 54, abbr3: "1ti", bibleApiName: "1 timothy", chapters: 6 },
  { name: "2 Timothy", aliases: ["2ti", "2tim", "2 tim", "2 ti"], bookNumber: 55, abbr3: "2ti", bibleApiName: "2 timothy", chapters: 4 },
  { name: "Titus", aliases: ["tit", "ti"], bookNumber: 56, abbr3: "tit", bibleApiName: "titus", chapters: 3 },
  { name: "Philemon", aliases: ["phm", "philem"], bookNumber: 57, abbr3: "phm", bibleApiName: "philemon", chapters: 1 },
  { name: "Hebrews", aliases: ["heb", "he"], bookNumber: 58, abbr3: "heb", bibleApiName: "hebrews", chapters: 13 },
  { name: "James", aliases: ["jam", "jas", "jm"], bookNumber: 59, abbr3: "jam", bibleApiName: "james", chapters: 5 },
  { name: "1 Peter", aliases: ["1pe", "1pet", "1 pet", "1 pe"], bookNumber: 60, abbr3: "1pe", bibleApiName: "1 peter", chapters: 5 },
  { name: "2 Peter", aliases: ["2pe", "2pet", "2 pet", "2 pe"], bookNumber: 61, abbr3: "2pe", bibleApiName: "2 peter", chapters: 3 },
  { name: "1 John", aliases: ["1jo", "1jn", "1 jn", "1 jo"], bookNumber: 62, abbr3: "1jo", bibleApiName: "1 john", chapters: 5 },
  { name: "2 John", aliases: ["2jo", "2jn", "2 jn", "2 jo"], bookNumber: 63, abbr3: "2jo", bibleApiName: "2 john", chapters: 1 },
  { name: "3 John", aliases: ["3jo", "3jn", "3 jn", "3 jo"], bookNumber: 64, abbr3: "3jo", bibleApiName: "3 john", chapters: 1 },
  { name: "Jude", aliases: ["jud", "jude"], bookNumber: 65, abbr3: "jud", bibleApiName: "jude", chapters: 1 },
  { name: "Revelation", aliases: ["rev", "re", "rv"], bookNumber: 66, abbr3: "rev", bibleApiName: "revelation", chapters: 22 },
];

/**
 * Find a book by name or alias (case-insensitive).
 */
export function findBook(query: string): BookInfo | undefined {
  const q = query.toLowerCase().trim();
  return books.find(
    (b) =>
      b.name.toLowerCase() === q ||
      b.aliases.some((a) => a === q) ||
      b.bibleApiName === q
  );
}

/**
 * Get a book by its number (1-66).
 */
export function getBookByNumber(num: number): BookInfo | undefined {
  return books.find((b) => b.bookNumber === num);
}

