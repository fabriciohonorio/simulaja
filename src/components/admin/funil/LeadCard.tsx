import { Draggable } from "@hello-pangea/dnd";
import {
  Calendar,
  Clock,
  Phone,
  Trash2,
  Pencil,
  NotebookPen,
  GripVertical,
  Eye,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Tag,
  User,
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const iniciais = (nome: string | null | undefined) => {
  const safe = nome || "FH";
  const p = safe.trim().split(" ");
  return p.length >= 2 ? `${p[0][0]}${p[1][0]}`.toUpperCase() : safe.substring(0, 2).toUpperCase();
};

const fmtBRL = (v: any) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ────────────────────────────────────────────────────────────────────────────
const LeadCard = ({
  lead,
  index,
  onDelete,
  onSetVencimento,
  onOpenHistorico,
  ultimaTratativa,
  onEdit,
  onViewFicha,
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
            "group relative bg-white rounded-xl border-2 mb-2 select-none overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing",
            snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/40 rotate-1 z-50 cursor-grabbing" : "shadow-sm border-slate-200 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5",
            isDeadLead && "opacity-60"
          )}
        >
          {/* Faixa de temperatura */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", 
            temp === "quente" ? "bg-red-500" : temp === "morno" ? "bg-orange-400" : "bg-blue-400"
          )} />

          <div className="p-4 pl-5">
            {/* Linha 1: Nome e Alerta de Tempo */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-black text-slate-800 text-[13px] uppercase leading-tight truncate">
                {lead.nome || "SEM NOME"}
              </h3>
              {diasNaEtapa >= 5 && (
                <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border", 
                  diasNaEtapa >= 15 ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-orange-100 text-orange-700 border-orange-200"
                )}>
                  <Clock className="w-2.5 h-2.5" />
                  {diasNaEtapa}D
                </span>
              )}
            </div>

            {/* Linha 2: Badges */}
            <div className="flex items-center gap-2 mb-3">
              <Badge className={cn("text-[9px] font-black uppercase px-2 h-5", 
                temp === "quente" ? "bg-red-100 text-red-600 border-red-200" : temp === "morno" ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-blue-100 text-blue-600 border-blue-200"
              )}>
                {temp}
              </Badge>
              {lead.lead_score_valor && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{lead.lead_score_valor}%</span>}
              {lead.dados_cadastro?.is_retroativo && <Badge className="bg-purple-600 text-white text-[8px] h-5">RETRO</Badge>}
            </div>

            {/* Linha 3: Telefone */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
              <Phone className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-bold">{lead.celular || "(00) 00000-0000"}</span>
            </div>

            {/* Linha 4: Valor e Tipo */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-100">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
                <span className="font-black text-[14px] text-green-700 tracking-tighter">{fmtBRL(lead.valor_credito)}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate">
                <Tag className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 truncate">{(lead.tipo_consorcio || "Imóvel").split("(")[0]}</span>
              </div>
            </div>

            {/* Linha 5: Última Tratativa */}
            <div className="bg-slate-50 rounded-lg p-2 mb-3 border border-slate-100 min-h-[40px] flex items-center">
              {ultimaTratativa ? (
                <p className="text-[10px] text-slate-500 italic line-clamp-2 leading-tight">
                  <span className="font-black text-primary/60 not-italic">[{format(parseISO(ultimaTratativa.created_at), "dd/MM")}]</span> {ultimaTratativa.descricao}
                </p>
              ) : (
                <p className="text-[10px] text-slate-300 italic">Sem tratativas registradas</p>
              )}
            </div>

            {/* Linha 6: Footer (Responsável, Agendamento e Ações) */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-sm" title={lead.responsavel_nome || "Sem responsável"}>
                  {iniciais(lead.responsavel_nome)}
                </div>
                
                {/* Botão de Agendamento (Calendar) */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                  className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm text-[10px] font-bold transition-all hover:scale-105 cursor-pointer", 
                    lead.data_vencimento ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {lead.data_vencimento ? format(parseISO(lead.data_vencimento), "dd/MM") : "Agendar"}
                </button>
              </div>

              {/* Grupo de Ações */}
              <div className="flex items-center gap-1">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onViewFicha?.(lead); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all hover:scale-110 cursor-pointer"
                  title="Ficha do Lead"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500 text-white hover:bg-sky-600 shadow-sm transition-all hover:scale-110 cursor-pointer"
                  title="Histórico / Tratativa"
                >
                  <NotebookPen className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition-all hover:scale-110 cursor-pointer"
                  title="Editar Lead"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 transition-all hover:scale-110 cursor-pointer"
                  title="Excluir Lead"
                >
                  <Trash2 className="w-4 h-4" />
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
