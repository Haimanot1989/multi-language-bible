import { useState } from "react";
import type { SearchResult } from "./BibleApp";

interface Props {
  result: SearchResult;
}

export function CopyButton({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines = result.verses
      .map((v) => {
        if (!v.text) return `${v.label}: (not available)`;
        if (v.versesData && v.versesData.length > 1) {
          const numberedText = v.versesData
            .map((entry) => `${entry.verse} ${entry.text}`)
            .join(" ");
          return `${v.label}: ${numberedText}`;
        }
        return `${v.label}: ${v.text}`;
      })
      .join("\n");

    const text = `${result.reference}\n${lines}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        copied
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
      }`}
    >
      {copied ? "✓ Copied!" : "📋 Copy for Notion"}
    </button>
  );
}

