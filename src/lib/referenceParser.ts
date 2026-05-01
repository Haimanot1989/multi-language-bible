import { findBook, type BookInfo } from "./bookMapping";

export interface ParsedReference {
  book: BookInfo;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

/**
 * Parse a Bible reference string into structured data.
 *
 * Supported formats:
 *   "Psalms 15"
 *   "Psalms 2:7"
 *   "Psalms 2:7-10"
 *   "John 3:16"
 *   "1 Samuel 17:45"
 *   "gen 1:1"
 *   "psa 2:7"
 *
 * Returns null if the reference cannot be parsed.
 */
export function parseReference(input: string): ParsedReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match patterns like:
  // "1 Samuel 17", "1 Samuel 17:45-50", "Psalms 2:7", "gen 1:1"
  // Group 1: book name (may include leading number + space, e.g., "1 Samuel")
  // Group 2: chapter
  // Group 3: optional verse start
  // Group 4: optional verse end
  const match = trimmed.match(
    /^(\d?\s?[a-zA-Z\s]+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/
  );

  if (!match) return null;

  const bookQuery = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verseStart = match[3] ? parseInt(match[3], 10) : undefined;
  const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

  const book = findBook(bookQuery);
  if (!book) return null;

  // Validate chapter number
  if (chapter < 1 || chapter > book.chapters) return null;

  // Validate verse range only when verse input is provided
  if (verseStart !== undefined && verseStart < 1) return null;
  if (
    verseStart !== undefined &&
    verseEnd !== undefined &&
    verseEnd < verseStart
  ) {
    return null;
  }

  return { book, chapter, verseStart, verseEnd };
}

