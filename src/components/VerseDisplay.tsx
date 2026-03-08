import type { VerseResult } from "./BibleApp";
import { VerseCard } from "./VerseCard";

interface Props {
  verses: VerseResult[];
}

export function VerseDisplay({ verses }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {verses.map((v) => (
        <VerseCard key={v.language} verse={v} />
      ))}
    </div>
  );
}

