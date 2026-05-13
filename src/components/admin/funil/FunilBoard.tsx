import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
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
  const currentColTotal = currentColLeads
    .filter(l => l.dados_cadastro?.is_retroativo !== true)
    .reduce((s: number, l: Lead) => s + Number(l.valor_credito), 0);

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
            {(provided, snapshot) => {
              const mobileRef = React.useRef<HTMLDivElement>(null);
              const scrollMobile = (direction: 'up' | 'down') => {
                if (mobileRef.current) {
                  mobileRef.current.scrollBy({
                    top: direction === 'up' ? -300 : 300,
                    behavior: 'smooth'
                  });
                }
              };

              return (
                <div className="relative group/mobile-scroll">
                  <div
                    ref={(el) => {
                      provided.innerRef(el);
                      (mobileRef as any).current = el;
                    }}
                    {...provided.droppableProps}
                    className={`rounded-lg border-t-4 ${COLUMN_COLORS[currentCol.id]} bg-card p-3 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
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

                  {/* Mobile Vertical Scroll Controls */}
                  <div className="absolute right-4 bottom-4 flex flex-col gap-2 opacity-0 group-hover/mobile-scroll:opacity-100 transition-opacity z-20">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-2xl bg-primary/30 backdrop-blur-md border border-primary/20 text-primary hover:bg-primary/40 transition-all"
                      onClick={() => scrollMobile('up')}
                    >
                      <ChevronUp className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-2xl bg-primary/30 backdrop-blur-md border border-primary/20 text-primary hover:bg-primary/40 transition-all"
                      onClick={() => scrollMobile('down')}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            }}
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
      <div className="relative group w-full flex-1 min-h-0 flex flex-col">
        <button
          onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft -= 500)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-primary/30 backdrop-blur-xl text-primary shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-full p-3 hover:scale-110 active:scale-95 transition-all border-2 border-primary/20 group-hover:opacity-100 opacity-60"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <button
          onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft += 500)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-primary/30 backdrop-blur-xl text-primary shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-full p-3 hover:scale-110 active:scale-95 transition-all border-2 border-primary/20 group-hover:opacity-100 opacity-60"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="h-8 w-8" />
        </button>

        <div
          ref={kanbanRef}
          className={`flex-1 min-h-0 flex overflow-x-auto pb-4 custom-scrollbar ${isWideView ? '' : 'justify-start'}`}
        >
          {COLUMNS.map((col, index) => {
            const colLeads = applyFilters(getColumnLeads(col.id));
            const totalValor = colLeads
              .filter(l => l.dados_cadastro?.is_retroativo !== true)
              .reduce((s: number, l: Lead) => s + Number(l.valor_credito), 0);

            return (
              <div
                key={col.id}
                className={`shrink-0 rounded-lg border-t-4 ${COLUMN_COLORS[col.id] || "border-t-border bg-card/50"} bg-card/80 p-1.5 flex flex-col h-full relative group/col mr-2 first:ml-2`}
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

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => {
                    const columnRef = React.useRef<HTMLDivElement>(null);
                    
                    const scrollColumn = (direction: 'up' | 'down') => {
                      if (columnRef.current) {
                        columnRef.current.scrollBy({
                          top: direction === 'up' ? -300 : 300,
                          behavior: 'smooth'
                        });
                      }
                    };

                    return (
                      <div className="relative flex-1 min-h-[100px] flex flex-col group/colcontent">
                        <div
                          ref={(el) => {
                            provided.innerRef(el);
                            (columnRef as any).current = el;
                          }}
                          {...provided.droppableProps}
                          className={`space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar ${snapshot.isDraggingOver ? "ring-2 ring-primary/30 rounded" : ""}`}
                        >
                          {colLeads.map((lead: Lead, idx: number) => renderLeadCard(lead, idx))}
                          {provided.placeholder}
                        </div>
                        
                        {/* Vertical Scroll Controls - Facilitated Methodology */}
                        <div className="absolute right-2 bottom-2 flex flex-col gap-1 opacity-0 group-hover/colcontent:opacity-100 transition-opacity z-20">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-lg bg-primary/30 backdrop-blur-md border border-primary/20 text-primary hover:bg-primary/40 transition-all"
                            onClick={() => scrollColumn('up')}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-lg bg-primary/30 backdrop-blur-md border border-primary/20 text-primary hover:bg-primary/40 transition-all"
                            onClick={() => scrollColumn('down')}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  }}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
