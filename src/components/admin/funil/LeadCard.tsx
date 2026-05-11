import { Draggable } from "@hello-pangea/dnd";
import {
  Calendar,
  Clock,
  Phone,
  Trash2,
  Pencil,
  NotebookPen,
  Eye,
  DollarSign,
  Tag,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { Lead } from "@/types/funil";
import { Badge } from "@/components/ui/badge";
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

const fmtBRL = (v: any) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const LeadCard = ({
  lead,
  index,
  onDelete,
  onSetVencimento,
  onOpenHistorico,
  ultimaTratativa,
  onEdit,
  onViewFicha,
  compact = false,
}: LeadCardProps) => {
  const temp = (lead.lead_temperatura || "frio").toLowerCase();
  const isDeadLead = ["morto", "perdido"].includes((lead.status || "").toLowerCase());
  const diasNaEtapa = lead.status_updated_at ? differenceInDays(new Date(), parseISO(lead.status_updated_at)) : 0;

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className={cn(
            "group relative bg-white rounded-xl border-2 mb-2 select-none overflow-hidden transition-all duration-200 cursor-pointer",
            snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/40 rotate-1 z-50" : "shadow-sm border-slate-200 hover:border-primary/40",
            isDeadLead && "opacity-60",
            compact ? "h-[85px]" : "h-[155px]" // STRICT FIXED HEIGHTS
          )}
        >
          {/* Temperatura Stripe */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", 
            temp === "quente" ? "bg-red-500" : temp === "morno" ? "bg-orange-400" : "bg-blue-400"
          )} />

          <div className="p-3 pl-5 flex flex-col h-full justify-between">
            {/* Header: Name + Days */}
            <div className="flex items-start justify-between gap-1.5">
              <h3 className="font-bold text-slate-800 text-[12px] uppercase leading-tight truncate flex-1">
                {lead.nome || "LEAD SEM NOME"}
              </h3>
              {diasNaEtapa >= 5 && (
                <span className={cn("shrink-0 flex items-center gap-0.5 px-1 rounded text-[8px] font-black border", 
                  diasNaEtapa >= 15 ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-orange-50 text-orange-600 border-orange-200"
                )}>
                  <Clock className="w-2.5 h-2.5" />
                  {diasNaEtapa}D
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-1.5 h-4 border", 
                temp === "quente" ? "bg-red-50 text-red-600 border-red-200" : temp === "morno" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"
              )}>
                {temp}
              </Badge>
              {lead.lead_score_valor && <span className="text-[9px] font-bold text-slate-400">{lead.lead_score_valor}%</span>}
            </div>

            {!compact && (
              <>
                {/* Contact Row */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Phone className="w-3 h-3 text-blue-500" />
                  <span className="font-bold">{lead.celular || "Sem telefone"}</span>
                </div>

                {/* Financial Row */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="font-black text-[12px] text-green-700">{fmtBRL(lead.valor_credito)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate">
                    <Tag className="w-2.5 h-2.5 text-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400 truncate">{(lead.tipo_consorcio || "Consórcio").split("(")[0]}</span>
                  </div>
                </div>
              </>
            )}

            {/* Footer with Actions on Hover */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-50 min-h-[22px]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[8px] font-black border border-slate-200">
                  { (lead.responsavel_nome || "FH").substring(0,2).toUpperCase() }
                </div>
                {lead.data_vencimento && (
                   <div className="text-[9px] text-slate-500 flex items-center gap-0.5 font-bold">
                    <Calendar className="w-2.5 h-2.5 text-orange-400" />
                    {format(parseISO(lead.data_vencimento), "dd/MM")}
                  </div>
                )}
              </div>

              {/* Actions: Hover Only */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onViewFicha?.(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  title="Ficha"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                  title="Histórico"
                >
                  <NotebookPen className="w-3.5 h-3.5" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default LeadCard;
