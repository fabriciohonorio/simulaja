import React, { useState } from "react";
import { Phone, MapPin, Calendar as CalendarIcon, TrendingUp, Trash2, Bell, NotebookPen, Plus, Clock } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { formatLeadValue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { Lead, HistoricoContato, Membro } from "@/types/funil";
import { TEMP_EMOJIS, TEMP_LABELS, normalizeStatus } from "./constants";

const TEMP_STRIPE: Record<string, string> = {
  quente: "bg-red-500",
  morno: "bg-yellow-400",
  frio: "bg-blue-500",
  perdido: "bg-orange-600",
  morto: "bg-gray-400",
};

const SCORE_SHORT: Record<string, string> = {
  premium: "Premium",
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

export function KanbanEditableBadge({
  leadId, field, value, label, inputType = "text", hideLabel = false, compact = false,
  isEditingField, setIsEditingField, onUpdateField,
}: {
  leadId: string;
  field: string;
  value: string | null;
  label?: string;
  inputType?: string;
  hideLabel?: boolean;
  compact?: boolean;
  isEditingField: { field: string; value: string } | null;
  setIsEditingField: (v: { field: string; value: string } | null) => void;
  onUpdateField?: (leadId: string, field: string, value: string) => void;
}) {
  const [tempValue, setTempValue] = useState(value || "");

  const getDisplayLabel = () => {
    if (label) return label;
    if (field === "grupo") return "G";
    if (field === "cota") return "C";
    if (field === "administradora") return "ADM";
    if (field === "data_adesao") return "📅";
    return field.toUpperCase();
  };

  const getDisplayValue = () => {
    if (!value) return "—";
    if (inputType === "date" && value.includes("-")) {
      const [y, m, d] = value.split("-");
      return `${d}/${m}/${y.slice(2)}`;
    }
    return value;
  };

  if (isEditingField?.field === field) {
    return (
      <input
        type={inputType}
        autoFocus
        className={`${compact ? "h-4 text-[8px]" : "h-5 text-[10px]"} ${inputType === "date" ? "w-28" : "w-16"} p-0.5 bg-white border border-orange-300 rounded outline-none ring-1 ring-orange-200`}
        value={tempValue}
        placeholder="..."
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          setIsEditingField(null);
          if (tempValue !== (value || "")) onUpdateField?.(leadId, field, tempValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { setIsEditingField(null); onUpdateField?.(leadId, field, tempValue); }
          if (e.key === "Escape") setIsEditingField(null);
        }}
      />
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setIsEditingField({ field, value: value || "" }); }}
      className={`bg-orange-50 text-orange-600 border border-orange-200 font-black rounded shadow-sm flex items-center gap-1 hover:bg-orange-100 hover:border-orange-300 transition-all cursor-pointer ${compact ? "text-[7px] px-0.5" : "text-[9px] px-1"}`}
    >
      {hideLabel ? (
        <span className="text-orange-700">{getDisplayValue()}</span>
      ) : (
        <>{getDisplayLabel()}: <span className="text-orange-700">{getDisplayValue()}</span></>
      )}
    </button>
  );
}

