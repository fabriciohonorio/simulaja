import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lead } from "@/types/funil";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import LeadCard from "./LeadCard";
import { COLUMNS, COLUMN_COLORS } from "./constants";

interface FunilBoardProps {
  leads?: Lead[];
  setLeads?: React.Dispatch<React.SetStateAction<Lead[]>>;
  loading?: boolean;
  onLeadMove?: (leadId: string, newStatus: string) => void;
  onOpenHistorico?: (lead: Lead) => void;
  membros?: any[];
  isManager?: boolean;
  ultimasTratativas?: Record<string, any>;
  state: any;
  handleKanbanDragEnd?: (result: DropResult) => Promise<void>;
  handleDeleteLead?: (id: string, nome: string) => void;
  handleUpdateLeadField?: (leadId: string, field: string, value: any) => void;
  setVencimentoLead?: (lead: Lead | null) => void;
  setSelectedDate?: (date: Date | undefined) => void;
  setHistoricoLead?: (lead: Lead | null) => void;
  searchTerm?: string;
  quickFilter?: string;
}

const FunilBoard = (props: FunilBoardProps) => {
  const { state, searchTerm, quickFilter: externalQuickFilter } = props;
  
  // Destructure from props or state to prevent undefined errors
  const leads = props.leads || state?.leads || [];
  const setLeads = props.setLeads || state?.setLeads;
  const loading = props.loading ?? state?.loading ?? false;
  const membros = props.membros || state?.membros || [];
  const isManager = props.isManager ?? state?.isManager ?? false;
  const ultimasTratativas = props.ultimasTratativas || state?.ultimasTratativas || {};
  const handleKanbanDragEnd = props.handleKanbanDragEnd || state?.onDragEnd;
  const handleDeleteLead = props.handleDeleteLead || state?.handleDeleteLead;
  const handleUpdateLeadField = props.handleUpdateLeadField || state?.handleUpdateLeadField;
  const setVencimentoLead = props.setVencimentoLead || state?.setVencimentoLead;
  const setSelectedDate = props.setSelectedDate || state?.setSelectedDate;
  const setHistoricoLead = props.setHistoricoLead || state?.setHistoricoLead;

  const { toast } = useToast();
  const [isWideView, setIsWideView] = useState(state?.isWideView || false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchTerm || "");
  const [quickFilter, setQuickFilter] = useState<'todos' | 'hoje' | 'sem_tratativa' | 'atrasados'>(
    (externalQuickFilter as any) || 'todos'
  );
  const [indicadorFilter, setIndicadorFilter] = useState<string>('todos');

  // Update local state when props change
  useEffect(() => {
    if (searchTerm !== undefined) setSearchQuery(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (externalQuickFilter !== undefined) setQuickFilter(externalQuickFilter as any);
  }, [externalQuickFilter]);


  const isMobile = window.innerWidth < 768;

  const getColumnLeads = (status: string) => {
    return leads
      .filter((l) => l.status === status)
      .sort((a, b) => {
        const timeA = new Date(a.status_updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.status_updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
  };

  const applyFilters = (leadList: Lead[]) => {
    return leadList.filter(l => {
      const matchSearch = l.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (l.celular && l.celular.includes(searchQuery));
      const matchQuick = quickFilter === 'todos' || 
                        (quickFilter === 'hoje' && l.data_vencimento && format(parseISO(l.data_vencimento), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) ||
                        (quickFilter === 'sem_tratativa' && !ultimasTratativas[l.id]) ||
                        (quickFilter === 'atrasados' && l.status_updated_at && (new Date().getTime() - new Date(l.status_updated_at).getTime()) > 14 * 24 * 60 * 60 * 1000);
      const matchIndicador = indicadorFilter === 'todos' || l.indicador_nome === indicadorFilter;
      return matchSearch && matchQuick && matchIndicador;
    });
  };

  const renderLeadCard = (lead: Lead, index: number) => (
    <LeadCard
      key={lead.id}
      lead={lead}
      index={index}
      onDelete={handleDeleteLead}
      onSetVencimento={(l) => {
        setVencimentoLead(l);
        setSelectedDate(l.data_vencimento ? parseISO(l.data_vencimento) : undefined);
      }}
      onOpenHistorico={setHistoricoLead}
      onAssignLead={async (leadId, responsavelId) => {
        const val = responsavelId === "none" ? null : responsavelId;
        await supabase.from("leads").update({ responsavel_id: val } as any).eq("id", leadId);
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, responsavel_id: val } : l));
      }}
      membros={membros}
      isManager={isManager}
      ultimaTratativa={ultimasTratativas[lead.id] ?? null}
      compact={isWideView}
      onUpdateField={handleUpdateLeadField}
      onEdit={state.setEditingLead}
      onViewFicha={state.setViewingFichaLead}
    />
  );

  if (isMobile) {
    const currentCol = COLUMNS[mobileColIdx];
    const colLeads = applyFilters(getColumnLeads(currentCol.id));
    
    return (
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center justify-between mb-4 px-2">
          <Button variant="ghost" size="sm" onClick={() => setMobileColIdx(prev => Math.max(0, prev - 1))} disabled={mobileColIdx === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h2 className="font-bold text-slate-800 uppercase text-xs">{currentCol.label}</h2>
            <p className="text-[10px] text-slate-500">{colLeads.length} leads</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMobileColIdx(prev => Math.min(COLUMNS.length - 1, prev + 1))} disabled={mobileColIdx === COLUMNS.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <DragDropContext onDragEnd={handleKanbanDragEnd}>
          <Droppable droppableId={currentCol.id} direction="vertical">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-col gap-2 p-2 min-h-[500px]"
              >
                {colLeads.map((lead, idx) => renderLeadCard(lead, idx))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleKanbanDragEnd}>
      <div className="flex-1 overflow-x-auto pb-6 no-scrollbar">
        <div className="flex gap-3 h-full min-w-max">
          {COLUMNS.map((col) => {
            const colLeads = applyFilters(getColumnLeads(col.id));
            const totalValue = colLeads.reduce((acc, lead) => acc + Number(lead.valor_credito || 0), 0);

            return (
              <div 
                key={col.id}
                className={cn(
                  "flex flex-col rounded-xl border-t-4 bg-slate-50/50 border-slate-200/50 transition-all shrink-0",
                  "w-[270px]",
                  "h-[calc(100vh-280px)]",
                  COLUMN_COLORS[col.id] || "border-t-slate-300",
                  state?.isWideView && "w-[310px]"
                )}
              >
                <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-white/50 rounded-t-xl shrink-0">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                      {col.label}
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[9px] h-4 min-w-[18px] justify-center px-1">
                        {colLeads.length}
                      </Badge>
                    </h2>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                      {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-primary">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <Droppable droppableId={col.id} direction="vertical">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5 no-scrollbar transition-colors",
                        snapshot.isDraggingOver ? "bg-primary/5" : ""
                      )}
                    >
                      {colLeads.map((lead, idx) => renderLeadCard(lead, idx))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
};

export default FunilBoard;
