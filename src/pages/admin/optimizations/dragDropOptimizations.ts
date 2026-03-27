import { DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Optimized DnD handler for Kanban-style boards.
 * Performs optimistic updates and handles persistence.
 */
export const handleKanbanDragEnd = async <T extends { id: string; status: string }>(
  result: DropResult,
  data: T[],
  setData: React.Dispatch<React.SetStateAction<T[]>>,
  tableName: string,
  successMsg?: string
) => {
  const { destination, draggableId, source } = result;

  if (!destination) return;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return;

  const newStatus = destination.droppableId;
  const originalData = [...data];

  // 1. Optimistic Update
  setData(prev => 
    prev.map(item => 
      item.id === draggableId ? { ...item, status: newStatus } : item
    )
  );

  // 2. Persistence
  try {
    const { error } = await (supabase.from(tableName as any) as any)
      .update({ status: newStatus })
      .eq("id", draggableId);

    if (error) {
      throw error;
    }

    if (successMsg && newStatus === "fechado") {
      toast.success(successMsg);
    } else if (successMsg && tableName === "inadimplentes" && newStatus === "regularizado") {
      toast.success("🎉 Cliente regularizado!");
    }
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    toast.error("Erro ao sincronizar alteração. Revertendo...");
    // 3. Rollback on failure
    setData(originalData);
  }
};
