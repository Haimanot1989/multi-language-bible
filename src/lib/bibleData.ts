/**
 * Bible data access layer.
 * Reads from local JSON files in /data/{lang}/{bookNumber}/{chapter}.json
 */

export interface VerseData {
  verse: number;
  text: string;
}

export interface ChapterData {
  book: string;
  bookNumber: number;
  chapter: number;
  verses: VerseData[];
}

export type Language = "en" | "no" | "ti" | "am";

export const languageLabels: Record<Language, string> = {
  no: "Norwegian",
  en: "English - KJV",
  ti: "Tigrinya",
  am: "Amharic",
};

export const languageOrder: Language[] = ["no", "en", "ti", "am"];

/**
 * Load a chapter from bundled JSON data.
 * Data is stored at: /data/{lang}/{bookNumber}/{chapter}.json
 */
export async function loadChapter(
  lang: Language,
  bookNumber: number,
  chapter: number
): Promise<ChapterData | null> {
  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const response = await fetch(`${base}/data/${lang}/${bookNumber}/${chapter}.json`);
    if (!response.ok) return null;
    return (await response.json()) as ChapterData;
  } catch {
    return null;
  }
}

/**
 * Get a specific verse (or range) from a chapter.
 */
export function getVerses(
  chapter: ChapterData,
  verseStart: number,
  verseEnd?: number
): VerseData[] {
  const end = verseEnd ?? verseStart;
  return chapter.verses.filter((v) => v.verse >= verseStart && v.verse <= end);
}

/**
 * Get verse text combined into a single string.
 */
export function getVerseText(
  chapter: ChapterData,
  verseStart: number,
  verseEnd?: number
): string {
  const verses = getVerses(chapter, verseStart, verseEnd);
  return verses.map((v) => v.text).join(" ");
}

