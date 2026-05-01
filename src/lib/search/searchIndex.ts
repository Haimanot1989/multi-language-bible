import type { Language } from "../bibleData";
import { normalizeText, tokenizeText, tokenMatches } from "./normalize";

/**
 * A single entry in the inverted index.
 * Maps a normalized token to a list of verses containing it.
 */
export interface IndexEntry {
  token: string;
  verses: VerseRef[];
}

/**
 * Reference to a verse containing a token.
 */
export interface VerseRef {
  bookNumber: number;
  chapter: number;
  verse: number;
}

/**
 * Search result for a single verse.
 */
export interface SearchResultVerse {
  bookNumber: number;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Grouped search results by chapter.
 */
export interface SearchResultChapter {
  bookNumber: number;
  chapter: number;
  verses: SearchResultVerse[];
}

/**
 * Complete search result set.
 */
export interface WordSearchResult {
  query: string;
  language: Language;
  totalHits: number;
  results: SearchResultChapter[];
}

/**
 * The complete search index for a language.
 */
export interface SearchIndex {
  language: Language;
  entries: Record<string, VerseRef[]>; // token -> [verse refs]
  metadata: {
    totalTokens: number;
    totalVerses: number;
    buildTime: string;
  };
}

interface SearchIndexManifest {
  language: Language;
  metadata: {
    totalTokens: number;
    totalVerses: number;
    buildTime: string;
    totalShards: number;
  };
  shardFiles: Record<string, string>;
}

interface SearchIndexShard {
  entries: Record<string, VerseRef[]>;
}

/**
 * Loaded search indexes per language.
 */
const loadedIndexes = new Map<Language, SearchIndex | null>();
const loadedManifests = new Map<Language, SearchIndexManifest | null>();
const loadedShardEntries = new Map<Language, Map<string, Record<string, VerseRef[]>>>();
const chapterTextCache = new Map<string, Map<number, string>>();
const normalizedTokenCache = new Map<Language, Map<string, string>>();

function getShardKey(token: string): string {
  if (!token) return "_";
  const firstChar = Array.from(token)[0];
  return firstChar || "_";
}

function getNormalizedToken(token: string, language: Language): string {
  if (!normalizedTokenCache.has(language)) {
    normalizedTokenCache.set(language, new Map());
  }

  const perLanguageCache = normalizedTokenCache.get(language)!;
  const cached = perLanguageCache.get(token);
  if (cached !== undefined) {
    return cached;
  }

  const normalized = normalizeText(token, language);
  perLanguageCache.set(token, normalized);
  return normalized;
}

function getCandidateShardKeys(
  language: Language,
  queryToken: string,
  manifest: SearchIndexManifest
): string[] {
  const primaryShardKey = getShardKey(queryToken);
  const normalizedPrimaryShardKey = getNormalizedToken(primaryShardKey, language);
  const candidateShardKeys = new Set<string>([primaryShardKey]);

  if (language === "am" || language === "ti") {
    for (const shardKey of Object.keys(manifest.shardFiles)) {
      if (getNormalizedToken(shardKey, language) === normalizedPrimaryShardKey) {
        candidateShardKeys.add(shardKey);
      }
    }
  }

  return Array.from(candidateShardKeys);
}

async function loadChapterVerseTextMap(
  language: Language,
  bookNumber: number,
  chapter: number
): Promise<Map<number, string>> {
  const key = `${language}/${bookNumber}/${chapter}`;
  if (chapterTextCache.has(key)) {
    return chapterTextCache.get(key)!;
  }

  const versesByNumber = new Map<number, string>();

  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/data/${language}/${bookNumber}/${chapter}.json`);
    if (!response.ok) {
      chapterTextCache.set(key, versesByNumber);
      return versesByNumber;
    }

    const chapterData = (await response.json()) as {
      verses?: Array<{ verse: number; text: string }>;
    };

    for (const verse of chapterData.verses ?? []) {
      versesByNumber.set(verse.verse, verse.text);
    }
  } catch {
    // Keep an empty map as cache fallback for missing/failed chapter loads.
  }

  chapterTextCache.set(key, versesByNumber);
  return versesByNumber;
}

/**
 * Load search index for a language.
 * Fetches the prebuilt JSON from public/search-index/{lang}.json
 */
export async function loadSearchIndex(language: Language): Promise<SearchIndex | null> {
  if (loadedIndexes.has(language)) {
    return loadedIndexes.get(language) ?? null;
  }

  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/search-index/${language}.json`);
    if (!response.ok) {
      loadedIndexes.set(language, null);
      return null;
    }
    const index = (await response.json()) as SearchIndex;
    loadedIndexes.set(language, index);
    return index;
  } catch (err) {
    console.error(`Failed to load search index for ${language}:`, err);
    loadedIndexes.set(language, null);
    return null;
  }
}

