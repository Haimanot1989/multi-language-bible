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
  const flag = flagMap[verse.language] || "";
  const isMultiVerse = verse.versesData && verse.versesData.length > 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{flag}</span>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {verse.label}
        </h3>
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

