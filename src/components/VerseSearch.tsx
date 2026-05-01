import { useState, useMemo } from "react";
import { books } from "../lib/bookMapping";
import { parseReference } from "../lib/referenceParser";

interface Props {
  onSearch: (
    bookName: string,
    bookNumber: number,
    chapter: number,
    verseStart?: number,
    verseEnd?: number
  ) => void;
  onWordSearch: (query: string, language: string) => void;
  loading: boolean;
}

export function VerseSearch({ onSearch, onWordSearch, loading }: Props) {
  const [searchText, setSearchText] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verseStart, setVerseStart] = useState("");
  const [verseEnd, setVerseEnd] = useState("");
  const [mode, setMode] = useState<"text" | "dropdown" | "word">("text");
  const [wordSearchQuery, setWordSearchQuery] = useState("");
  const [wordSearchLanguage, setWordSearchLanguage] = useState<string>("en");

  const selectedBookInfo = useMemo(
    () => (selectedBook ? books.find((b) => b.name === selectedBook) : null),
    [selectedBook]
  );

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    if (!trimmed) return;

    const parsed = parseReference(trimmed);
    if (!parsed) return;

    onSearch(
      parsed.book.name,
      parsed.book.bookNumber,
      parsed.chapter,
      parsed.verseStart,
      parsed.verseEnd
    );
  };

  const handleDropdownSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookInfo || !chapter || !verseStart) return;

    const ch = parseInt(chapter, 10);
    const vs = parseInt(verseStart, 10);
    const ve = verseEnd ? parseInt(verseEnd, 10) : undefined;

    onSearch(selectedBookInfo.name, selectedBookInfo.bookNumber, ch, vs, ve);
  };

  const handleWordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = wordSearchQuery.trim();
    if (!query) return;
    onWordSearch(query, wordSearchLanguage);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setMode("text")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Type reference
        </button>
        <button
          onClick={() => setMode("dropdown")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === "dropdown"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Select from list
        </button>
        <button
          onClick={() => setMode("word")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === "word"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Search words
        </button>
      </div>

      {mode === "text" ? (
        <form onSubmit={handleTextSearch} className="flex gap-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='e.g., "Psalms 15", "Psalms 2:7", or "John 3:16-18"'
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading || !searchText.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Search
          </button>
        </form>
      ) : mode === "dropdown" ? (
        <form onSubmit={handleDropdownSearch} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Book selector */}
            <select
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                setChapter("");
                setVerseStart("");
                setVerseEnd("");
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option value="">Select book...</option>
              {books.map((b) => (
                <option key={b.bookNumber} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Chapter selector */}
            <select
              value={chapter}
              onChange={(e) => {
                setChapter(e.target.value);
                setVerseStart("");
                setVerseEnd("");
              }}
              disabled={!selectedBookInfo}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 disabled:bg-gray-100"
            >
              <option value="">Chapter...</option>
              {selectedBookInfo &&
                Array.from({ length: selectedBookInfo.chapters }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
            </select>

            {/* Verse start */}
            <input
              type="number"
              min="1"
              value={verseStart}
              onChange={(e) => setVerseStart(e.target.value)}
              placeholder="Verse"
              disabled={!chapter}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 disabled:bg-gray-100"
            />

            {/* Verse end (optional) */}
            <input
              type="number"
              min={verseStart ? parseInt(verseStart) : 1}
              value={verseEnd}
              onChange={(e) => setVerseEnd(e.target.value)}
              placeholder="To (optional)"
              disabled={!verseStart}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedBook || !chapter || !verseStart}
            className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Search
          </button>
        </form>
      ) : (
        <form onSubmit={handleWordSearch} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={wordSearchQuery}
              onChange={(e) => setWordSearchQuery(e.target.value)}
              placeholder='e.g., "love", "faith", "hope"'
              className="col-span-1 md:col-span-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
            />
            <select
              value={wordSearchLanguage}
              onChange={(e) => setWordSearchLanguage(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option value="en">English</option>
              <option value="no">Norwegian</option>
              <option value="ti">Tigrinya</option>
              <option value="am">Amharic</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !wordSearchQuery.trim()}
            className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Search Words
          </button>
        </form>
      )}
    </div>
  );
}

