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

const TEMP_BG: Record<string, string> = {
  quente: "bg-red-500",
  morno:  "bg-orange-400",
  frio:   "bg-blue-400",
};

const TEMP_BADGE: Record<string, string> = {
  quente: "bg-red-50 text-red-600 border-red-200",
  morno:  "bg-orange-50 text-orange-600 border-orange-200",
  frio:   "bg-blue-50 text-blue-600 border-blue-200",
};

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
  const temp = lead.lead_temperatura?.toLowerCase() || "frio";
  const isDeadLead = ["morto", "perdido"].includes(lead.status?.toLowerCase() || "");

  const diasNaEtapa = lead.status_updated_at
    ? differenceInDays(new Date(), parseISO(lead.status_updated_at))
    : 0;

  const vencimentoStyle = () => {
    if (!lead.data_vencimento) return "";
    const d = differenceInDays(parseISO(lead.data_vencimento), new Date());
    if (d < 0) return "text-red-500 font-bold";
    if (d === 0) return "text-orange-500 font-bold";
    return "text-slate-500";
  };

  const iniciais = (nome: string) => {
    const p = nome.trim().split(" ");
    return p.length >= 2 ? `${p[0][0]}${p[1][0]}` : nome.substring(0, 2);
  };

  const valorFmt = Number(lead.valor_credito || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  const tipoShort = (lead.tipo_consorcio || "Consórcio").split("(")[0].trim().split(" ").slice(-1)[0];

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className={cn(
            // Base: fixed structure, never grow/shrink differently
            "group relative bg-white rounded-xl border select-none overflow-hidden",
            "w-full", // always fill column width
            // Transitions only when not dragging (prevents jank)
            !snapshot.isDragging && "transition-shadow duration-150",
            // Normal state
            !snapshot.isDragging && !isDeadLead &&
              "border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-px",
            // Dead lead
            isDeadLead && "opacity-60 grayscale-[40%] border-slate-200",
            // Dragging state
            snapshot.isDragging &&
              "shadow-2xl ring-2 ring-primary/30 scale-[1.02] z-[9999] rotate-[0.5deg] bg-white/95 border-primary/20 cursor-grabbing",
          )}
        >
          {/* Temperatura stripe — always present, fixes left spacing */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1",
              TEMP_BG[temp] || "bg-slate-300"
            )}
          />

          {/* Grip handle area */}
          <div className="absolute left-0 top-0 bottom-0 w-7 flex items-center justify-center pointer-events-none z-10">
            <GripVertical className="h-3 w-3 text-slate-300 group-hover:text-primary/40 transition-colors" />
          </div>

          {/* Card body — fixed padding structure */}
          <div className="pl-7 pr-3 pt-2.5 pb-2">
            {/* Row 1: Name + alert badge */}
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <h3 className="font-bold text-slate-800 text-[12px] leading-tight truncate flex-1 group-hover:text-primary transition-colors">
                {lead.nome.toUpperCase()}
              </h3>
              {diasNaEtapa >= 5 && (
                <span className={cn(
                  "shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-black uppercase leading-none",
                  diasNaEtapa >= 15
                    ? "bg-red-100 text-red-700 border border-red-200 animate-bounce"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                )}>
                  {diasNaEtapa >= 15 && <AlertCircle className="w-2 h-2" />}
                  {diasNaEtapa}d
                </span>
              )}
            </div>

            {/* Row 2: Badges */}
            <div className="flex items-center gap-1 mb-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] px-1 h-3.5 font-bold uppercase shrink-0",
                  TEMP_BADGE[temp] || "bg-slate-50 text-slate-600 border-slate-200"
                )}
              >
                {temp}
              </Badge>
              {lead.lead_score_valor && (
                <span className="text-[8px] font-bold text-slate-400">
                  {lead.lead_score_valor}%
                </span>
              )}
              {lead.dados_cadastro?.is_retroativo && (
                <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[7px] px-1 h-3.5 shrink-0">
                  RETRO
                </Badge>
              )}
              {lead.ultimo_contato_ia && (
                <span className="ml-auto shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded bg-indigo-50 border border-indigo-100">
                  <MessageSquare className="w-2 h-2 text-indigo-400" />
                </span>
              )}
            </div>

            {/* Row 3: Phone + Value — always visible, fixed height */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
              <div className="flex items-center gap-1">
                <Phone className="w-2.5 h-2.5 opacity-60 shrink-0" />
                <span className="tabular-nums truncate max-w-[90px]">
                  {lead.celular || "—"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-black text-slate-800 text-[11px]">{valorFmt}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 text-[9px] truncate max-w-[50px]">{tipoShort}</span>
              </div>
            </div>

            {/* Row 4: Última tratativa — fixed 2-line clamp, always has space */}
            <div className="h-7 mb-2">
              {ultimaTratativa ? (
                <p className="text-[9px] text-slate-400 line-clamp-2 italic leading-snug">
                  <span className="font-bold not-italic text-slate-500">
                    [{format(parseISO(ultimaTratativa.created_at), "dd/MM")}]
                  </span>{" "}
                  {ultimaTratativa.descricao}
                </p>
              ) : (
                <p className="text-[9px] text-slate-200 italic">sem tratativa registrada</p>
              )}
            </div>

            {/* Row 5: Footer — avatar + vencimento + actions */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                  {iniciais(lead.responsavel_nome || "FH")}
                </div>
                {lead.data_vencimento && (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                    className={cn("text-[9px] flex items-center gap-0.5 px-1 rounded hover:bg-slate-100 transition-colors", vencimentoStyle())}
                  >
                    <Calendar className="w-2.5 h-2.5" />
                    {format(parseISO(lead.data_vencimento), "dd/MM")}
                  </button>
                )}
              </div>

              {/* Action buttons — only visible on hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onViewFicha?.(lead); }}
                  className="w-5 h-5 rounded flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-500 transition-colors"
                  title="Ficha"
                >
                  <Eye className="h-2.5 w-2.5" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-5 h-5 rounded flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-400 transition-colors"
                  title="Histórico"
                >
                  <NotebookPen className="h-2.5 w-2.5" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
                  className="w-5 h-5 rounded flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-400 transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-50 text-slate-200 hover:text-red-400 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-2.5 w-2.5" />
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
