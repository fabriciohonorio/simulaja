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
  MessageSquare,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
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
const safeFormatBRL = (v: any) => {
  try {
    const num = typeof v === "number" ? v : parseFloat(String(v || 0).replace(/[^\d.-]/g, ""));
    return (num || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  } catch (e) { return "R$ 0"; }
};

const safeDate = (d: any) => {
  if (!d) return null;
  try {
    const p = parseISO(d);
    return isValid(p) ? p : null;
  } catch (e) { return null; }
};

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
  compact = false,
}: LeadCardProps) => {
  const temp = (lead.lead_temperatura || "frio").toLowerCase();
  const isDeadLead = ["morto", "perdido"].includes((lead.status || "").toLowerCase());
  
  const statusDate = safeDate(lead.status_updated_at || lead.created_at);
  const diasNaEtapa = statusDate ? differenceInDays(new Date(), statusDate) : 0;
  const vencDate = safeDate(lead.data_vencimento);

  const initials = (lead.responsavel_nome || "FH").substring(0, 2).toUpperCase();
  const waLink = `https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=Olá!`;

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
            snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/40 rotate-1 z-[999]" : "shadow-sm border-slate-200 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5",
            isDeadLead && "opacity-60 grayscale-[30%]",
            compact ? "h-[95px]" : "h-[165px]" // PADRONIZAÇÃO RÍGIDA
          )}
        >
          {/* Faixa de Temperatura */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 z-10", 
            temp === "quente" ? "bg-red-500" : temp === "morno" ? "bg-orange-400" : "bg-blue-400"
          )} />

          <div className="p-3 pl-5 flex flex-col h-full">
            {/* Header: Nome + Badge Urgência */}
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
              <h3 className="font-extrabold text-slate-800 text-[12px] uppercase leading-tight truncate flex-1 tracking-tight">
                {lead.nome || "LEAD SEM NOME"}
              </h3>
              {diasNaEtapa >= 5 && (
                <div className={cn("shrink-0 flex items-center justify-center rounded-full text-[9px] font-black w-6 h-6 border shadow-sm", 
                  diasNaEtapa >= 30 ? "bg-red-500 text-white animate-pulse" : 
                  diasNaEtapa >= 15 ? "bg-orange-500 text-white" : "bg-amber-100 text-amber-700 border-amber-200"
                )}>
                  {diasNaEtapa}d
                </div>
              )}
            </div>

            {/* Status Info */}
            <div className="flex items-center gap-1.5 mb-2">
              <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 h-4.5 border-2", 
                temp === "quente" ? "bg-red-50 text-red-600 border-red-200" : 
                temp === "morno" ? "bg-orange-50 text-orange-600 border-orange-200" : 
                "bg-blue-50 text-blue-600 border-blue-200"
              )}>
                {temp}
              </Badge>
              {lead.lead_score_valor && <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100 uppercase tracking-tighter">{lead.lead_score_valor}%</span>}
            </div>

            {!compact ? (
              <>
                {/* Detalhes Médios */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600 mb-2 font-bold">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  {lead.celular || "Sem número"}
                </div>

                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-200 shadow-sm">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-black text-[13px] text-green-800 tracking-tighter">{safeFormatBRL(lead.valor_credito)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate flex-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 truncate">{(lead.tipo_consorcio || "Consórcio").split("(")[0]}</span>
                  </div>
                </div>

                {/* Última Tratativa (Sempre presente) */}
                <div className="h-9 bg-slate-50/50 rounded-lg p-2 border border-slate-100 flex items-center overflow-hidden mb-auto">
                  {ultimaTratativa ? (
                    <p className="text-[10px] text-slate-500 italic line-clamp-2 leading-tight">
                      <span className="font-black text-primary/60 not-italic">[{format(parseISO(ultimaTratativa.created_at), "dd/MM")}]</span> {ultimaTratativa.descricao}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-300 italic">Nenhuma tratativa registrada...</p>
                  )}
                </div>
              </>
            ) : (
              <div className="font-black text-[12px] text-green-700 mb-auto">{safeFormatBRL(lead.valor_credito)}</div>
            )}

            {/* Footer: ÍCONES SOLICITADOS (Sempre Visíveis) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-black shadow-sm border border-primary/20" title={lead.responsavel_nome}>
                  {initials}
                </div>
              </div>

              {/* GRUPO DE FUNÇÕES: WHATSAPP, TRATATIVA, AGENDAMENTO, EDITAR, EXCLUIR */}
              <div className="flex items-center gap-0.5">
                {/* Agendamento */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                  className={cn("w-7 h-7 rounded-md flex items-center justify-center border transition-all hover:scale-110", 
                    vencDate ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-slate-50 text-slate-300 border-slate-100"
                  )}
                  title="Agendar Retorno"
                >
                  <Calendar className="w-4 h-4" />
                </button>

                {/* WhatsApp */}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-all hover:scale-110"
                  title="Abrir WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>

                {/* Histórico/Tratativa */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-all hover:scale-110"
                  title="Ver Histórico"
                >
                  <NotebookPen className="w-4 h-4" />
                </button>

                {/* Ficha */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onViewFicha?.(lead); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all hover:scale-110"
                  title="Ver Ficha"
                >
                  <ClipboardList className="w-4 h-4" />
                </button>

                {/* Editar/Excluir (Mais discretos) */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-blue-500 transition-all"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"
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
