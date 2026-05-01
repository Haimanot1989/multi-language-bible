import { useState, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { VerseSearch } from "./VerseSearch";
import { VerseDisplay } from "./VerseDisplay";
import { CopyButton } from "./CopyButton";
import { parseReference } from "../lib/referenceParser";
import type { Language } from "../lib/bibleData";

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

export function BibleApp() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSearch = useCallback(
    async (
      bookName: string,
      bookNumber: number,
      chapter: number,
      verseStart?: number,
      verseEnd?: number
    ) => {
      setLoading(true);
      setError(null);
      setResult(null);

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

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setLanguageOrder((prev) => {
      const updated = arrayMove(prev, fromIndex, toIndex);
      try {
        localStorage.setItem("bible:languageOrder", JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  // Sort verses by the user's preferred language order
  const sortedVerses = result
    ? [...result.verses].sort(
        (a, b) => languageOrder.indexOf(a.language) - languageOrder.indexOf(b.language)
      )
    : [];

  return (
    <div>
      <VerseSearch onSearch={handleSearch} loading={loading} />

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
          <p>Loading verses...</p>
        </div>
      )}

      {result && !loading && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {result.reference}
            </h2>
            <CopyButton result={result} />
          </div>
          <VerseDisplay verses={sortedVerses} onReorder={handleReorder} />
        </div>
      )}
    </div>
  );
}
