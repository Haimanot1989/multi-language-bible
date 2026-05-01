import { useState } from "react";
import type { VerseResult, VerseEntry } from "./BibleApp";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface Props {
  verse: VerseResult;
  dragListeners?: SyntheticListenerMap;
  shareUrl: string;
}

const flagMap: Record<string, string> = {
  no: "🇳🇴",
  en: "🇬🇧",
  ti: "🇪🇷",
  am: "🇪🇹",
};

export function VerseCard({ verse, dragListeners, shareUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const flag = flagMap[verse.language] || "";

  const verseLabel = (v: VerseEntry) =>
    v.verseEnd ? `${v.verse}-${v.verseEnd}` : `${v.verse}`;

  const handleCopy = async () => {
    if (!verse.text) return;

    let textToCopy: string;
    if (verse.versesData && verse.versesData.length > 0) {
      textToCopy = verse.versesData
        .map((entry) => {
          const shouldShowNumber = verse.versesData!.length > 1 || entry.verseEnd;
          return shouldShowNumber ? `${verseLabel(entry)} ${entry.text}` : entry.text;
        })
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

  const handleShare = async () => {
    try {
      const absoluteUrl = new URL(shareUrl, window.location.origin).toString();

      if (navigator.share) {
        await navigator.share({
          title: verse.label,
          url: absoluteUrl,
        });
      } else {
        await navigator.clipboard.writeText(absoluteUrl);
      }

      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error("Failed to share:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {dragListeners && (
            <button
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
              aria-label="Drag to reorder"
              {...dragListeners}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3" r="1.5" />
                <circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" />
                <circle cx="11" cy="13" r="1.5" />
              </svg>
            </button>
          )}
          <span className="text-lg">{flag}</span>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {verse.label}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              shared
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-700"
            }`}
            title="Share this language"
          >
            {shared ? "✓ Shared" : "🔗 Share"}
          </button>
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
      </div>

      {verse.text ? (
        verse.versesData && verse.versesData.length > 0 ? (
          <div
            className={`text-gray-800 leading-relaxed space-y-1 ${
              verse.isGeez ? "font-geez text-lg" : "text-base"
            }`}
            lang={verse.language === "ti" ? "ti" : verse.language === "am" ? "am" : undefined}
          >
            {verse.versesData.map((v: VerseEntry) => {
              const showVerseNumber = verse.versesData!.length > 1 || v.verseEnd;
              return (
                <p key={v.verse} className="m-0">
                  {showVerseNumber && <sup className="verse-number">{verseLabel(v)}</sup>}
                  {v.text}
                </p>
              );
            })}
          </div>
        ) : (
          <p
            className={`text-gray-800 leading-relaxed ${
              verse.isGeez ? "font-geez text-lg" : "text-base"
            }`}
            lang={verse.language === "ti" ? "ti" : verse.language === "am" ? "am" : undefined}
          >
            {verse.text}
          </p>
        )
      ) : (
        <p className="text-gray-400 italic">Verse not available in this translation</p>
      )}
    </div>
  );
}