export function LeadCard({
  lead,
  snapshot,
  provided,
  onDelete,
  onSetVencimento,
  onOpenHistorico,
  onAssignLead,
  membros = [],
  isManager = false,
  ultimaTratativa,
  compact = false,
  onUpdateField,
}: {
  lead: Lead;
  snapshot: any;
  provided: any;
  onDelete: (id: string, nome: string) => void;
  onSetVencimento: (lead: Lead) => void;
  onOpenHistorico: (lead: Lead) => void;
  onAssignLead?: (leadId: string, responsavelId: string) => void;
  membros?: Membro[];
  isManager?: boolean;
  ultimaTratativa?: HistoricoContato | null;
  compact?: boolean;
  onUpdateField?: (leadId: string, field: string, value: string) => void;
}) {
  const [isEditingField, setIsEditingField] = useState<{field: string, value: string} | null>(null);

  const isToday = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const isPastDue = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const statusNormalized = normalizeStatus(lead.status);
  const isFechado = statusNormalized === "fechado";
  const vencHoje = isToday(lead.data_vencimento);
  const vencAtrasado = isPastDue(lead.data_vencimento);

  const dataReferenciaDias = isFechado && lead.status_updated_at ? parseISO(lead.status_updated_at) : new Date();
  const diasDesdeEntrada = lead.created_at ? Math.max(0, differenceInDays(dataReferenciaDias, parseISO(lead.created_at))) : 0;

  const timeInfoText = () => {
    if (statusNormalized === "novo_lead") {
      return (
        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
          Entrada: {lead.created_at ? format(parseISO(lead.created_at), "dd/MM") : '--/--'} · {diasDesdeEntrada}d
        </span>
      );
    }
    if (statusNormalized === "fechado") {
      return (
        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-emerald-200">
          🏆 Vendido: {lead.status_updated_at ? format(parseISO(lead.status_updated_at), "dd/MM/yy") : '--/--'} · {diasDesdeEntrada}d
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-red-100">
        <Clock className="w-2.5 h-2.5" /> {diasDesdeEntrada} {diasDesdeEntrada === 1 ? 'dia' : 'dias'}
      </span>
    );
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`group relative bg-background border border-border/60 rounded-xl overflow-hidden transition-all duration-300
        ${compact ? "text-[11px]" : "text-sm"}
        ${statusNormalized === "fechado" ? "border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "hover:shadow-md hover:border-primary/20"}
        ${statusNormalized === "morto" ? "opacity-60" : ""}
        ${snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/40 scale-105 z-[9999] rotate-2 bg-white/95 backdrop-blur-sm" : "shadow-sm"}
      `}
    >
      {/* Faixa lateral colorida */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        statusNormalized === "fechado"
          ? "bg-green-500"
          : TEMP_STRIPE[lead.lead_temperatura || "quente"] || "bg-red-500"
      }`} />

      {/* Conteúdo com padding-left maior */}
      <div className={compact ? "pl-2.5 pr-2 pt-1.5 pb-1 space-y-0.5" : "pl-3.5 pr-2 pt-2.5 pb-2 space-y-1.5"}>
        
        {/* Header: Nome + Score */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className={`font-black truncate text-foreground ${compact ? "text-[10px]" : "text-[11px]"}`}>{lead.nome}</p>
              
              {/* Pill Única Score + Temperatura */}
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full border ${
                lead.lead_score_valor === "premium" || lead.lead_score_valor === "alto"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : lead.lead_score_valor === "medio"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
              }`}>
                {lead.propensity_score !== null ? `${lead.propensity_score}%` : SCORE_SHORT[lead.lead_score_valor || "baixo"]}
                {" · "} <span className="text-xs leading-none">{TEMP_EMOJIS[lead.lead_temperatura || "quente"]}</span>
              </span>
            </div>
            
            {/* Inline link celular / indicador */}
            {!compact && (
              <div className="flex items-center gap-1 text-[10px] text-slate-700 font-bold mt-0.5">
                {lead.indicador_nome && <span className="opacity-70">via {lead.indicador_nome} · </span>}
                {lead.celular && (
                  <a
                    href={`tel:${lead.celular.replace(/\D/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary/70 hover:text-primary hover:underline flex items-center"
                  >
                    <Phone className="h-3 w-3 mr-0.5 inline" />
                    {lead.celular}
                  </a>
                )}
              </div>
            )}
            
            {/* Timing info */}
            <div className="flex items-center gap-1 mt-1 text-[9px]">
               {timeInfoText()}
            </div>
          </div>
        </div>

        {/* Linha de Valor + Prazo */}
        <div className="flex items-baseline gap-1">
          <p className={`text-primary font-black ${compact ? "text-[10px]" : "text-sm"}`}>
            {formatLeadValue(Number(lead.valor_credito) || 0)}
          </p>
          {!compact && (
            <span className="text-[9px] text-slate-400 font-bold">
              · {lead.prazo_meses}m
            </span>
          )}
        </div>

        {/* Última tratativa */}
        {ultimaTratativa ? (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
            className="w-full text-left mt-1"
          >
            <div className={`flex items-start gap-1 rounded bg-muted/50 hover:bg-muted transition-colors ${compact ? "px-1 py-0.5" : "px-2 py-1.5"}`}>
              <NotebookPen className={`text-muted-foreground mt-0.5 shrink-0 ${compact ? "h-2 w-2" : "h-3 w-3"}`} />
              <div className="min-w-0 flex-1">
                <p className={`${compact ? "text-[8px]" : "text-[10px]"} font-black text-slate-800 truncate`}>
                  {ultimaTratativa!.observacao || "Sem observação"}
                </p>
              </div>
            </div>
          </button>
        ) : (!compact && !isFechado) && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
            className="w-full flex items-center gap-1 px-1.5 py-1 mt-1 rounded border border-dashed border-border/70 text-[9px] text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-colors"
          >
            <Plus className="h-3 w-3" /> Tratativa
          </button>
        )}

        {/* Agendamento (Strip do Calendar) */}
        {lead.data_vencimento && !isFechado && (
          <div className={`flex items-center justify-between px-2 py-1 text-[10px] font-medium border-y mt-2 ${
            vencAtrasado
              ? "bg-red-50 border-red-100 text-red-700"
              : vencHoje
                ? "bg-amber-50 border-amber-100 text-amber-700"
                : "bg-blue-50 border-blue-100 text-blue-700"
          }`}>
            <span className="flex items-center gap-1">
              {(vencHoje || vencAtrasado) && <Bell className="h-3 w-3 animate-pulse" />}
              <CalendarIcon className="h-3 w-3" />
              {format(parseISO(lead.data_vencimento), "dd/MM")}
              {vencAtrasado && !compact && " — ATRASADO"}
              {vencHoje && !compact && " — Hoje"}
            </span>
            {(lead as any).gcal_event_id && (
              <span className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[9px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Google Cal
              </span>
            )}
          </div>
        )}

        {/* Action strip: Avatar and Buttons */}
        {((isManager && onAssignLead) || lead.responsavel_id) ? (
            isEditingField?.field === "responsavel" ? (
             <div className="flex items-center justify-between pt-1.5 border-t border-border/40 mt-1">
              <select
                className="w-full text-[10px] p-1 rounded border border-border bg-background"
                value={lead.responsavel_id || "none"}
                onChange={(e) => {
                  onAssignLead?.(lead.id, e.target.value);
                  setIsEditingField(null);
                }}
                onBlur={() => setIsEditingField(null)}
                autoFocus
              >
                <option value="none">Sem responsável</option>
                {membros.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome_completo}</option>
                ))}
              </select>
             </div>
            ) : (
            <div className="flex items-center justify-between pt-1 border-t border-border/20 mt-1">
              <div
                className="flex items-center gap-1.5 cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingField({ field: "responsavel", value: lead.responsavel_id || "" });
                }}
              >
                <div className="w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center text-[8px] font-black text-primary/60 shrink-0 border border-primary/10">
                  {(membros.find(m => m.id === lead.responsavel_id)?.nome_completo || "?")
                    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[60px] font-bold">
                  {membros.find(m => m.id === lead.responsavel_id)?.nome_completo?.split(" ")[0] || "Resp."}
                </span>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                  title="Agendar">
                  <CalendarIcon className="h-3 w-3" />
                </button>
                <a href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=Olá!`}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                  title="WhatsApp">
                  <WhatsAppIcon className="h-3 w-3" />
                </a>
                <button onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                  title="Histórico">
                  <NotebookPen className="h-3 w-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 text-destructive/40 hover:text-destructive transition-colors"
                  title="Excluir">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            )
        ) : (
          <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/40 mt-0.5">
                <button onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                  title="Agendar">
                  <CalendarIcon className="h-3 w-3" />
                </button>
                <a href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=Olá!`}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                  title="WhatsApp">
                  <WhatsAppIcon className="h-3 w-3" />
                </a>
                <button onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-6 h-6 rounded flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                  title="Histórico">
                  <NotebookPen className="h-3 w-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 text-destructive/40 hover:text-destructive transition-colors"
                  title="Excluir">
                  <Trash2 className="h-3 w-3" />
                </button>
          </div>
        )}

      </div>
    </div>
  );
}
