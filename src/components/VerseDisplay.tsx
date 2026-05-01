import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { VerseResult } from "./BibleApp";
import type { Language } from "../lib/bibleData";
import { SortableVerseCard } from "./SortableVerseCard";

interface Props {
  verses: VerseResult[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  getShareUrl: (language: Language) => string;
  getReferenceTitle: (language: Language) => string;
}

export function VerseDisplay({ verses, onReorder, getShareUrl, getReferenceTitle }: Props) {
  const getGridClassName = (visibleCards: number) => {
    if (visibleCards <= 1) {
      return "grid grid-cols-1 gap-4";
    }

    if (visibleCards === 2) {
      return "grid grid-cols-1 md:grid-cols-2 gap-4";
    }

    if (visibleCards === 3) {
      return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4";
    }

    return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4";
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = verses.findIndex((v) => v.language === active.id);
      const newIndex = verses.findIndex((v) => v.language === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={verses.map((v) => v.language)}
        strategy={rectSortingStrategy}
      >
        <div className={getGridClassName(verses.length)}>
          {verses.map((v) => (
            <SortableVerseCard
              key={v.language}
              verse={v}
              shareUrl={getShareUrl(v.language)}
              referenceTitle={getReferenceTitle(v.language)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

