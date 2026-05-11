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

// ── Lookup tables ────────────────────────────────────────────────────────────
const TEMP_STRIPE: Record<string, string> = {
  quente: "bg-red-500",
  morno: "bg-orange-400",
  frio: "bg-blue-400",
  perdido: "bg-orange-600",
  morto: "bg-slate-400",
};

const TEMP_BADGE: Record<string, string> = {
  quente: "bg-red-50 text-red-600 border-red-200",
  morno: "bg-orange-50 text-orange-600 border-orange-200",
  frio: "bg-blue-50 text-blue-600 border-blue-200",
  perdido: "bg-orange-50 text-orange-700 border-orange-200",
  morto: "bg-slate-100 text-slate-500 border-slate-200",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function getSafeName(nome: string | null | undefined): string {
  if (!nome) return "LEAD SEM NOME";
  return nome.toUpperCase();
}

function iniciais(nome: string | null | undefined) {
  const safeName = nome || "FH";
  const p = safeName.trim().split(" ");
  return p.length >= 2 ? `${p[0][0]}${p[1][0]}`.toUpperCase() : safeName.substring(0, 2).toUpperCase();
}

function fmtBRL(value: number | string | null | undefined) {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function tipoLabel(tipo: string | null | undefined) {
  if (!tipo) return "Consórcio";
  return tipo.split("(")[0].trim();
}

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

  const diasNaEtapa = lead.status_updated_at
    ? differenceInDays(new Date(), parseISO(lead.status_updated_at))
    : 0;

  const vencStyle = () => {
    if (!lead.data_vencimento) return "text-slate-300";
    const d = differenceInDays(parseISO(lead.data_vencimento), new Date());
    if (d < 0) return "text-red-500 font-bold";
    if (d === 0) return "text-orange-500 font-bold";
    return "text-slate-500";
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className={cn(
            "group relative bg-white rounded-xl border select-none overflow-hidden w-full min-h-[135px]",
            !snapshot.isDragging && "transition-all duration-150",
            !snapshot.isDragging && !isDeadLead &&
              "border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-px",
            isDeadLead && "opacity-55 grayscale-[35%] border-slate-200",
            snapshot.isDragging &&
              "shadow-2xl ring-2 ring-primary/30 scale-[1.02] z-[9999] rotate-[0.5deg] bg-white/95 border-primary/20",
          )}
        >
          {/* ── Temperatura stripe ─────────────────────────────────────── */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 shrink-0", TEMP_STRIPE[temp] || "bg-slate-300")} />

          {/* ── Drag handle area ───────────────────────────────────────── */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center pointer-events-none z-10">
            <GripVertical className="h-3.5 w-3.5 text-slate-200 group-hover:text-primary/30 transition-colors" />
          </div>

          {/* ── Card body ─────────────────────────────────────────────── */}
          <div className="pl-8 pr-3.5 pt-3 pb-2.5 flex flex-col gap-2">

            {/* Row 1 — Name + days alert ─────────────────────────────── */}
            <div className="flex items-start justify-between gap-1.5 min-h-[18px]">
              <h3 className="font-bold text-slate-800 text-[12.5px] leading-tight truncate flex-1 group-hover:text-primary transition-colors">
                {getSafeName(lead.nome)}
                {lead.origem?.toLowerCase().includes("magalu") && (
                  <span className="ml-1 text-[8px] bg-blue-50 text-blue-600 px-0.5 rounded border border-blue-100 not-uppercase font-bold">M</span>
                )}
              </h3>
              {diasNaEtapa >= 5 && (
                <span className={cn(
                  "shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase leading-none whitespace-nowrap border",
                  diasNaEtapa >= 15
                    ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                    : "bg-amber-50 text-amber-600 border-amber-100"
                )}>
                  {diasNaEtapa >= 15 ? <AlertCircle className="w-2 h-2" /> : <Clock className="w-2 h-2" />}
                  {diasNaEtapa}D
                </span>
              )}
            </div>

            {/* Row 2 — Badges ────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 min-h-[14px]">
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] px-1.5 h-4 font-bold uppercase shrink-0 border",
                  TEMP_BADGE[temp] || "bg-slate-50 text-slate-400 border-slate-200"
                )}
              >
                {temp}
              </Badge>
              {lead.lead_score_valor && (
                <span className="text-[9px] font-black text-slate-400 tabular-nums uppercase">
                  {lead.lead_score_valor}%
                </span>
              )}
              {lead.dados_cadastro?.is_retroativo && (
                <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[8px] px-1.5 h-4 shrink-0 font-black">
                  RETRO
                </Badge>
              )}
              {lead.ultimo_contato_ia && (
                <span className="ml-auto shrink-0 flex items-center justify-center w-4 h-4 rounded-md bg-indigo-50 border border-indigo-100">
                  <MessageSquare className="w-2.5 h-2.5 text-indigo-400" />
                </span>
              )}
            </div>

            {/* Row 3 — Phone ─────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-h-[14px]">
              <Phone className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="tabular-nums truncate font-medium">
                {lead.celular || <span className="text-slate-200 italic font-normal text-[10px]">sem celular registrado</span>}
              </span>
            </div>

            {/* Row 4 — Value + Tipo ───────────────────────────────────── */}
            <div className="flex items-center gap-1.5 min-h-[16px]">
              <DollarSign className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={cn(
                "font-black text-[13px] tabular-nums tracking-tight",
                Number(lead.valor_credito || 0) > 0 ? "text-slate-900" : "text-slate-300"
              )}>
                {fmtBRL(lead.valor_credito)}
              </span>
              <span className="text-slate-200 text-[10px] mx-0.5">·</span>
              <Tag className="w-2.5 h-2.5 text-slate-300 shrink-0" />
              <span className="text-[10px] text-slate-400 truncate flex-1 font-medium">
                {tipoLabel(lead.tipo_consorcio)}
              </span>
            </div>

            {/* Row 5 — Last tratativa (fixed height) ─────────────────── */}
            <div className="h-8 flex items-start bg-slate-50/50 rounded-lg p-1.5 border border-slate-100/30 overflow-hidden">
              {ultimaTratativa ? (
                <p className="text-[9.5px] text-slate-400 line-clamp-2 italic leading-tight">
                  <span className="font-bold not-italic text-slate-500">
                    [{format(parseISO(ultimaTratativa.created_at), "dd/MM")}]
                  </span>{" "}
                  {ultimaTratativa.descricao}
                </p>
              ) : (
                <p className="text-[9.5px] text-slate-200 italic">sem tratativa recente...</p>
              )}
            </div>

            {/* Row 6 — Footer: avatar + vencimento + actions ─────────── */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 min-h-[24px]">
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-5.5 h-5.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[8.5px] font-black text-slate-500 shrink-0 shadow-sm">
                  {iniciais(lead.responsavel_nome)}
                </div>
                {/* Vencimento */}
                {lead.data_vencimento ? (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                    className={cn("text-[9.5px] flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100", vencStyle())}
                  >
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(lead.data_vencimento), "dd/MM")}
                  </button>
                ) : (
                  <span className="text-[9.5px] text-slate-200 flex items-center gap-1 opacity-50">
                    <Calendar className="w-3 h-3" />
                    --/--
                  </span>
                )}
              </div>

              {/* Action buttons — appear on hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onViewFicha?.(lead); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors border border-emerald-100/50"
                  title="Ficha"
                >
                  <Eye className="h-3 w-3" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-500 transition-colors border border-sky-100/50"
                  title="Histórico"
                >
                  <NotebookPen className="h-3 w-3" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors border border-blue-100/50"
                  title="Editar"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
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
