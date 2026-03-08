import { useState, useCallback } from "react";
import { VerseSearch } from "./VerseSearch";
import { VerseDisplay } from "./VerseDisplay";
import { CopyButton } from "./CopyButton";
import type { Language } from "../lib/bibleData";

export interface VerseResult {
  language: Language;
  label: string;
  text: string | null;
  isGeez: boolean;
}

export interface SearchResult {
  reference: string;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  verses: VerseResult[];
}

const languageConfig: { lang: Language; label: string; isGeez: boolean }[] = [
  { lang: "no", label: "Norwegian", isGeez: false },
  { lang: "en", label: "English - KJV", isGeez: false },
  { lang: "ti", label: "Tigrinya", isGeez: true },
  { lang: "am", label: "Amharic", isGeez: true },
];

export function BibleApp() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (
      bookName: string,
      bookNumber: number,
      chapter: number,
      verseStart: number,
      verseEnd?: number
    ) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const verses: VerseResult[] = [];

        for (const config of languageConfig) {
          try {
            const response = await fetch(
              `/data/${config.lang}/${bookNumber}/${chapter}.json`
            );

            if (!response.ok) {
              verses.push({
                language: config.lang,
                label: config.label,
                text: null,
                isGeez: config.isGeez,
              });
              continue;
            }

            const data = await response.json();
            const end = verseEnd ?? verseStart;
            const matchingVerses = data.verses.filter(
              (v: { verse: number; text: string }) =>
                v.verse >= verseStart && v.verse <= end
            );

            const text =
              matchingVerses.length > 0
                ? matchingVerses.map((v: { text: string }) => v.text).join(" ")
                : null;

            verses.push({
              language: config.lang,
              label: config.label,
              text,
              isGeez: config.isGeez,
            });
          } catch {
            verses.push({
              language: config.lang,
              label: config.label,
              text: null,
              isGeez: config.isGeez,
            });
          }
        }

        const verseRef =
          verseEnd && verseEnd !== verseStart
            ? `${verseStart}-${verseEnd}`
            : `${verseStart}`;
        const reference = `${bookName} ${chapter}:${verseRef}`;

        setResult({
          reference,
          bookName,
          chapter,
          verseStart,
          verseEnd,
          verses,
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

  return (
    <div>
      <VerseSearch onSearch={handleSearch} loading={loading} />

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
          <VerseDisplay verses={result.verses} />
        </div>
      )}
    </div>
  );
}

