import { books } from "../lib/bookMapping";
import { getLocalizedBookName } from "../lib/localizedBookNames";
import type { Language } from "../lib/bibleData";
import type { SearchResultChapter } from "../lib/search/searchIndex";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text: string, query: string) {
  const queryTokens = Array.from(new Set(query.trim().split(/\s+/).filter(Boolean)))
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);

  if (queryTokens.length === 0) {
    return text;
  }

  const pattern = queryTokens.join("|");
  const splitRegex = new RegExp(`(${pattern})`, "giu");
  const matchRegex = new RegExp(`^(?:${pattern})$`, "iu");
  const parts = text.split(splitRegex);

  return parts.map((part, index) =>
    matchRegex.test(part) ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-0.5 text-gray-900">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

interface Props {
  results: SearchResultChapter[];
  language: Language;
  query: string;
  onVerseClick: (bookName: string, bookNumber: number, chapter: number, verse: number) => void;
}

export function WordSearchResults({
  results,
  language,
  query,
  onVerseClick,
}: Props) {
  if (results.length === 0) {
    return (
      <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">No results found for "{query}" in {language}</p>
      </div>
    );
  }

  const totalHits = results.reduce((sum, ch) => sum + ch.verses.length, 0);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Search Results
        </h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {totalHits} {totalHits === 1 ? "result" : "results"}
        </span>
      </div>

      <div className="space-y-3">
        {results.map((chapter) => {
          const bookInfo = books.find((b) => b.bookNumber === chapter.bookNumber);
          const bookName = bookInfo?.name || "Unknown";
          const localizedBookName = getLocalizedBookName(bookName, language);

          return (
            <div
              key={`${chapter.bookNumber}:${chapter.chapter}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-blue-600 mb-2">
                {localizedBookName} {chapter.chapter}
              </h4>

              <div className="space-y-2">
                {chapter.verses.map((verse) => (
                  <div
                    key={`${chapter.chapter}:${verse.verse}`}
                    className="pl-4 border-l-2 border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <button
                      onClick={() =>
                        onVerseClick(
                          bookName,
                          chapter.bookNumber,
                          chapter.chapter,
                          verse.verse
                        )
                      }
                      className="text-left w-full group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors min-w-fit">
                          {chapter.chapter}:{verse.verse}
                        </span>
                        <div className="flex-1 text-sm text-gray-700 group-hover:text-blue-700 transition-colors break-words text-left">
                          {verse.text
                            ? renderHighlightedText(verse.text, query)
                            : "(Verse text unavailable)"}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

