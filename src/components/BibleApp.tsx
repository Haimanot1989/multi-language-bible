import { useState, useCallback, useEffect, useRef } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { VerseSearch } from "./VerseSearch";
import { VerseDisplay } from "./VerseDisplay";
import { WordSearchResults } from "./WordSearchResults";
import { parseReference } from "../lib/referenceParser";
import { findBook } from "../lib/bookMapping";
import type { Language } from "../lib/bibleData";
import { getLocalizedBookName } from "../lib/localizedBookNames";
import { wordSearch } from "../lib/search/searchIndex";
import type { WordSearchResult } from "../lib/search/searchIndex";

export interface VerseEntry {
  verse: number;
  verseEnd?: number;
  text: string;
}

export interface VerseResult {
  language: Language;
  label: string;
  text: string | null;
  isGeez: boolean;
  versesData?: VerseEntry[];
}

export interface SearchResult {
  reference: string;
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  verses: VerseResult[];
}

const languageConfig: { lang: Language; label: string; isGeez: boolean }[] = [
  { lang: "no", label: "Norwegian NB 87/07", isGeez: false },
  { lang: "en", label: "English - KJV", isGeez: false },
  { lang: "ti", label: "Tigrinya", isGeez: true },
  { lang: "am", label: "Amharic", isGeez: true },
];

// Simple in-memory cache for chapter data
const chapterCache = new Map<string, any>();
const CACHE_VERSION = "v2";

