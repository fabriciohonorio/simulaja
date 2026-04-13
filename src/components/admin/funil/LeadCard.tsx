import React, { useState } from "react";
import { Phone, MapPin, Calendar as CalendarIcon, TrendingUp, Trash2, Bell, NotebookPen, Plus, Clock } from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
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
      const displayDateStr = lead.status_updated_at || lead.created_at;
      const displayDate = displayDateStr ? parseISO(displayDateStr) : null;
      const dateText = displayDate && isValid(displayDate) ? format(displayDate, "dd/MM/yy") : "--/--";
      
      return (
        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-emerald-200">
          🏆 Vendido: {dateText} · {diasDesdeEntrada}d
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-red-100 text-[8px]">
        <Clock className="w-2 h-2" /> {diasDesdeEntrada} {diasDesdeEntrada === 1 ? 'dia' : 'dias'}
      </span>
    );
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`group relative bg-white border rounded-xl overflow-hidden transition-all duration-200
        ${compact ? "text-[11px]" : "text-sm"}
        ${statusNormalized === "fechado" ? "border-emerald-200/80 shadow-[0_0_12px_rgba(34,197,94,0.08)]" : "border-slate-200/70 hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300/60 hover:-translate-y-0.5"}
        ${statusNormalized === "morto" ? "opacity-55 grayscale-[30%]" : ""}
        ${snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/30 scale-105 z-[9999] rotate-1 bg-white backdrop-blur-sm" : "shadow-sm"}
      `}
    >
      {/* Faixa lateral colorida */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
        statusNormalized === "fechado"
          ? "bg-emerald-400"
          : TEMP_STRIPE[lead.lead_temperatura || "frio"] || "bg-slate-300"
      }`} />

      {/* Badge urgência circular — canto superior direito */}
      {diasDesdeEntrada > 5 && statusNormalized !== "fechado" && statusNormalized !== "morto" && (
        <div className={`absolute top-1.5 right-1.5 flex items-center justify-center rounded-full text-[7px] font-black leading-none w-6 h-6 z-10 border-2 border-white shadow-sm ${
          diasDesdeEntrada > 30 ? "bg-red-500 text-white" :
          diasDesdeEntrada > 14 ? "bg-orange-400 text-white" :
          "bg-amber-100 text-amber-700 border-amber-200"
        }`}>
          {diasDesdeEntrada > 99 ? "99+" : diasDesdeEntrada}d
        </div>
      )}

      {/* Conteúdo com padding interno maior */}
      <div className={compact ? "pl-3 pr-6 pt-2 pb-1.5 space-y-1" : "pl-4 pr-7 pt-2.5 pb-2.5 space-y-2"}>
        
        {/* Header: Nome + Temperatura */}
        <div className="flex flex-col min-w-0">
          <p className={`font-black truncate text-slate-900 leading-tight ${compact ? "text-[9px]" : "text-[11px]"}`}>{lead.nome || "Lead"}</p>
          
          {/* Pill Temperatura — saturação reduzida */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`inline-flex items-center gap-0.5 text-[7px] font-black px-1.5 py-[2px] rounded border ${
              lead.lead_temperatura === "quente"
                ? "bg-red-50/80 text-red-500 border-red-100"
                : lead.lead_temperatura === "morno"
                  ? "bg-amber-50/80 text-amber-500 border-amber-100"
                  : lead.lead_temperatura === "frio"
                    ? "bg-sky-50/80 text-sky-500 border-sky-100"
                    : "bg-slate-50 text-slate-400 border-slate-100"
            }`}>
              {TEMP_EMOJIS[lead.lead_temperatura || "frio"]}
              {TEMP_LABELS[lead.lead_temperatura || "frio"]}
            </span>
            {lead.propensity_score !== null && lead.propensity_score !== undefined && (
              <span className="text-[7px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-1 py-[2px] rounded">
                {lead.propensity_score}%
              </span>
            )}
          </div>
        </div>

        {/* Celular + Indicador */}
        {!compact && (
          <div className="flex flex-col gap-0.5">
            {lead.celular && (
              <a
                href={`tel:${lead.celular.replace(/\D/g, "")}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[9px] text-slate-500 font-medium hover:text-primary transition-colors"
              >
                <Phone className="h-2.5 w-2.5 shrink-0" />
                {lead.celular}
              </a>
            )}
            {lead.indicador_nome && (
              <span className="text-[8px] text-slate-400 font-medium">via {lead.indicador_nome}</span>
            )}
          </div>
        )}

        {/* Timing */}
        <div className="flex items-center gap-1 text-[8px]">
          {statusNormalized === "novo_lead" ? (
            <span className="text-sky-500 font-bold">
              Entrada: {lead.created_at ? format(parseISO(lead.created_at), "dd/MM") : "--/--"} · {diasDesdeEntrada}d
            </span>
          ) : statusNormalized === "fechado" ? (
            <span className="text-emerald-600 font-black">
              🏆 Vendido: {lead.status_updated_at ? format(parseISO(lead.status_updated_at), "dd/MM/yy") : "--/--"} · {diasDesdeEntrada}d
            </span>
          ) : (
            <span className={`font-black ${diasDesdeEntrada > 14 ? "text-red-500" : "text-slate-400"}`}>
              <Clock className="w-2 h-2 inline mr-0.5" />
              {diasDesdeEntrada} {diasDesdeEntrada === 1 ? "dia" : "dias"} na etapa
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 pt-0.5">
          <p className={`text-primary font-black ${compact ? "text-[10px]" : "text-[12px]"}`}>
            {formatLeadValue(Number(lead.valor_credito) || 0)}
          </p>
          {!compact && (
            <span className="text-[9px] text-slate-400 font-bold">
              · {lead.prazo_meses}m
            </span>
          )}
        </div>

        {ultimaTratativa ? (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
            className="w-full text-left"
          >
            <div className={`flex items-start gap-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors ${compact ? "px-1.5 py-0.5" : "px-2 py-1.5"}`}>
              <NotebookPen className={`text-slate-400 mt-0.5 shrink-0 ${compact ? "h-2 w-2" : "h-3 w-3"}`} />
              <p className={`${compact ? "text-[8px]" : "text-[9px]"} font-medium text-slate-600 truncate`}>
                {ultimaTratativa!.observacao || "Sem observação"}
              </p>
            </div>
          </button>
        ) : (!compact && !isFechado) && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
            className="w-full flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-slate-200 text-[9px] text-slate-400 hover:border-primary/30 hover:text-primary/60 transition-colors"
          >
            <Plus className="h-3 w-3" /> Adicionar tratativa
          </button>
        )}

        {lead.data_vencimento && !isFechado && (
          <div className={`flex items-center justify-between px-2 py-1 text-[9px] font-medium rounded-lg ${
            vencAtrasado
              ? "bg-red-50 text-red-600 border border-red-100"
              : vencHoje
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : "bg-sky-50 text-sky-600 border border-sky-100"
          }`}>
            <span className="flex items-center gap-1">
              {(vencHoje || vencAtrasado) && <Bell className="h-2.5 w-2.5 animate-pulse" />}
              <CalendarIcon className="h-2.5 w-2.5" />
              {format(parseISO(lead.data_vencimento), "dd/MM")}
              {vencAtrasado && !compact && " — Atrasado"}
              {vencHoje && !compact && " — Hoje!"}
            </span>
            {(lead as any).gcal_event_id && (
              <span className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[8px] text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                GCal
              </span>
            )}
          </div>
        )}

        {((isManager && onAssignLead) || lead.responsavel_id) ? (
            isEditingField?.field === "responsavel" ? (
             <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1">
              <select
                className="w-full text-[10px] p-1 rounded border border-slate-200 bg-white"
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
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-0.5">
              <div
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingField({ field: "responsavel", value: lead.responsavel_id || "" });
                }}
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary/70 shrink-0 border border-primary/10">
                  {(() => {
                    const nome = membros.find(m => m.id === lead.responsavel_id)?.nome_completo || "?";
                    return nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                  })()}
                </div>
                <span className="text-[8px] text-slate-400 truncate max-w-[55px] font-medium">
                  {(membros.find(m => m.id === lead.responsavel_id)?.nome_completo || "Resp.").split(" ")[0]}
                </span>
              </div>
              
              <div className="flex items-center gap-0.5">
                <button onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
                  className="w-5 h-5 rounded-md flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-500 transition-colors"
                  title="Agendar">
                  <CalendarIcon className="h-2.5 w-2.5" />
                </button>
                <a href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=Olá!`}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-5 h-5 rounded-md flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-500 transition-colors"
                  title="WhatsApp">
                  <WhatsAppIcon className="h-2.5 w-2.5" />
                </a>
                <button onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
                  className="w-5 h-5 rounded-md flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-500 transition-colors"
                  title="Histórico">
                  <NotebookPen className="h-2.5 w-2.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
                  className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                  title="Excluir">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
            )
        ) : (
          <div className="flex items-center justify-end gap-0.5 pt-1.5 border-t border-slate-100 mt-0.5">
            <button onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-500 transition-colors"
              title="Agendar">
              <CalendarIcon className="h-3 w-3" />
            </button>
            <a href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=Olá!`}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-500 transition-colors"
              title="WhatsApp">
              <WhatsAppIcon className="h-3 w-3" />
            </a>
            <button onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-500 transition-colors"
              title="Histórico">
              <NotebookPen className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
              title="Excluir">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
