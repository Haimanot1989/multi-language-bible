import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { VerseResult } from "./BibleApp";
import { VerseCard } from "./VerseCard";

interface Props {
  verse: VerseResult;
}

export function SortableVerseCard({ verse }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: verse.language });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <VerseCard verse={verse} dragListeners={listeners} />
    </div>
  );
}

