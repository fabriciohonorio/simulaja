import React, { useState } from "react";
import { Phone, MapPin, Calendar as CalendarIcon, TrendingUp, Trash2, Bell, NotebookPen, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatLeadValue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { Lead, HistoricoContato, Membro } from "@/types/funil";
import { TEMP_COLORS, TEMP_EMOJIS, TEMP_LABELS, SCORE_LABELS, normalizeStatus } from "./constants";

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
  const isAguardando = statusNormalized === "aguardando_pagamento";
  const isFechado = statusNormalized === "fechado";
  const vencHoje = isToday(lead.data_vencimento);
  const vencAtrasado = isPastDue(lead.data_vencimento);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-background border-2 rounded-md transition-all ${
        compact ? "p-1.5 space-y-1 text-[11px]" : "p-3 space-y-1.5 text-sm"
      } ${(() => {
        const indicator = lead.indicador_nome?.toLowerCase() || "";
        if (indicator.includes("emily") || indicator.includes("emilly")) return "border-blue-500 bg-blue-50 dark:bg-blue-950/30";
        if (indicator.includes("vanessa")) return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30";
        if (indicator.includes("halidi")) return "border-orange-500 bg-orange-50 dark:bg-orange-950/30";
        if (normalizeStatus(lead.status) === "fechado") return "border-green-500 bg-green-50 dark:bg-green-950/30";
        return TEMP_COLORS[lead.lead_temperatura || "quente"] || "border-border";
      })()} ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className={`font-bold truncate text-foreground ${compact ? "text-[11px]" : ""}`}>{lead.nome}</p>
            {lead.propensity_score !== null && (
              <Badge
                variant="outline"
                className={`${compact ? "h-3 px-0.5 text-[7px]" : "h-4 px-1 text-[8px]"} font-black border-2 ${lead.propensity_score >= 70
                  ? "text-green-600 border-green-200"
                  : lead.propensity_score >= 40
                    ? "text-orange-600 border-orange-200"
                    : "text-slate-400 border-slate-100"
                  }`}
              >
                {lead.propensity_score}%
              </Badge>
            )}
            {isAguardando && (vencHoje || vencAtrasado) && !isFechado && (
              <Bell className={`${compact ? "h-3 w-3" : "h-4 w-4"} text-amber-500 animate-pulse`} />
            )}
          </div>
          {compact ? (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground">· {TEMP_EMOJIS[lead.lead_temperatura || "quente"]}</span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground uppercase font-bold truncate">
              {SCORE_LABELS[lead.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetVencimento(lead);
            }}
            className={`shrink-0 rounded-full transition-colors ${
              compact ? "p-0.5 border border-amber-100" : "p-1"
            } ${
              lead.data_vencimento
                ? "text-amber-500 hover:text-amber-600 bg-amber-50"
                : "text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-50"
            }`}
            title={lead.data_vencimento ? \`Agendado: \${lead.data_vencimento}\` : "Agendar"}
          >
            <CalendarIcon className={`${compact ? "h-2.5 w-2.5" : "h-4 w-4"}`} />
          </button>
          <a
            href={`https://wa.me/55${(lead.celular || "").replace(/\\D/g, "")}?text=${encodeURIComponent(
              \`Olá, bom dia! Aqui é o Fabricio. Vi sua empresa e pensei em uma forma de gerar mais oportunidades com planejamento financeiro… posso te explicar rapidinho?\`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`text-green-500 hover:text-green-600 shrink-0 bg-green-50 rounded-full ${compact ? "p-0.5 border border-green-100" : "p-1"}`}
            title="WhatsApp"
          >
            <WhatsAppIcon className={`${compact ? "h-2.5 w-2.5" : "h-4 w-4"}`} />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistorico(lead);
            }}
            className={`text-primary/70 hover:text-primary shrink-0 transition-colors rounded-full ${compact ? "p-0.5" : "p-1 bg-primary/5 hover:bg-primary/10"}`}
            title="Ver tratativas"
          >
            <NotebookPen className={`${compact ? "h-2.5 w-2.5" : "h-4 w-4"}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lead.id, lead.nome);
            }}
            className={`text-destructive/60 hover:text-destructive shrink-0 transition-colors rounded-full ${compact ? "p-0.5" : "p-1 hover:bg-destructive/10"}`}
            title="Excluir"
          >
            <Trash2 className={`${compact ? "h-2.5 w-2.5" : "h-4 w-4"}`} />
          </button>
        </div>
      </div>

      {!compact && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Phone className="h-3 w-3" /> {lead.celular || "Sem telefone"}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <p className={`text-primary font-bold ${compact ? "text-xs" : "text-base"}`}>
            {formatLeadValue(Number(lead.valor_credito))}
          </p>
          {!compact && lead.indicador_nome && (
            <span className="text-[9px] text-muted-foreground font-medium truncate max-w-[60px]">
              via {lead.indicador_nome}
            </span>
          )}
        </div>
      </div>
      
      {/* Última tratativa */}
      {ultimaTratativa ? (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
          className="w-full text-left"
        >
          <div className={`flex items-start gap-1 rounded bg-muted/50 hover:bg-muted transition-colors ${compact ? "px-1 py-0.5" : "px-2 py-1.5"}`}>
            <NotebookPen className={`text-muted-foreground mt-0.5 shrink-0 ${compact ? "h-2 w-2" : "h-3 w-3"}`} />
            <div className="min-w-0 flex-1">
              <p className={`${compact ? "text-[8px]" : "text-[10px]"} font-semibold text-muted-foreground truncate`}>
                {ultimaTratativa!.observacao || "Sem observação"}
              </p>
            </div>
          </div>
        </button>
      ) : (!compact && !isFechado) && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded border border-dashed border-border/70 text-[10px] text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-colors"
        >
          <Plus className="h-3 w-3" /> Adicionar tratativa
        </button>
      )}

      {/* Agendamento */}
      {lead.data_vencimento && !isFechado && (
        <div
          className={`flex items-center gap-1 font-bold rounded ${
            compact ? "text-[8px] px-1 py-0.5" : "text-[10px] px-2 py-1"
          } ${vencAtrasado
            ? "bg-red-100 text-red-700"
            : vencHoje
              ? "bg-amber-100 text-amber-700"
              : "bg-blue-50 text-blue-700"
            }`}
        >
          {(vencHoje || vencAtrasado) && <Bell className={`${compact ? "h-2 w-2" : "h-3 w-3"} animate-bounce`} />}
          <CalendarIcon className={`${compact ? "h-2 w-2" : "h-3 w-3"}`} />
          {format(parseISO(lead.data_vencimento!), "dd/MM")} {vencAtrasado && !compact && " — ATRASADO"}
        </div>
      )}

      {!compact && (
        <div className="grid grid-cols-2 gap-y-1 pt-1 border-t border-border/50">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {lead.cidade || "Não inf."}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> {lead.origem || "Simulador"}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
            {TEMP_EMOJIS[lead.lead_temperatura || "quente"] || "🔥"} {TEMP_LABELS[lead.lead_temperatura || "quente"] || "Quente"}
          </div>
        </div>
      )}

      {isFechado && (
        <div className="mt-1 pt-1.5 border-t border-green-200 flex flex-wrap items-center gap-1">
          <KanbanEditableBadge leadId={lead.id} field="administradora" value={lead.administradora ?? null} hideLabel compact={compact} isEditingField={isEditingField} setIsEditingField={setIsEditingField} onUpdateField={onUpdateField} />
          <KanbanEditableBadge leadId={lead.id} field="grupo" value={lead.grupo ?? null} label="G" compact={compact} isEditingField={isEditingField} setIsEditingField={setIsEditingField} onUpdateField={onUpdateField} />
          <KanbanEditableBadge leadId={lead.id} field="cota" value={lead.cota ?? null} label="C" compact={compact} isEditingField={isEditingField} setIsEditingField={setIsEditingField} onUpdateField={onUpdateField} />
          <KanbanEditableBadge leadId={lead.id} field="data_adesao" value={lead.data_adesao ?? null} inputType="date" label="📅" compact={compact} isEditingField={isEditingField} setIsEditingField={setIsEditingField} onUpdateField={onUpdateField} />
        </div>
      )}

      {(isManager && onAssignLead) || (isFechado && lead.status_updated_at) ? (
        <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-end gap-2">
          {isManager && onAssignLead && (
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-muted-foreground uppercase font-black mb-1">Responsável</p>
              <select
                className="w-full text-[10px] p-1 rounded border border-border bg-background"
                value={lead.responsavel_id || "none"}
                onChange={(e) => onAssignLead?.(lead.id, e.target.value)}
              >
                <option value="none">Sem responsável</option>
                {membros.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome_completo}</option>
                ))}
              </select>
            </div>
          )}
          
          {isFechado && lead.status_updated_at && (
            <div className={`text-right shrink-0 p-1 rounded bg-green-50 border border-green-100 ${!isManager ? 'w-full flex justify-between items-center' : ''}`}>
               <p className="text-[8px] text-green-700 uppercase font-bold">Fechamento</p>
               <p className="text-[10px] text-green-600 font-black">{format(parseISO(lead.status_updated_at), "dd/MM/yy")}</p>
            </div>
          )}
        </div>
      ) : lead.responsavel_id && !compact && (
        <div className="mt-2 pt-2 border-t border-border/50">
           <p className="text-[10px] text-muted-foreground italic">
             Resp: {membros.find(m => m.id === lead.responsavel_id)?.nome_completo || "S/Resp"}
           </p>
        </div>
      )}
    </div>
  );
}
