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
import { SortableVerseCard } from "./SortableVerseCard";

interface Props {
  verses: VerseResult[];
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function VerseDisplay({ verses, onReorder }: Props) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
          {verses.map((v) => (
            <SortableVerseCard key={v.language} verse={v} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

