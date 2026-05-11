import { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { 
  Calendar, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  MoreHorizontal, 
  Phone, 
  Trash2, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Pencil,
  NotebookPen,
  GripVertical,
  Briefcase,
  History,
  Eye
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lead } from "@/types/leads";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  index: number;
  onDelete: (id: string, nome: string) => void;
  onSetVencimento: (lead: Lead) => void;
  onOpenHistorico: (lead: Lead) => void;
  onAssignLead: (leadId: string, responsavelId: string) => void;
  membros: any[];
  isManager: boolean;
  ultimaTratativa: any | null;
  compact?: boolean;
  onUpdateField?: (leadId: string, field: string, value: any) => void;
  onEdit?: (lead: Lead) => void;
  onViewFicha?: (lead: Lead) => void;
}

const LeadCard = ({
  lead,
  index,
  onDelete,
  onSetVencimento,
  onOpenHistorico,
  onAssignLead,
  membros,
  isManager,
  ultimaTratativa,
  compact = false,
  onUpdateField,
  onEdit,
  onViewFicha
}: LeadCardProps) => {
  const statusNormalized = lead.status?.toLowerCase() || "novo_lead";
  
  const getVencimentoStyle = () => {
    if (!lead.data_vencimento) return "text-slate-400";
    const days = differenceInDays(parseISO(lead.data_vencimento), new Date());
    if (days < 0) return "text-red-500 font-bold animate-pulse";
    if (days === 0) return "text-orange-500 font-bold";
    return "text-slate-500";
  };

  const renderDiasNaEtapa = () => {
    if (!lead.status_updated_at) return null;
    const diasNaEtapa = differenceInDays(new Date(), parseISO(lead.status_updated_at));
    if (diasNaEtapa < 3) return null;
    
    if (diasNaEtapa >= 15) {
      return (
        <span className="flex items-center gap-1 text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-red-200 text-[9px] animate-bounce shadow-sm">
          <AlertCircle className="w-2.5 h-2.5" /> CRÍTICO: {diasNaEtapa}d
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-red-100 text-[8px]">
        <Clock className="w-2 h-2" /> {diasNaEtapa} {diasNaEtapa === 1 ? 'dia' : 'dias'}
      </span>
    );
  };

  return (
    <Draggable key={lead.id} draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group relative bg-white border rounded-xl overflow-hidden select-none ${!snapshot.isDragging ? "transition-all duration-200" : ""}
            ${statusNormalized === "fechado" ? "border-emerald-200/80 shadow-[0_0_12px_rgba(34,197,94,0.08)]" : "border-slate-200/70 hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300/60 hover:-translate-y-0.5"}
            ${statusNormalized === "morto" ? "opacity-55 grayscale-[30%]" : ""}
            ${snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/40 scale-[1.02] z-[9999] rotate-1 bg-white/95 backdrop-blur-sm border-primary/20" : "shadow-sm"}
          `}
          style={{
            ...provided.draggableProps.style,
            cursor: snapshot.isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Grip Visual Indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center pointer-events-none z-20 group-hover:bg-slate-50/30">
            <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary/40" />
          </div>

          {/* Faixa lateral colorida */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5",
            lead.lead_temperatura === "quente" ? "bg-red-500" :
            lead.lead_temperatura === "morno" ? "bg-orange-400" :
            lead.lead_temperatura === "frio" ? "bg-blue-400" : "bg-slate-200"
          )} />

          <div className="p-3.5 pl-8">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-slate-800 text-[13px] leading-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {lead.nome.toUpperCase()}
                  {lead.origem?.toLowerCase().includes("magalu") && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">M</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1 h-3.5 font-bold uppercase",
                      lead.lead_temperatura === "quente" ? "bg-red-50 text-red-600 border-red-200" :
                      lead.lead_temperatura === "morno" ? "bg-orange-50 text-orange-600 border-orange-200" :
                      "bg-blue-50 text-blue-600 border-blue-200"
                    )}>
                      {lead.lead_temperatura || "Frio"}
                    </Badge>
                    {lead.lead_score_valor && (
                      <span className="font-bold text-slate-500">{lead.lead_score_valor}%</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {renderDiasNaEtapa()}
                {lead.dados_cadastro?.is_retroativo && (
                  <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[9px] px-1 h-4">RETRO</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 opacity-70" />
                  <span className="tabular-nums truncate max-w-[100px]">{lead.celular}</span>
                </div>
                {lead.origem && (
                  <div className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span className="truncate max-w-[80px] font-medium text-slate-400">via {lead.origem.replace("Indicação de ", "")}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-slate-900 tracking-tight">
                    {Number(lead.valor_credito).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {lead.prazo_meses} meses • {lead.tipo_consorcio?.split('(')[0].trim() || 'Consórcio'}
                  </span>
                </div>
                
                {lead.ultimo_contato_ia && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100">
                          <MessageSquare className="w-3 h-3 text-indigo-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-[11px]">
                        IA Jarvis ativa: {lead.ultimo_contato_ia}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {ultimaTratativa && (
                <div className="mt-2 p-2 bg-slate-50/80 rounded-lg border border-slate-100 group-hover:bg-slate-50 transition-colors">
                  <p className="text-[10px] text-slate-600 line-clamp-2 italic leading-relaxed">
                    <span className="font-bold not-italic">[{format(parseISO(ultimaTratativa.created_at), 'dd/MM')}]</span> {ultimaTratativa.descricao}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 border border-white text-[10px] font-bold text-slate-500 uppercase shadow-sm">
                    {lead.responsavel_nome ? lead.responsavel_nome.substring(0, 2) : "FH"}
                  </div>
                  {lead.data_vencimento && (
                    <button onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }} className={cn("text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors", getVencimentoStyle())}>
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(lead.data_vencimento), 'dd/MM')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (onViewFicha) onViewFicha(lead); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                    title="Ver Ficha Completa"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-500 transition-colors"
                    title="Histórico">
                    <NotebookPen className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(lead); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors"
                    title="Editar Lead">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                    title="Excluir">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default LeadCard;