async function fetchChapter(lang: string, bookNumber: number, chapter: number) {
  const key = `${lang}/${bookNumber}/${chapter}`;
  if (chapterCache.has(key)) {
    return chapterCache.get(key);
  }

  // Also check localStorage
  try {
    const cached = localStorage.getItem(`bible:${CACHE_VERSION}:${key}`);
    if (cached) {
      const data = JSON.parse(cached);
      chapterCache.set(key, data);
      return data;
    }
  } catch { /* ignore */ }

  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const response = await fetch(`${base}/data/${lang}/${bookNumber}/${chapter}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    chapterCache.set(key, data);
    try {
      localStorage.setItem(`bible:${CACHE_VERSION}:${key}`, JSON.stringify(data));
    } catch { /* localStorage full, ignore */ }
    return data;
  } catch {
    return null;
  }
}

interface UrlReference {
  bookName: string;
  bookNumber: number;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  selectedLanguages?: Language[];
}

interface UrlWordSearch {
  query: string;
  language: Language;
}

type UrlSearchState =
  | { type: "verse"; value: UrlReference }
  | { type: "word"; value: UrlWordSearch };

function isLanguage(value: string | null | undefined): value is Language {
  return value === "no" || value === "en" || value === "ti" || value === "am";
}

function normalizeSelectedLanguages(
  languages: Array<Language | null | undefined> | null | undefined
): Language[] | null {
  if (!languages || languages.length === 0) return null;

  const languageSet = new Set(languages.filter(isLanguage));
  const uniqueOrdered = languageConfig
    .map((config) => config.lang)
    .filter((lang) => languageSet.has(lang));

  if (uniqueOrdered.length === 0 || uniqueOrdered.length === languageConfig.length) {
    return null;
  }

  return uniqueOrdered;
}

function getPathSegmentsFromLocation(location: Location): string[] {
  const base = import.meta.env.BASE_URL;
  const baseSegments = base.split("/").filter(Boolean);
  const segments = location.pathname.split("/").filter(Boolean);

  if (baseSegments.length > 0) {
    const hasBasePrefix = baseSegments.every(
      (segment, index) => segments[index] === segment
    );
    if (hasBasePrefix) {
      return segments.slice(baseSegments.length);
    }
  }

  return segments;
}

function parseUrlReference(location: Location): UrlReference | null {
  const segments = getPathSegmentsFromLocation(location);
  if (segments.length < 2) return null;

  const [bookSlug, chapterText] = segments;
  const chapter = parseInt(chapterText, 10);
  if (!bookSlug || Number.isNaN(chapter)) return null;

  const params = new URLSearchParams(location.search);
  const verseParam = params.get("v")?.trim();
  const langParam = params.get("lang")?.trim();
  const reference = verseParam
    ? `${bookSlug} ${chapter}:${verseParam}`
    : `${bookSlug} ${chapter}`;

  const parsed = parseReference(reference);
  if (!parsed) return null;

  return {
    bookName: parsed.book.name,
    bookNumber: parsed.book.bookNumber,
    chapter: parsed.chapter,
    verseStart: parsed.verseStart,
    verseEnd: parsed.verseEnd,
    selectedLanguages: normalizeSelectedLanguages(
      langParam?.split(",").map((lang) => lang.trim()).filter(isLanguage)
    ) ?? undefined,
  };
}

function parseUrlWordSearch(location: Location): UrlWordSearch | null {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode")?.trim();
  const query = params.get("q")?.trim();
  const languageParam = params.get("wl")?.trim();

  if (mode !== "word" || !query) {
    return null;
  }

  return {
    query,
    language: isLanguage(languageParam) ? languageParam : "en",
  };
}

function parseUrlSearchState(location: Location): UrlSearchState | null {
  const wordSearch = parseUrlWordSearch(location);
  if (wordSearch) {
    return { type: "word", value: wordSearch };
  }

  const verseSearch = parseUrlReference(location);
  if (verseSearch) {
    return { type: "verse", value: verseSearch };
  }

  return null;
}

function buildSearchUrl(
  bookName: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number,
  selectedLanguages?: Language[] | null
): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const slug = findBook(bookName)?.abbr3 ?? bookName.toLowerCase().replace(/\s+/g, "");
  const params = new URLSearchParams();
  const normalizedLanguages = normalizeSelectedLanguages(selectedLanguages);

  if (verseStart !== undefined) {
    params.set(
      "v",
      verseEnd !== undefined && verseEnd !== verseStart
        ? `${verseStart}-${verseEnd}`
        : `${verseStart}`
    );
  }

  if (normalizedLanguages) {
    params.set("lang", normalizedLanguages.join(","));
  }

  const query = params.toString();
  const path = `${base}/${slug}/${chapter}/`;
  return query ? `${path}?${query}` : path;
}

function buildWordSearchUrl(query: string, language: Language): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams();
  params.set("mode", "word");
  params.set("q", query);
  params.set("wl", language);
  return `${base}/?${params.toString()}`;
}

export function BibleApp() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [wordSearchResult, setWordSearchResult] = useState<WordSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[] | null>(null);
  const selectedLanguagesRef = useRef<Language[] | null>(null);
  const [languageOrder, setLanguageOrder] = useState<Language[]>(() => {
    try {
      const saved = localStorage.getItem("bible:languageOrder");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === languageConfig.length) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return languageConfig.map((c) => c.lang);
  });
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("bible:history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    selectedLanguagesRef.current = selectedLanguages;
  }, [selectedLanguages]);

  const handleSearch = useCallback(
    async (
      bookName: string,
      bookNumber: number,
      chapter: number,
      verseStart?: number,
      verseEnd?: number,
      options?: { updateUrl?: boolean; selectedLanguages?: Language[] | null }
    ) => {
      const nextSelectedLanguages =
        options && "selectedLanguages" in options
          ? normalizeSelectedLanguages(options.selectedLanguages)
          : selectedLanguagesRef.current;

      setLoading(true);
      setError(null);
      setResult(null);
      setWordSearchResult(null);
      setSelectedLanguages(nextSelectedLanguages);

      try {
        // Fetch all 4 languages in parallel
        const results = await Promise.all(
          languageConfig.map(async (config) => {
            const data = await fetchChapter(config.lang, bookNumber, chapter);

            if (!data) {
              return {
                language: config.lang,
                label: config.label,
                text: null,
                isGeez: config.isGeez,
              } as VerseResult;
            }

            const matchingVerses =
              verseStart === undefined
                ? data.verses
                : data.verses.filter(
                    (v: { verse: number; verseEnd?: number; text: string }) =>
                      (v.verseEnd ?? v.verse) >= verseStart &&
                      v.verse <= (verseEnd ?? verseStart)
                  );

            const text =
              matchingVerses.length > 0
                ? matchingVerses.map((v: { text: string }) => v.text).join(" ")
                : null;

            return {
              language: config.lang,
              label: config.label,
              text,
              isGeez: config.isGeez,
              versesData: matchingVerses.length > 0 ? matchingVerses : undefined,
            } as VerseResult;
          })
        );

        const reference =
          verseStart === undefined
            ? `${bookName} ${chapter}`
            : `${bookName} ${chapter}:${
                verseEnd && verseEnd !== verseStart
                  ? `${verseStart}-${verseEnd}`
                  : `${verseStart}`
              }`;

        setResult({
          reference,
          bookName,
          chapter,
          verseStart,
          verseEnd,
          verses: results,
        });

        if (options?.updateUrl !== false) {
          const nextUrl = buildSearchUrl(
            bookName,
            chapter,
            verseStart,
            verseEnd,
            nextSelectedLanguages
          );
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          if (nextUrl !== currentUrl) {
            window.history.pushState({}, "", nextUrl);
          }
        }

        // Save to search history
        setHistory((prev) => {
          const updated = [reference, ...prev.filter((r) => r !== reference)].slice(0, 10);
          try {
            localStorage.setItem("bible:history", JSON.stringify(updated));
          } catch { /* ignore */ }
          return updated;
        });
      } catch (err) {
        setError("Failed to load verses. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleWordSearch = useCallback(
    async (
      query: string,
      language: string,
      options?: { updateUrl?: boolean }
    ) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setWordSearchResult(null);
      setSelectedLanguages(null);

      try {
        const normalizedLanguage: Language = isLanguage(language) ? language : "en";
        const trimmedQuery = query.trim();
        const result = await wordSearch(trimmedQuery, normalizedLanguage);
        setWordSearchResult(result);

        if (options?.updateUrl !== false) {
          const nextUrl = buildWordSearchUrl(trimmedQuery, normalizedLanguage);
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          if (nextUrl !== currentUrl) {
            window.history.pushState({}, "", nextUrl);
          }
        }

        if (result.totalHits === 0) {
          setError(`No results found for "${trimmedQuery}" in ${normalizedLanguage}`);
        }
      } catch (err) {
        setError("Failed to search. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const initialSearchState = parseUrlSearchState(window.location);
    if (!initialSearchState) return;

    if (initialSearchState.type === "word") {
      void handleWordSearch(initialSearchState.value.query, initialSearchState.value.language, {
        updateUrl: false,
      });
      return;
    }

    const initialReference = initialSearchState.value;
    void handleSearch(
      initialReference.bookName,
      initialReference.bookNumber,
      initialReference.chapter,
      initialReference.verseStart,
      initialReference.verseEnd,
      {
        updateUrl: false,
        selectedLanguages: initialReference.selectedLanguages ?? null,
      }
    );
  }, [handleSearch, handleWordSearch]);

  useEffect(() => {
    const onPopState = () => {
      const searchStateFromUrl = parseUrlSearchState(window.location);

      if (!searchStateFromUrl) {
        setResult(null);
        setWordSearchResult(null);
        setError(null);
        setLoading(false);
        setSelectedLanguages(null);
        return;
      }

      if (searchStateFromUrl.type === "word") {
        void handleWordSearch(searchStateFromUrl.value.query, searchStateFromUrl.value.language, {
          updateUrl: false,
        });
        return;
      }

      const referenceFromUrl = searchStateFromUrl.value;

      void handleSearch(
        referenceFromUrl.bookName,
        referenceFromUrl.bookNumber,
        referenceFromUrl.chapter,
        referenceFromUrl.verseStart,
        referenceFromUrl.verseEnd,
        {
          updateUrl: false,
          selectedLanguages: referenceFromUrl.selectedLanguages ?? null,
        }
      );
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [handleSearch, handleWordSearch]);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setLanguageOrder((prev) => {
      const updated = arrayMove(prev, fromIndex, toIndex);
      try {
        localStorage.setItem("bible:languageOrder", JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const updateVisibleLanguages = useCallback(
    (nextSelectedLanguages: Language[] | null) => {
      if (!result) return;

      const normalizedLanguages = normalizeSelectedLanguages(nextSelectedLanguages);
      setSelectedLanguages(normalizedLanguages);

      const nextUrl = buildSearchUrl(
        result.bookName,
        result.chapter,
        result.verseStart,
        result.verseEnd,
        normalizedLanguages
      );
      const currentUrl = `${window.location.pathname}${window.location.search}`;

      if (nextUrl !== currentUrl) {
        window.history.pushState({}, "", nextUrl);
      }
    },
    [result]
  );

  const toggleLanguage = useCallback(
    (language: Language) => {
      const currentLanguages = selectedLanguages ?? languageConfig.map((config) => config.lang);
      const isSelected = currentLanguages.includes(language);
      const nextLanguages = isSelected
        ? currentLanguages.filter((lang) => lang !== language)
        : [...currentLanguages, language];

      if (nextLanguages.length === 0) {
        return;
      }

      updateVisibleLanguages(nextLanguages);
    },
    [selectedLanguages, updateVisibleLanguages]
  );

  // Sort verses by the user's preferred language order
  const sortedVerses = result
    ? [...result.verses]
        .sort((a, b) => languageOrder.indexOf(a.language) - languageOrder.indexOf(b.language))
        .filter(
          (verse) => !selectedLanguages || selectedLanguages.includes(verse.language)
        )
    : [];

  const effectiveSelectedLanguages =
    selectedLanguages ?? languageConfig.map((config) => config.lang);

  return (
    <div>
      <VerseSearch onSearch={handleSearch} onWordSearch={handleWordSearch} loading={loading} />

      {/* Recent searches */}
      {history.length > 0 && !result && !loading && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {history.map((ref) => (
              <button
                key={ref}
                onClick={() => {
                  const parsed = parseReference(ref);
                  if (!parsed) return;
                  handleSearch(
                    parsed.book.name,
                    parsed.book.bookNumber,
                    parsed.chapter,
                    parsed.verseStart,
                    parsed.verseEnd
                  );
                }}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {ref}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2"></div>
          <p>Loading {wordSearchResult ? "word search" : "verses"}...</p>
        </div>
      )}

      {wordSearchResult && !loading && (
        <WordSearchResults
          results={wordSearchResult.results}
          language={wordSearchResult.language}
          query={wordSearchResult.query}
          onVerseClick={handleSearch}
        />
      )}

      {result && !loading && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{result.reference}</h2>
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Visible languages
                </p>
                <div className="flex flex-wrap gap-3">
                  {languageConfig.map((config) => {
                    const isChecked = effectiveSelectedLanguages.includes(config.lang);
                    const isOnlySelectedLanguage =
                      effectiveSelectedLanguages.length === 1 && isChecked;

                    return (
                      <label
                        key={config.lang}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isChecked
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        } ${
                          isOnlySelectedLanguage ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isOnlySelectedLanguage}
                          onChange={() => toggleLanguage(config.lang)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{config.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <VerseDisplay
            verses={sortedVerses}
            onReorder={handleReorder}
            getReferenceTitle={(language) => {
              const bookName = getLocalizedBookName(result.bookName, language);
              if (result.verseStart === undefined) {
                return `${bookName} ${result.chapter}`;
              }

              const verseRef =
                result.verseEnd && result.verseEnd !== result.verseStart
                  ? `${result.verseStart}-${result.verseEnd}`
                  : `${result.verseStart}`;

              return `${bookName} ${result.chapter}:${verseRef}`;
            }}
            getShareUrl={(language) =>
              buildSearchUrl(
                result.bookName,
                result.chapter,
                result.verseStart,
                result.verseEnd,
                [language]
              )
            }
          />
        </div>
      )}
    </div>
  );
}
