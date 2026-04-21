import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { COLUMNS, COLUMN_COLORS, COLUMN_DOT_COLORS } from "./constants";
import { LeadCard } from "./LeadCard";
import { supabase } from "@/integrations/supabase/client";
import { parseISO } from "date-fns";
import { Lead } from "@/types/funil";

export function FunilBoard({ state, searchTerm = "", quickFilter = "todos" }: { state: any; searchTerm?: string; quickFilter?: string }) {
  const {
    leads,
    setLeads,
    isMobile,
    mobileColIdx,
    setMobileColIdx,
    getColumnLeads,
    onDragEnd,
    isDraggingCardRef,
    kanbanRef,
    isWideView,
    columnWidths,
    startResizing,
    handleDeleteLead,
    setVencimentoLead,
    setSelectedDate,
    setHistoricoLead,
    membros,
    isManager,
    ultimasTratativas,
    handleUpdateLeadField,
  } = state;

  const currentCol = COLUMNS[mobileColIdx];

  const applyFilters = (leads: Lead[]) => {
    return leads.filter((l: Lead) => {
      const matchSearch = !searchTerm || (l.nome || "").toLowerCase().includes(searchTerm.toLowerCase());
      const today = new Date(); today.setHours(0,0,0,0);
      const dias = l.created_at ? Math.max(0, Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)) : 0;
      const matchQuick =
        quickFilter === 'todos' ? true :
        quickFilter === 'atrasados' ? dias > 14 :
        quickFilter === 'sem_tratativa' ? !(l as any).ultima_tratativa :
        quickFilter === 'hoje' ? (l.data_vencimento ? new Date(l.data_vencimento).toDateString() === today.toDateString() : false) :
        true;
      return matchSearch && matchQuick;
    });
  };

  const currentColLeads = applyFilters(getColumnLeads(currentCol.id));
  const currentColTotal = currentColLeads.reduce((s: number, l: Lead) => s + Number(l.valor_credito), 0);

  const renderLeadCard = (lead: Lead, idx: number) => (
    <Draggable draggableId={lead.id} index={idx} key={lead.id}>
      {(provided, snapshot) => {
        const style = {
          ...provided.draggableProps.style,
          zIndex: snapshot.isDragging ? 9999 : "auto",
        };

        const assignLead = async (leadId: string, responsavelId: string) => {
          const val = responsavelId === "none" ? null : responsavelId;
          await supabase.from("leads").update({ responsavel_id: val } as any).eq("id", leadId);
          setLeads((prev: Lead[]) => prev.map((l) => l.id === leadId ? { ...l, responsavel_id: val } : l));
        };

        const cardElement = (
          <div
            {...provided.draggableProps}
            ref={provided.innerRef}
            style={style}
            className={snapshot.isDragging ? "pointer-events-none" : ""}
          >
            <LeadCard
              lead={lead}
              snapshot={snapshot}
              provided={provided}
              onDelete={handleDeleteLead}
              onSetVencimento={(l) => {
                setVencimentoLead(l);
                setSelectedDate(l.data_vencimento ? parseISO(l.data_vencimento) : undefined);
              }}
              onOpenHistorico={setHistoricoLead}
              onAssignLead={assignLead}
              membros={membros}
              isManager={isManager}
              ultimaTratativa={ultimasTratativas[lead.id] ?? null}
              compact={isWideView}
              onUpdateField={handleUpdateLeadField}
              onEdit={state.setEditingLead}
              onViewFicha={state.setViewingFichaLead}
            />
          </div>
        );

        if (snapshot.isDragging) {
          return createPortal(cardElement, document.body);
        }

        return cardElement;
      }}
    </Draggable>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col w-full">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            onClick={() => setMobileColIdx((i: number) => Math.max(0, i - 1))}
            disabled={mobileColIdx === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 bg-card rounded-lg border border-border px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${COLUMN_DOT_COLORS[currentCol.id]}`} />
              <span className="font-semibold text-sm">{currentCol.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentColLeads.length} leads · {formatCurrency(currentColTotal)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            onClick={() => setMobileColIdx((i: number) => Math.min(COLUMNS.length - 1, i + 1))}
            disabled={mobileColIdx === COLUMNS.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-1.5 mb-3">
          {COLUMNS.map((col, i) => (
            <button
              key={col.id}
              onClick={() => setMobileColIdx(i)}
              className={`h-2 rounded-full transition-all ${i === mobileColIdx ? `w-6 ${COLUMN_DOT_COLORS[col.id]}` : "w-2 bg-muted-foreground/30"
                }`}
            />
          ))}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={currentCol.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-lg border-t-4 ${COLUMN_COLORS[currentCol.id]} bg-card p-3 min-h-[400px] max-h-[calc(100vh-450px)] overflow-y-auto no-scrollbar ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className="space-y-2">
                  {currentColLeads.map((lead: Lead, idx: number) => renderLeadCard(lead, idx))}
                  {currentColLeads.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Nenhum lead nesta etapa
                    </p>
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onDragStart={() => { isDraggingCardRef.current = true; }}
    >
      <div className="relative group w-full">
        <button
          onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft -= 500)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-primary/95 text-primary-foreground shadow-[0_0_30px_rgba(0,0,0,0.4)] rounded-full p-4 hover:scale-110 active:scale-95 transition-all -ml-8 border-4 border-background group-hover:opacity-100 opacity-80"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="h-10 w-10" />
        </button>

        <button
          onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft += 500)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-primary/95 text-primary-foreground shadow-[0_0_30px_rgba(0,0,0,0.4)] rounded-full p-4 hover:scale-110 active:scale-95 transition-all -mr-8 border-4 border-background group-hover:opacity-100 opacity-80"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="h-10 w-10" />
        </button>

        <div
          ref={kanbanRef}
          className={`flex gap-2 overflow-x-auto pb-4 no-scrollbar px-1 lg:px-2 scroll-smooth ${isWideView ? '' : 'justify-start'}`}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
        {COLUMNS.map((col) => {
          const colLeads = applyFilters(getColumnLeads(col.id));
          const totalValor = colLeads.reduce((s: number, l: Lead) => s + Number(l.valor_credito), 0);

          return (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`shrink-0 rounded-lg border-t-4 ${COLUMN_COLORS[col.id] || "border-t-border bg-card/50"} bg-card/80 backdrop-blur-sm p-1.5 flex flex-col h-[calc(100vh-160px)] transition-all relative group/col ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
                  style={{ width: columnWidths[col.id] || (isWideView ? 180 : 240), minWidth: isWideView ? 140 : 230 }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-black text-[11px] truncate uppercase tracking-tighter ${isWideView ? "text-[10px]" : ""}`}>{col.label}</h3>
                      <p className="text-[9px] text-muted-foreground -mt-0.5">
                        {colLeads.length} leads · {formatCurrency(totalValor)}
                      </p>
                    </div>
                  </div>

                  <div
                    onMouseDown={(e: any) => startResizing(col.id, e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary transition-colors z-10"
                  />

                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 no-scrollbar min-h-[100px]">
                    {colLeads.map((lead: Lead, idx: number) => renderLeadCard(lead, idx))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
      </div>
    </DragDropContext>
  );
}
