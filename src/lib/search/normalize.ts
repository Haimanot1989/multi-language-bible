import type { Language } from "../bibleData";

const ETHIOPIC_EQUIVALENT_SERIES = [
  ["ሀሁሂሃሄህሆ", "ሐሑሒሓሔሕሖ", "ኀኁኂኃኄኅኆ"],
  ["ሰሱሲሳሴስሶ", "ሠሡሢሣሤሥሦ"],
  ["አኡኢኣኤእኦ", "ዐዑዒዓዔዕዖ"],
  ["ቀቁቂቃቄቅቆ", "ቐቑቒቓቔቕቖ"],
  ["ከኩኪካኬክኮ", "ኸኹኺኻኼኽኾ"],
  ["ጸጹጺጻጼጽጾ", "ፀፁፂፃፄፅፆ"],
] as const;

const ETHIOPIC_FOLD_MAP = new Map<string, string>();

for (const seriesGroup of ETHIOPIC_EQUIVALENT_SERIES) {
  const canonicalSeries = Array.from(seriesGroup[0]);

  for (const series of seriesGroup) {
    Array.from(series).forEach((char, index) => {
      ETHIOPIC_FOLD_MAP.set(char, canonicalSeries[index] ?? char);
    });
  }
}

/**
 * Normalize text for word search based on language.
 * Removes punctuation, diacritics, and normalizes spacing.
 */
export function normalizeText(text: string, language: Language): string {
  if (language === "en" || language === "no") {
    return normalizeLatinScript(text);
  }

  if (language === "am" || language === "ti") {
    return normalizeEthiopicScript(text);
  }

  return text.toLowerCase().trim();
}

/**
 * Normalize Latin script (English, Norwegian).
 * - Convert to lowercase
 * - Remove diacritics (e.g., å → a, é → e)
 * - Remove punctuation
 * - Normalize whitespace
 * - Strip HTML/markup
 */
function normalizeLatinScript(text: string): string {
  // Strip HTML/markup (e.g., <sup>, </sup>)
  let normalized = text.replace(/<[^>]*>/g, "");

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Normalize diacritics (NFD: decompose, then remove combining marks)
  normalized = normalized
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  // Remove punctuation, keep only letters, numbers, and whitespace
  normalized = normalized.replace(/[^\p{L}\p{N}\s]/gu, "");

  // Normalize multiple spaces to single space
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Normalize Ethiopic script (Amharic, Tigrinya).
 * - Remove Ethiopic punctuation (e.g., |, ||, etc.)
 * - Normalize spacing
 * - Strip HTML/markup
 */
function normalizeEthiopicScript(text: string): string {
  // Strip HTML/markup
  let normalized = text.replace(/<[^>]*>/g, "").normalize("NFKC");

  // Fold commonly interchangeable Ethiopic letter families so searches are
  // resilient to orthographic variants across Amharic/Tigrinya sources.
  normalized = Array.from(normalized, (char) => ETHIOPIC_FOLD_MAP.get(char) ?? char).join("");

  // Remove punctuation/symbols/junk while keeping Ethiopic letters, digits,
  // and whitespace. This strips stray ASCII/HTML artifacts that can otherwise
  // create unusable shard keys and mismatched tokens.
  normalized = normalized.replace(/[^\p{Script=Ethiopic}\p{N}\s]/gu, "");

  // Normalize multiple spaces to single space
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Tokenize text into words/tokens.
 * Uses language-specific rules for splitting.
 */
export function tokenizeText(text: string, language: Language): string[] {
  const normalized = normalizeText(text, language);

  if (!normalized) return [];

  // For all languages, split on whitespace
  const tokens = normalized.split(/\s+/);

  // Filter out empty tokens and very short ones (< 2 chars)
  return tokens.filter((token) => token.length >= 2);
}

/**
 * Check if a query token matches a text token.
 * Supports exact match and prefix match.
 */
export function tokenMatches(
  queryToken: string,
  textToken: string,
  matchMode: "exact" | "prefix" = "exact"
): boolean {
  if (matchMode === "exact") {
    return queryToken === textToken;
  }

  // prefix match
  return textToken.startsWith(queryToken);
}

/**
 * Extract a snippet around matched tokens in the original text.
 * Returns the original text with some context around matched word(s).
 */
export function extractSnippet(
  text: string,
  query: string,
  contextWords: number = 5
): string {
  // Find the query string case-insensitively in the original text
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.substring(0, 100) + (text.length > 100 ? "..." : "");
  }

  // Try to expand around the found position to get context words
  const start = Math.max(0, index - contextWords * 8);
  const end = Math.min(text.length, index + query.length + contextWords * 8);

  let snippet = text.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

