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

  const nowIso = new Date().toISOString();

  // 1. Optimistic Update
  setData(prev => 
    prev.map(item => 
      item.id === draggableId ? { 
        ...item, 
        status: newStatus,
        status_updated_at: tableName !== "inadimplentes" ? nowIso : (item as any).status_updated_at 
      } : item
    )
  );

  // 2. Persistence
  try {
    const updatePayload: any = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (tableName !== "inadimplentes") {
      updatePayload.status_updated_at = nowIso;
    }
    
    // Explicitly add .select() to verify the row was actually updated (RLS could silently filter it)
    const { data: updatedRows, error } = await (supabase.from(tableName as any) as any)
      .update(updatePayload)
      .eq("id", draggableId)
      .select();

    if (error) {
      throw error;
    }

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("Permissão negada ou lead não encontrado. A atualização foi bloqueada.");
    }

    if (successMsg && newStatus === "fechado") {
      toast.success(successMsg);
    } else if (successMsg && tableName === "inadimplentes" && newStatus === "regularizado") {
      toast.success("🎉 Cliente regularizado!");
    }
  } catch (error: any) {
    console.error(`Error updating ${tableName}:`, error);
    toast.error(`Falha: ${error?.message || "Erro ao atualizar status."} Revertendo...`);
    // 3. Rollback on failure
    setData(originalData);
  }
};