async function loadSearchManifest(language: Language): Promise<SearchIndexManifest | null> {
  if (loadedManifests.has(language)) {
    return loadedManifests.get(language) ?? null;
  }

  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/search-index/${language}/manifest.json`);
    if (!response.ok) {
      loadedManifests.set(language, null);
      return null;
    }

    const manifest = (await response.json()) as SearchIndexManifest;
    loadedManifests.set(language, manifest);
    return manifest;
  } catch {
    loadedManifests.set(language, null);
    return null;
  }
}

async function loadShardEntries(
  language: Language,
  shardKey: string,
  manifest: SearchIndexManifest
): Promise<Record<string, VerseRef[]>> {
  if (!loadedShardEntries.has(language)) {
    loadedShardEntries.set(language, new Map());
  }

  const perLanguageShardCache = loadedShardEntries.get(language)!;
  if (perLanguageShardCache.has(shardKey)) {
    return perLanguageShardCache.get(shardKey)!;
  }

  const relativeShardPath = manifest.shardFiles[shardKey];
  if (!relativeShardPath) {
    perLanguageShardCache.set(shardKey, {});
    return {};
  }

  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/search-index/${language}/${relativeShardPath}`);
    if (!response.ok) {
      perLanguageShardCache.set(shardKey, {});
      return {};
    }

    const shard = (await response.json()) as SearchIndexShard;
    const shardEntries = shard.entries ?? {};
    perLanguageShardCache.set(shardKey, shardEntries);
    return shardEntries;
  } catch {
    perLanguageShardCache.set(shardKey, {});
    return {};
  }
}

async function loadEntriesForQueryToken(
  language: Language,
  queryToken: string
): Promise<Record<string, VerseRef[]> | null> {
  const manifest = await loadSearchManifest(language);
  if (manifest) {
    const candidateShardKeys = getCandidateShardKeys(language, queryToken, manifest);
    const candidateShardEntries = await Promise.all(
      candidateShardKeys.map((shardKey) => loadShardEntries(language, shardKey, manifest))
    );

    return Object.assign({}, ...candidateShardEntries);
  }

  const fallbackIndex = await loadSearchIndex(language);
  return fallbackIndex?.entries ?? null;
}

/**
 * Search for a word/phrase in a language's index.
 * Returns aggregated results grouped by chapter.
 */
