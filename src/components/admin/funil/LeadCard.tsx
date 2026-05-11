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
  MapPin,
  TrendingUp,
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
    if (d < 0) return "text-red-600 font-bold";
    if (d === 0) return "text-orange-600 font-bold";
    return "text-slate-600 font-medium";
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style }}
          className={cn(
            "group relative bg-white rounded-xl border select-none overflow-hidden w-full min-h-[145px]",
            !snapshot.isDragging && "transition-all duration-200",
            !snapshot.isDragging && !isDeadLead &&
              "border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/20",
            isDeadLead && "opacity-60 grayscale-[30%] border-slate-200",
            snapshot.isDragging &&
              "shadow-2xl ring-2 ring-primary/40 scale-[1.03] z-[9999] rotate-[1deg] bg-white border-primary/30",
          )}
        >
          {/* ── Drag Handle (Dedicated Area) ─────────────────────────── */}
          <div 
            {...provided.dragHandleProps}
            className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors z-20"
          >
            <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-primary/40 transition-colors" />
          </div>

          {/* ── Temperatura stripe ─────────────────────────────────────── */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 shrink-0 z-10", TEMP_STRIPE[temp] || "bg-slate-300")} />

          {/* ── Card body ─────────────────────────────────────────────── */}
          <div className="pl-10 pr-4 pt-3.5 pb-3 flex flex-col gap-2.5">

            {/* Row 1 — Name + days alert ─────────────────────────────── */}
            <div className="flex items-start justify-between gap-1.5 min-h-[18px]">
              <h3 className="font-extrabold text-slate-800 text-[13px] leading-tight truncate flex-1 group-hover:text-primary transition-colors tracking-tight">
                {getSafeName(lead.nome)}
                {lead.origem?.toLowerCase().includes("magalu") && (
                  <span className="ml-1.5 text-[8px] bg-blue-600 text-white px-1 rounded-sm font-black">M</span>
                )}
              </h3>
              {diasNaEtapa >= 5 && (
                <span className={cn(
                  "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase leading-none border shadow-sm",
                  diasNaEtapa >= 15
                    ? "bg-red-500 text-white border-red-600 animate-pulse"
                    : "bg-amber-100 text-amber-700 border-amber-200"
                )}>
                  {diasNaEtapa >= 15 ? <AlertCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                  {diasNaEtapa}D
                </span>
              )}
            </div>

            {/* Row 2 — Badges ────────────────────────────────────────── */}
            <div className="flex items-center gap-2 min-h-[14px]">
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-2 h-4.5 font-black uppercase shrink-0 border-2",
                  TEMP_BADGE[temp] || "bg-slate-50 text-slate-400 border-slate-200"
                )}
              >
                {temp}
              </Badge>
              {lead.lead_score_valor && (
                <span className="flex items-center gap-0.5 text-[9px] font-black text-slate-500 tabular-nums uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {lead.lead_score_valor}%
                </span>
              )}
              {lead.dados_cadastro?.is_retroativo && (
                <Badge className="bg-purple-600 text-white border-none text-[8px] px-1.5 h-4.5 shrink-0 font-black shadow-sm">
                  RETRO
                </Badge>
              )}
              {lead.ultimo_contato_ia && (
                <div className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 shadow-md border border-indigo-400">
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Row 3 — Phone ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2 text-[11px] text-slate-600 min-h-[14px]">
              <Phone className="w-3.5 h-3.5 text-primary/60 shrink-0" />
              <span className="tabular-nums truncate font-bold">
                {lead.celular || <span className="text-slate-300 font-normal italic">sem contato</span>}
              </span>
            </div>

            {/* Row 4 — Value + Tipo ───────────────────────────────────── */}
            <div className="flex items-center gap-2 min-h-[16px]">
              <DollarSign className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span className={cn(
                "font-black text-[14px] tabular-nums tracking-tighter",
                Number(lead.valor_credito || 0) > 0 ? "text-slate-900" : "text-slate-300"
              )}>
                {fmtBRL(lead.valor_credito)}
              </span>
              <span className="text-slate-300 text-[10px] mx-0.5">|</span>
              <Tag className="w-3 h-3 text-primary/50 shrink-0" />
              <span className="text-[11px] text-slate-500 truncate flex-1 font-bold">
                {tipoLabel(lead.tipo_consorcio)}
              </span>
            </div>

            {/* Row 5 — Last tratativa (fixed height) ─────────────────── */}
            <div className="h-9 flex items-start bg-slate-50 rounded-lg p-2 border border-slate-200/50 overflow-hidden">
              {ultimaTratativa ? (
                <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-tight">
                  <span className="font-black not-italic text-primary/70">
                    [{format(parseISO(ultimaTratativa.created_at), "dd/MM")}]
                  </span>{" "}
                  {ultimaTratativa.descricao}
                </p>
              ) : (
                <p className="text-[10px] text-slate-300 italic">Nenhuma interação registrada...</p>
              )}
            </div>

            {/* Row 6 — Footer: avatar + vencimento + actions ─────────── */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 min-h-[26px]">
              <div className="flex items-center gap-2.5">
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-sm border border-primary/20">
                  {iniciais(lead.responsavel_nome)}
                </div>
                {/* Vencimento */}
                {lead.data_vencimento ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                    className={cn("text-[10px] flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors border shadow-sm", vencStyle())}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(lead.data_vencimento), "dd/MM")}
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-200 flex items-center gap-1.5 px-2 py-1">
                    <Calendar className="w-3.5 h-3.5" />
                    --/--
                  </span>
                )}
              </div>

              {/* Action buttons — always visible or better hover */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onViewFicha?.(lead); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  title="Ficha"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-sm"
                  title="Histórico"
                >
                  <NotebookPen className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-red-600 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
