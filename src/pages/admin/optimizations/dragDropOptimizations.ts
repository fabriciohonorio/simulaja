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
  const { destination, source, draggableId } = result;

  if (!destination) return;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return;

  const originalData = [...data];
  const newStatus = destination.droppableId;
  const nowIso = new Date().toISOString();

  // 1. Optimistic Update with Reordering
  const updatedData = [...data];
  const itemIndex = updatedData.findIndex(item => item.id === draggableId);
  
  if (itemIndex !== -1) {
    const [item] = updatedData.splice(itemIndex, 1);
    const updatedItem = { 
      ...item, 
      status: newStatus,
      status_updated_at: (newStatus !== item.status && tableName !== "inadimplentes") ? nowIso : (item as any).status_updated_at 
    };

    // Calculate insertion index in the global array
    // We want to insert it at destination.index among items of the SAME new status
    const itemsInTargetStatus = updatedData.filter(i => i.status === newStatus);
    
    // This is a bit complex because the global array might be sorted.
    // To make it simple and predictable, we'll just put it at the "end" of the target status group 
    // or use a temporary 'sort_order' if we had one.
    // For now, let's just update the status and let the component's internal filtering/sorting handle it,
    // BUT we need to make sure the component doesn't jump.
    
    setData(prev => {
      const result = [...prev];
      const idx = result.findIndex(i => i.id === draggableId);
      if (idx !== -1) {
        const [moved] = result.splice(idx, 1);
        return [
          ...result.slice(0, 0), // Placeholder for logic if needed
          { 
            ...moved, 
            status: newStatus, 
            status_updated_at: (newStatus !== moved.status && tableName !== "inadimplentes") ? nowIso : (moved as any).status_updated_at 
          }
        ];
      }
      return result;
    });
  }

  // 2. Persistence
  try {
    const updatePayload: any = { 
      status: newStatus,
      updated_at: nowIso
    };
    
    if (tableName !== "inadimplentes") {
      updatePayload.status_updated_at = nowIso;
    }
    
    const { data: updatedRows, error } = await (supabase.from(tableName as any) as any)
      .update(updatePayload)
      .eq("id", draggableId)
      .select();

    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("Permissão negada ou lead não encontrado.");
    }

    if (successMsg && newStatus === "fechado") {
      toast.success(successMsg);
    } else if (successMsg && tableName === "inadimplentes" && newStatus === "regularizado") {
      toast.success("🎉 Cliente regularizado!");
    }
  } catch (error: any) {
    console.error(`Error updating ${tableName}:`, error);
    toast.error(`Falha: ${error?.message || "Erro ao atualizar status."} Revertendo...`);
    setData(originalData);
  }
};