export async function wordSearch(
  query: string,
  language: Language
): Promise<WordSearchResult> {
  // Normalize and tokenize the query
  const normalizedQuery = normalizeText(query, language);
  const queryTokens = tokenizeText(normalizedQuery, language);

  if (queryTokens.length === 0) {
    return {
      query,
      language,
      totalHits: 0,
      results: [],
    };
  }

  // Find verses containing all query tokens (AND search)
  let matchingVerses: Set<string> | null = null;

  for (const queryToken of queryTokens) {
    const entries = await loadEntriesForQueryToken(language, queryToken);
    if (!entries) {
      return {
        query,
        language,
        totalHits: 0,
        results: [],
      };
    }

    const versesForToken = new Set<string>();
    const normalizedQueryToken = getNormalizedToken(queryToken, language);

    // Search for exact and prefix matches only in the relevant shard.
    for (const [indexedToken, refs] of Object.entries(entries)) {
      const normalizedIndexedToken = getNormalizedToken(indexedToken, language);

      if (
        tokenMatches(normalizedQueryToken, normalizedIndexedToken, "exact") ||
        tokenMatches(normalizedQueryToken, normalizedIndexedToken, "prefix")
      ) {
        for (const ref of refs) {
          const key = `${ref.bookNumber}:${ref.chapter}:${ref.verse}`;
          versesForToken.add(key);
        }
      }
    }

    if (matchingVerses === null) {
      matchingVerses = versesForToken;
    } else {
      // Intersect with results so far (AND logic)
      matchingVerses = new Set(
        Array.from(matchingVerses as Set<string>).filter((verseRefKey: string) =>
          versesForToken.has(verseRefKey)
        )
      );
    }

    if (matchingVerses.size === 0) {
      // No matches for this token, whole search is empty
      return {
        query,
        language,
        totalHits: 0,
        results: [],
      };
    }
  }

  if (!matchingVerses || matchingVerses.size === 0) {
    return {
      query,
      language,
      totalHits: 0,
      results: [],
    };
  }

  // Preload only the chapters that contain matches so we can return full verse text.
  const chapterKeys = new Set<string>();
  for (const verseKey of matchingVerses) {
    const [bookNumberStr, chapterStr] = verseKey.split(":");
    chapterKeys.add(`${bookNumberStr}:${chapterStr}`);
  }

  const chapterTextMaps = new Map<string, Map<number, string>>();
  await Promise.all(
    Array.from(chapterKeys).map(async (chapterKey) => {
      const [bookNumberStr, chapterStr] = chapterKey.split(":");
      const bookNumber = parseInt(bookNumberStr, 10);
      const chapter = parseInt(chapterStr, 10);
      const verseMap = await loadChapterVerseTextMap(language, bookNumber, chapter);
      chapterTextMaps.set(chapterKey, verseMap);
    })
  );

  // Group results by chapter
  const byChapter = new Map<string, SearchResultChapter>();

  for (const verseKey of matchingVerses) {
    const [bookNumberStr, chapterStr, verseStr] = verseKey.split(":");
    const bookNumber = parseInt(bookNumberStr, 10);
    const chapter = parseInt(chapterStr, 10);
    const verse = parseInt(verseStr, 10);
    const chapterKey = `${bookNumber}:${chapter}`;

    if (!byChapter.has(chapterKey)) {
      byChapter.set(chapterKey, {
        bookNumber,
        chapter,
        verses: [],
      });
    }

    const chapterVerseMap = chapterTextMaps.get(chapterKey);
    const verseText = chapterVerseMap?.get(verse) ?? "";

    byChapter
      .get(chapterKey)!
      .verses.push({
        bookNumber,
        chapter,
        verse,
        text: verseText,
      });
  }

  // Sort results by chapter and verse
  const results = Array.from(byChapter.values()).sort((a, b) => {
    if (a.bookNumber !== b.bookNumber) return a.bookNumber - b.bookNumber;
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return 0;
  });

  for (const chapter of results) {
    chapter.verses.sort((a, b) => {
      if (a.bookNumber !== b.bookNumber) return a.bookNumber - b.bookNumber;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });
  }

  return {
    query,
    language,
    totalHits: matchingVerses.size,
    results,
  };
}

/**
 * Search across multiple languages.
 */
export async function multiLanguageWordSearch(
  query: string,
  languages: Language[]
): Promise<Map<Language, WordSearchResult>> {
  const results = new Map<Language, WordSearchResult>();

  const searches = languages.map(async (lang) => {
    const result = await wordSearch(query, lang);
    results.set(lang, result);
  });

  await Promise.all(searches);

  return results;
}

/**
 * Clear all loaded indexes (useful for testing or cache clearing).
 */
export function clearIndexCache(): void {
  loadedIndexes.clear();
  loadedManifests.clear();
  loadedShardEntries.clear();
  chapterTextCache.clear();
  normalizedTokenCache.clear();
}

