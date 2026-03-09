import { useState } from "react";
import type { VerseResult, VerseEntry } from "./BibleApp";

interface Props {
  verse: VerseResult;
}

const flagMap: Record<string, string> = {
  no: "🇳🇴",
  en: "🇬🇧",
  ti: "🇪🇷",
  am: "🇪🇹",
};

export function VerseCard({ verse }: Props) {
  const [copied, setCopied] = useState(false);
  const flag = flagMap[verse.language] || "";
  const isMultiVerse = verse.versesData && verse.versesData.length > 1;

  const handleCopy = async () => {
    if (!verse.text) return;

    let textToCopy: string;
    if (verse.versesData && verse.versesData.length > 1) {
      textToCopy = verse.versesData
        .map((entry) => `${entry.verse} ${entry.text}`)
        .join(" ");
    } else {
      textToCopy = verse.text;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {verse.label}
          </h3>
        </div>
        {verse.text && (
          <button
            onClick={handleCopy}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              copied
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-700"
            }`}
            title="Copy text"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        )}
      </div>

      {verse.text ? (
        <p
          className={`text-gray-800 leading-relaxed ${
            verse.isGeez ? "font-geez text-lg" : "text-base"
          }`}
          lang={verse.language === "ti" ? "ti" : verse.language === "am" ? "am" : undefined}
        >
          {isMultiVerse
            ? verse.versesData!.map((v: VerseEntry) => (
                <span key={v.verse}>
                  <sup className="verse-number">{v.verse}</sup>
                  {v.text}{" "}
                </span>
              ))
            : verse.text}
        </p>
      ) : (
        <p className="text-gray-400 italic">Verse not available in this translation</p>
      )}
    </div>
  );
}

