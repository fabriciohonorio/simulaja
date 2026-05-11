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

// ── Ultra-Safe Helpers ───────────────────────────────────────────────────────
const safeFormatBRL = (v: any) => {
  try {
    const cleanValue = String(v || "0").replace(/[^\d.-]/g, "");
    const num = parseFloat(cleanValue) || 0;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  } catch (e) { return "R$ 0"; }
};

const safeDate = (d: any) => {
  if (!d) return null;
  try {
    const p = typeof d === "string" ? parseISO(d) : new Date(d);
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
  // Garantia absoluta de que o lead existe
  if (!lead || !lead.id) return null;

  const temp = String(lead.lead_temperatura || "frio").toLowerCase();
  const isDeadLead = ["morto", "perdido"].includes(String(lead.status || "").toLowerCase());
  
  const statusDate = safeDate(lead.status_updated_at || lead.created_at);
  const diasNaEtapa = statusDate ? differenceInDays(new Date(), statusDate) : 0;
  const vencDate = safeDate(lead.data_vencimento);

  const initials = String(lead.responsavel_nome || "FH").substring(0, 2).toUpperCase();
  const waLink = `https://wa.me/55${String(lead.celular || "").replace(/\D/g, "")}?text=Olá!`;

  // Altura fixa garantida por CSS inline para evitar qualquer sobrescrita
  const cardHeight = compact ? "90px" : "160px";

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ 
            ...provided.draggableProps.style, 
            height: cardHeight, 
            minHeight: cardHeight, 
            maxHeight: cardHeight 
          }}
          className={cn(
            "group relative bg-white rounded-xl border-2 mb-2 select-none overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing",
            snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/40 rotate-1 z-[999] opacity-100" : "shadow-sm border-slate-200 hover:border-primary/50",
            isDeadLead && "opacity-60 grayscale-[30%]"
          )}
        >
          {/* Faixa de Temperatura lateral */}
          <div 
            className={cn("absolute left-0 top-0 bottom-0 w-1.5 z-10", 
              temp === "quente" ? "bg-red-500" : temp === "morno" ? "bg-orange-400" : "bg-blue-400"
            )} 
          />

          <div className="p-3 pl-5 flex flex-col h-full w-full">
            {/* Linha 1: Nome + Badge Urgência */}
            <div className="flex items-start justify-between gap-1.5 h-5 overflow-hidden">
              <h3 className="font-extrabold text-slate-800 text-[12px] uppercase leading-none truncate flex-1 tracking-tight">
                {String(lead.nome || "LEAD SEM NOME")}
              </h3>
              {diasNaEtapa >= 5 && (
                <div className={cn("shrink-0 flex items-center justify-center rounded-full text-[9px] font-black w-5 h-5 border shadow-sm translate-y-[-2px]", 
                  diasNaEtapa >= 30 ? "bg-red-500 text-white animate-pulse" : 
                  diasNaEtapa >= 15 ? "bg-orange-500 text-white" : "bg-amber-100 text-amber-700 border-amber-200"
                )}>
                  {diasNaEtapa}d
                </div>
              )}
            </div>

            {/* Linha 2: Temperatura + Score */}
            <div className="flex items-center gap-1.5 h-5 mt-1">
              <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-1.5 h-4 border", 
                temp === "quente" ? "bg-red-50 text-red-600 border-red-200" : 
                temp === "morno" ? "bg-orange-50 text-orange-600 border-orange-200" : 
                "bg-blue-50 text-blue-600 border-blue-200"
              )}>
                {temp}
              </Badge>
              {lead.lead_score_valor && (
                <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1 rounded border border-slate-100 uppercase">
                  {lead.lead_score_valor}%
                </span>
              )}
            </div>

            {/* Conteúdo Central Variável (Normal vs Compacto) */}
            {!compact ? (
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
                {/* Telefone */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold leading-none">
                  <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{String(lead.celular || "Sem número")}</span>
                </div>

                {/* Crédito e Tipo */}
                <div className="flex items-center gap-1.5 leading-none">
                  <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                    <DollarSign className="w-3 h-3 text-green-600 shrink-0" />
                    <span className="font-black text-[12px] text-green-800 tracking-tighter">{safeFormatBRL(lead.valor_credito)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate flex-1">
                    <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                    <span className="text-[9px] font-bold text-slate-500 truncate">
                      {String(lead.tipo_consorcio || "Consórcio").split("(")[0]}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center">
                 <span className="font-black text-[13px] text-green-700">{safeFormatBRL(lead.valor_credito)}</span>
              </div>
            )}

            {/* Rodapé: Responsável e Ícones Solicitados */}
            <div className="h-8 mt-auto pt-1.5 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-black shadow-sm border border-primary/20">
                  {initials}
                </div>
                {vencDate && (
                  <div className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500">
                    <Calendar className="w-3 h-3 text-orange-400" />
                    {format(vencDate, "dd/MM")}
                  </div>
                )}
              </div>

              {/* Botões de Ação: WhatsApp, Tratativa, Agendamento, Ficha, Editar, Excluir */}
              <div className="flex items-center gap-0.5">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                  className={cn("w-6 h-6 rounded flex items-center justify-center border transition-all hover:bg-orange-50", 
                    vencDate ? "text-orange-600 border-orange-200" : "text-slate-300 border-slate-100"
                  )}
                  title="Agendar"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 rounded flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                  title="WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>

                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100"
                  title="Tratativa/Histórico"
                >
                  <NotebookPen className="w-3.5 h-3.5" />
                </button>

                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onViewFicha?.(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                  title="Ficha"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                </button>

                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-blue-500"
                  title="Editar"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
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
