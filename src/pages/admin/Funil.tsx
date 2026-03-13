import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  Trash2,
  Bell,
  NotebookPen,
  Plus,
  PhoneCall,
  Mail,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: number | null;
  prazo_meses: number;
  status: string | null;
  created_at: string | null;
  lead_score_valor: string | null;
  lead_temperatura: string | null;
  origem: string | null;
  status_updated_at: string | null;
  last_interaction_at: string | null;
  propensity_score: number | null;
  propensity_reason: string | null;
  // Novos campos de inteligência (adicionados para compatibilidade)
  score_final?: string | null;
  qualidade?: string | null;
  urgencia?: string | null;
  temperatura?: string | null;
  indicador_nome?: string | null;
  indicador_celular?: string | null;
  data_vencimento?: string | null;
}

interface HistoricoContato {
  id: string;
  lead_id: string | null;
  tipo: string | null;
  observacao: string | null;
  resultado: string | null;
  created_at: string | null;
}

const COLUMNS = [
  { id: "novo_lead", label: "🆕 Novo Lead" },
  { id: "primeiro_contato", label: "📞 Primeiro Contato" },
  { id: "qualificacao", label: "🧠 Qualificação" },
  { id: "simulacao_enviada", label: "📊 Simulação Enviada" },
  { id: "negociacao", label: "🤝 Negociação" },
  { id: "aguardando_pagamento", label: "🧘 Aguardando Pagamento" },
  { id: "fechado", label: "🏆 Venda Fechada" },
  { id: "perdido", label: "❌ Perdido" },
  { id: "morto", label: "☠️ Lead Morto" },
];

const COLUMN_COLORS: Record<string, string> = {
  novo_lead: "border-t-blue-500",
  novo: "border-t-blue-500",
  primeiro_contato: "border-t-yellow-500",
  contato: "border-t-yellow-500",
  qualificacao: "border-t-orange-500",
  simulacao_enviada: "border-t-purple-500",
  proposta: "border-t-purple-500",
  negociacao: "border-t-indigo-500",
  aguardando_pagamento: "border-t-amber-500",
  fechado: "border-t-green-500",
  perdido: "border-t-red-500",
  morto: "border-t-gray-500",
};

const COLUMN_DOT_COLORS: Record<string, string> = {
  novo_lead: "bg-blue-500",
  novo: "bg-blue-500",
  primeiro_contato: "bg-yellow-500",
  contato: "bg-yellow-500",
  qualificacao: "bg-orange-500",
  simulacao_enviada: "bg-purple-500",
  proposta: "bg-purple-500",
  negociacao: "bg-indigo-500",
  aguardando_pagamento: "bg-amber-500",
  fechado: "bg-green-500",
  perdido: "bg-red-500",
  morto: "bg-gray-500",
};

const TEMP_COLORS: Record<string, string> = {
  quente: "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  morno: "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
  frio: "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
  perdido: "border-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.1)]",
  morto: "border-gray-400 bg-gray-50 opacity-75",
};

const TEMP_EMOJIS: Record<string, string> = {
  quente: "🔥",
  morno: "🌤️",
  frio: "❄️",
  perdido: "💀",
  morto: "☠️",
};

const TEMP_LABELS: Record<string, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
  perdido: "Perdido",
  morto: "Morto",
};

const SCORE_LABELS: Record<string, string> = {
  premium: "🔥 Lead Premium",
  alto: "🚀 Lead Alto",
  medio: "⚡ Lead Médio",
  baixo: "🧊 Lead Baixo",
};

const TIPO_CONTATO_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "ligacao", label: "Ligação", icon: PhoneCall },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "presencial", label: "Presencial", icon: MessageSquare },
];

const RESULTADO_OPTIONS = [
  { value: "positivo", label: "✅ Positivo", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "neutro", label: "🔄 Neutro", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "negativo", label: "❌ Negativo", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "sem_retorno", label: "📵 Sem Retorno", color: "text-gray-600 bg-gray-50 border-gray-200" },
];

// Normaliza status para os IDs exatos das colunas do kanban
const normalizeStatus = (status: string | null): string => {
  if (!status) return "novo_lead";
  const s = status.toLowerCase().trim();
  const map: Record<string, string> = {
    // novo_lead
    novo: "novo_lead",
    novo_lead: "novo_lead",
    // primeiro_contato
    contato: "primeiro_contato",
    contatado: "primeiro_contato",
    primeiro_contato: "primeiro_contato",
    // qualificacao
    qualificacao: "qualificacao",
    "qualificação": "qualificacao",
    // simulacao_enviada
    proposta: "simulacao_enviada",
    proposta_enviada: "simulacao_enviada",
    simulacao_enviada: "simulacao_enviada",
    "simulação enviada": "simulacao_enviada",
    // negociacao
    negociacao: "negociacao",
    "negociação": "negociacao",
    em_negociacao: "negociacao",
    "em negociação": "negociacao",
    // aguardando_pagamento
    aguardando_pagamento: "aguardando_pagamento",
    "aguardando pagamento": "aguardando_pagamento",
    // fechado
    fechado: "fechado",
    venda_fechada: "fechado",
    // perdido
    perdido: "perdido",
    desistiu: "perdido",
    // morto
    morto: "morto",
    lead_morto: "morto",
  };
  return map[s] || "novo_lead";
};

const formatCurrency = (v: number | null) => {
  if (v === null || v === undefined) return "Crédito a definir";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
};

const isToday = (dateStr: string | null) => {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

const isPastDue = (dateStr: string | null) => {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

// ─── Lead Card ───────────────────────────────────────────────────────────────
function LeadCard({
  lead,
  snapshot,
  provided,
  onDelete,
  onSetVencimento,
  onOpenHistorico,
  ultimaTratativa,
}: {
  lead: Lead;
  snapshot: any;
  provided: any;
  onDelete: (id: string, nome: string) => void;
  onSetVencimento: (lead: Lead) => void;
  onOpenHistorico: (lead: Lead) => void;
  ultimaTratativa?: HistoricoContato | null;
}) {
  const isAguardando = normalizeStatus(lead.status) === "aguardando_pagamento";
  const vencHoje = isToday(lead.data_vencimento);
  const vencAtrasado = isPastDue(lead.data_vencimento);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-background border-2 rounded-md p-3 text-sm space-y-1.5 transition-all ${normalizeStatus(lead.status) === "fechado"
        ? "border-green-500 bg-green-50 dark:bg-green-950/30"
        : TEMP_COLORS[lead.lead_temperatura || "quente"] || "border-border"
        } ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold truncate text-foreground">{lead.nome}</p>
            {lead.propensity_score !== null && (
              <Badge
                variant="outline"
                className={`h-4 px-1 text-[8px] font-black border-2 ${lead.propensity_score >= 70
                  ? "text-green-600 border-green-200"
                  : lead.propensity_score >= 40
                    ? "text-orange-600 border-orange-200"
                    : "text-slate-400 border-slate-100"
                  }`}
              >
                {lead.propensity_score}%
              </Badge>
            )}
            {isAguardando && (vencHoje || vencAtrasado) && (
              <Bell className="h-4 w-4 text-amber-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">
            {SCORE_LABELS[lead.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Botão Agendamento — visível em todos os cards */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetVencimento(lead);
            }}
            className={`shrink-0 p-1 rounded-full transition-colors ${
              lead.data_vencimento
                ? "text-amber-500 hover:text-amber-600 bg-amber-50"
                : "text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-50"
            }`}
            title={lead.data_vencimento ? `Agendado: ${lead.data_vencimento}` : "Agendar"}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
          {/* Botão Histórico/Notas */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistorico(lead);
            }}
            className="text-primary/70 hover:text-primary shrink-0 p-1 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors"
            title="Ver/adicionar tratativas"
          >
            <NotebookPen className="h-4 w-4" />
          </button>
          <a
            href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=${encodeURIComponent(
              `Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de R$ ${Number(lead.valor_credito).toLocaleString("pt-BR")}...`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-green-500 hover:text-green-600 shrink-0 p-1 bg-green-50 rounded-full"
            title="Enviar WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lead.id, lead.nome);
            }}
            className="text-destructive/60 hover:text-destructive shrink-0 p-1 hover:bg-destructive/10 rounded-full transition-colors"
            title="Excluir lead"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Phone className="h-3 w-3" /> {lead.celular || "Sem telefone"}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-primary font-bold text-base">
            {formatCurrency(Number(lead.valor_credito))}
          </p>
          {lead.indicador_nome && (
            <span className="text-[9px] text-muted-foreground font-medium">
              via {lead.indicador_nome}
            </span>
          )}
        </div>
        {lead.last_interaction_at &&
          Date.now() - new Date(lead.last_interaction_at).getTime() >
          12 * 60 * 60 * 1000 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
              <Clock className="h-3 w-3" /> 12h+
            </span>
          )}
      </div>

      {/* Última tratativa resumida */}
      {ultimaTratativa ? (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
          className="w-full text-left"
        >
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-muted/50 hover:bg-muted transition-colors">
            <NotebookPen className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground truncate">
                {ultimaTratativa.observacao || "Sem observação"}
              </p>
              <p className="text-[9px] text-muted-foreground/70">
                {ultimaTratativa.created_at
                  ? formatDistanceToNow(new Date(ultimaTratativa.created_at), { addSuffix: true, locale: ptBR })
                  : "—"}
                {ultimaTratativa.resultado && (
                  <span className={`ml-1 font-medium ${ultimaTratativa.resultado === "positivo" ? "text-green-600" :
                    ultimaTratativa.resultado === "negativo" ? "text-red-500" :
                      "text-yellow-600"
                    }`}>
                    · {RESULTADO_OPTIONS.find(r => r.value === ultimaTratativa.resultado)?.label ?? ultimaTratativa.resultado}
                  </span>
                )}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenHistorico(lead); }}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded border border-dashed border-border/70 text-[10px] text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-colors"
        >
          <Plus className="h-3 w-3" /> Adicionar tratativa
        </button>
      )}

      {/* Agendamento — visível para qualquer lead com data marcada */}
      {lead.data_vencimento && (
        <div
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${vencAtrasado
            ? "bg-red-100 text-red-700"
            : vencHoje
              ? "bg-amber-100 text-amber-700"
              : "bg-blue-50 text-blue-700"
            }`}
        >
          {(vencHoje || vencAtrasado) && <Bell className="h-3 w-3 animate-bounce" />}
          <CalendarIcon className="h-3 w-3" />
          {isAguardando ? "Venc" : "Agend"}: {format(parseISO(lead.data_vencimento), "dd/MM/yyyy")}
          {vencAtrasado && " — ATRASADO"}
          {vencHoje && " — HOJE!"}
        </div>
      )}

      <div className="grid grid-cols-2 gap-y-1 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {lead.cidade || "Não inf."}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TrendingUp className="h-3 w-3" /> {lead.origem || "Simulador"}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <CalendarIcon className="h-3 w-3" /> {lead.prazo_meses}m
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
          {TEMP_EMOJIS[lead.lead_temperatura || "quente"] || "🔥"} {TEMP_LABELS[lead.lead_temperatura || "quente"] || "Quente"}
        </div>
        <div className="col-span-2 flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
          <Clock className="h-3 w-3" /> Incluído:{" "}
          {lead.created_at
            ? format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })
            : "—"}
        </div>
      </div>
    </div>
  );
}

// ─── Histórico Modal ──────────────────────────────────────────────────────────
function HistoricoModal({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const [historico, setHistorico] = useState<HistoricoContato[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [savingNota, setSavingNota] = useState(false);
  const [tipoContato, setTipoContato] = useState("whatsapp");
  const [observacao, setObservacao] = useState("");
  const [resultado, setResultado] = useState("positivo");

  const fetchHistorico = useCallback(async (leadId: string) => {
    setLoadingHistorico(true);
    const { data } = await supabase
      .from("historico_contatos")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setHistorico((data as HistoricoContato[]) ?? []);
    setLoadingHistorico(false);
  }, []);

  useEffect(() => {
    if (lead) fetchHistorico(lead.id);
  }, [lead, fetchHistorico]);

  const handleSaveNota = async () => {
    if (!lead || !observacao.trim()) return;
    setSavingNota(true);

    const { error } = await supabase.from("historico_contatos").insert({
      lead_id: lead.id,
      tipo: tipoContato,
      observacao: observacao.trim(),
      resultado,
    });

    if (error) {
      toast.error("Erro ao salvar tratativa");
      setSavingNota(false);
      return;
    }

    // Atualiza ultimo_contato e last_interaction_at no lead
    await supabase
      .from("leads")
      .update({
        ultimo_contato: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    toast.success("Tratativa registrada!");
    setObservacao("");
    setResultado("positivo");
    setTipoContato("whatsapp");
    await fetchHistorico(lead.id);
    setSavingNota(false);
  };

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" />
            Tratativas — {lead?.nome}
          </DialogTitle>
          <DialogDescription>
            {formatCurrency(Number(lead?.valor_credito))} · {lead?.tipo_consorcio}
          </DialogDescription>
        </DialogHeader>

        {/* Formulário nova tratativa */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Nova Tratativa</p>

          {/* Tipo de contato */}
          <div className="flex gap-2 flex-wrap">
            {TIPO_CONTATO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTipoContato(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${tipoContato === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Observação */}
          <Textarea
            placeholder="O que foi tratado? Anotações importantes..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
          />

          {/* Resultado */}
          <div className="flex gap-2 flex-wrap">
            {RESULTADO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResultado(opt.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${resultado === opt.value ? opt.color + " border-current" : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSaveNota}
            disabled={savingNota || !observacao.trim()}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            {savingNota ? "Salvando..." : "Registrar Tratativa"}
          </Button>
        </div>

        {/* Timeline de histórico */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico ({historico.length})
          </p>

          {loadingHistorico ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <NotebookPen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma tratativa registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((h, i) => {
                const resultadoOpt = RESULTADO_OPTIONS.find(r => r.value === h.resultado);
                const tipoOpt = TIPO_CONTATO_OPTIONS.find(t => t.value === h.tipo);
                return (
                  <div key={h.id} className="flex gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${h.resultado === "positivo" ? "bg-green-500" :
                        h.resultado === "negativo" ? "bg-red-500" :
                          h.resultado === "sem_retorno" ? "bg-gray-400" :
                            "bg-yellow-500"
                        }`} />
                      {i < historico.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    {/* Conteúdo */}
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        {tipoOpt && <tipoOpt.icon className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-[10px] font-semibold text-muted-foreground capitalize">
                          {tipoOpt?.label ?? h.tipo}
                        </span>
                        {resultadoOpt && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${resultadoOpt.color}`}>
                            {resultadoOpt.label}
                          </span>
                        )}
                        <span className="ml-auto text-[9px] text-muted-foreground/60">
                          {h.created_at
                            ? formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })
                            : "—"}
                        </span>
                      </div>
                      {h.observacao && (
                        <p className="text-xs text-foreground bg-background rounded px-2 py-1.5 border border-border/50">
                          {h.observacao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Funil() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationLead, setCelebrationLead] = useState<Lead | null>(null);
  const [grupo, setGrupo] = useState("");
  const [cota, setCota] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [vencimentoLead, setVencimentoLead] = useState<Lead | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [historicoLead, setHistoricoLead] = useState<Lead | null>(null);
  const [ultimasTratativas, setUltimasTratativas] = useState<Record<string, HistoricoContato>>({});

  // Drag-to-scroll no kanban desktop
  const kanbanRef = useRef<HTMLDivElement>(null);
  const isDraggingCardRef = useRef(false);
  const scrollDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    supabase.from("leads").select("*").then(({ data }) => {
      const raw = (data as any) ?? [];
      // De-duplicar por ID para evitar problemas de estado
      const uniqueRaw = raw.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.id === v.id) === i);
      
      if (raw.length !== uniqueRaw.length) {
        console.error("DUPLICADOS DETECTADOS NO BANCO:", raw.length - uniqueRaw.length, "leads com IDs repetidos.");
      }

      const fetchedLeads = uniqueRaw.map((lead: any) => ({
        ...lead,
        status: normalizeStatus(lead.status),
      }));
      console.log("Kanban v2.2 Loaded - Leads:", fetchedLeads.length);
      setLeads(fetchedLeads);
      setLoading(false);

      const now = new Date();
      fetchedLeads.forEach(async (lead: Lead) => {
        const finalStatuses = ["fechado", "perdido", "morto"];
        if (finalStatuses.includes(lead.status || "")) return;

        const lastInteraction = new Date(lead.last_interaction_at || lead.created_at || now);
        const hoursDiff = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
        let newTemp = lead.lead_temperatura || "quente";
        let newStatus = lead.status;

        // Temperatura dinâmica (mantendo a lógica mas sem forçar status 'morto' para tudo)
        if (hoursDiff > 24 * 7) {
          newTemp = "morto";
        } else if (hoursDiff > 24 * 3) {
          newTemp = "frio";
        } else if (hoursDiff > 24) {
          newTemp = "morno";
        }

        // Propensity Calculation (mantendo compatibilidade com lead_score_valor)
        let score = 0;
        let reasons = [];

        if (lead.lead_score_valor === "premium") { score += 40; reasons.push("Crédito Premium"); }
        else if (lead.lead_score_valor === "alto") { score += 30; reasons.push("Alto Potencial"); }
        else if (lead.lead_score_valor === "medio") { score += 20; reasons.push("Médio Potencial"); }
        else { score += 10; reasons.push("Baixo Potencial"); }

        if (newTemp === "quente") { score += 40; reasons.push("Lead Ativo"); }
        else if (newTemp === "morno") { score += 20; reasons.push("Aguardando"); }
        else if (newTemp === "frio") { score += 5; }

        if (["simulacao_enviada", "proposta", "negociacao"].includes(newStatus || "")) { score += 20; reasons.push("Fase Avançada"); }
        else if (newStatus === "qualificacao") { score += 15; reasons.push("Em Qualificação"); }
        else if (newStatus === "primeiro_contato" || newStatus === "contato") { score += 10; }
        else { score += 5; }

        const newScore = score;
        const newReason = reasons.join(" + ");

        if (newTemp !== lead.lead_temperatura || newStatus !== lead.status || newScore !== lead.propensity_score) {
          await supabase.from("leads").update({
            lead_temperatura: newTemp,
            status: newStatus,
            status_updated_at: newStatus !== lead.status ? now.toISOString() : lead.status_updated_at,
            propensity_score: newScore,
            propensity_reason: newReason
          }).eq("id", lead.id);

          setLeads(prev => prev.map(l => l.id === lead.id ? {
            ...l,
            lead_temperatura: newTemp,
            status: newStatus,
            propensity_score: newScore,
            propensity_reason: newReason
          } : l));
        }
      });
    });
  }, []);

  // Busca última tratativa de todos os leads
  useEffect(() => {
    if (leads.length === 0) return;
    const leadIds = leads.map((l) => l.id);
    supabase
      .from("historico_contatos")
      .select("*")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, HistoricoContato> = {};
        (data as HistoricoContato[]).forEach((h) => {
          if (h.lead_id && !map[h.lead_id]) {
            map[h.lead_id] = h;
          }
        });
        setUltimasTratativas(map);
      });
  }, [leads.length]);

  // getColumnLeads: match direto com os IDs normalizados — sem duplicatas
  const getColumnLeads = (colId: string) =>
    leads
      .filter(l => normalizeStatus(l.status) === colId)
      .sort((a, b) => {
        // Prioridade ABSOLUTA: Recentes Primeiro (Mais novos no TOPO)
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        
        // Se as datas forem diferentes, o mais novo (maior timestamp) vem primeiro
        if (timeA !== timeB) return timeB - timeA;

        // Empate técnico de data? Usa o Score como desempate
        const sw: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
        const sA = sw[a.score_final || ""] || 0, sB = sw[b.score_final || ""] || 0;
        if (sA !== sB) return sB - sA;

        return 0;
      });

  const fireConfetti = () => {
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const onDragEnd = async (result: DropResult) => {
    isDraggingCardRef.current = false;
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    if (newStatus === "aguardando_pagamento") {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setVencimentoLead({ ...lead, status: "aguardando_pagamento" });
        setSelectedDate(lead.data_vencimento ? parseISO(lead.data_vencimento) : undefined);
      }
    }

    if (newStatus === "fechado") {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setCelebrationLead({ ...lead, status: "fechado" });
        setGrupo("");
        setCota("");
        fireConfetti();
      }
    }
  };

  const handleSaveVencimento = async () => {
    if (!vencimentoLead || !selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { error } = await supabase
      .from("leads")
      .update({ data_vencimento: dateStr, updated_at: new Date().toISOString() })
      .eq("id", vencimentoLead.id);

    if (error) {
      toast.error("Erro ao salvar data de vencimento");
      return;
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === vencimentoLead.id ? { ...l, data_vencimento: dateStr } : l)),
    );

    toast.success(
      vencimentoLead.data_vencimento
        ? `Agendamento atualizado para ${format(selectedDate, "dd/MM/yyyy")}`
        : `Vencimento agendado para ${format(selectedDate, "dd/MM/yyyy")}`,
    );
    setVencimentoLead(null);
    setSelectedDate(undefined);
  };

  const handleSaveCelebration = async () => {
    if (!celebrationLead) return;
    setSaving(true);

    const { error } = await (supabase.from("carteira" as any) as any).insert({
      lead_id: celebrationLead.id,
      nome: celebrationLead.nome,
      tipo_consorcio: celebrationLead.tipo_consorcio,
      valor_credito: Number(celebrationLead.valor_credito),
      grupo,
      cota,
      status: "aguardando",
    });

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar na carteira");
      return;
    }

    toast.success("Cliente adicionado à carteira!");
    setCelebrationLead(null);
  };

  const handleDeleteLead = async (leadId: string, leadNome: string) => {
    if (!confirm(`Excluir o lead "${leadNome}" permanentemente?`)) return;
    await Promise.all([
      supabase.from("interacoes").delete().eq("lead_id", leadId),
      supabase.from("historico_contatos").delete().eq("lead_id", leadId),
      supabase.from("propostas").delete().eq("lead_id", leadId),
      supabase.from("carteira").delete().eq("lead_id", leadId),
    ]);
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) {
      toast.error("Erro ao excluir lead");
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    toast.success(`Lead "${leadNome}" excluído`);
  };

  // Ao fechar o modal de histórico, atualiza o cache da última tratativa
  const handleCloseHistorico = useCallback(async () => {
    if (!historicoLead) { setHistoricoLead(null); return; }
    const leadId = historicoLead.id;
    setHistoricoLead(null);
    const { data } = await supabase
      .from("historico_contatos")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setUltimasTratativas((prev) => ({ ...prev, [leadId]: data[0] as HistoricoContato }));
    }
  }, [historicoLead]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const currentCol = COLUMNS[mobileColIdx];
  const currentColLeads = getColumnLeads(currentCol.id);
  const currentColTotal = currentColLeads.reduce((s, l) => s + Number(l.valor_credito), 0);

  const renderLeadCard = (lead: Lead, idx: number) => (
    <Draggable draggableId={lead.id} index={idx} key={lead.id}>
      {(provided, snapshot) => (
        <LeadCard
          lead={lead}
          snapshot={snapshot}
          provided={provided}
          onDelete={handleDeleteLead}
          onSetVencimento={(l) => {
            setVencimentoLead(l);
            setSelectedDate(l.data_vencimento ? parseISO(l.data_vencimento) : undefined);
          }}
          onOpenHistorico={setHistoricoLead}
          ultimaTratativa={ultimasTratativas[lead.id] ?? null}
        />
      )}
    </Draggable>
  );

  return (
    <div className="space-y-4 select-none no-scrollbar">
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Funil de Vendas</h1>
        <Badge variant="secondary" className="h-5 text-[10px] animate-pulse bg-blue-100 text-blue-700 border-blue-200 shadow-sm">v2.7 FINAL</Badge>
      </div>

      {/* Mobile: Column navigator */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            onClick={() => setMobileColIdx((i) => Math.max(0, i - 1))}
            disabled={mobileColIdx === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 bg-card rounded-lg border border-border px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${COLUMN_DOT_COLORS[currentCol.id]}`} />
              <span className="font-semibold text-sm">{currentCol.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentColLeads.length} leads · {formatCurrency(currentColTotal)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            onClick={() => setMobileColIdx((i) => Math.min(COLUMNS.length - 1, i + 1))}
            disabled={mobileColIdx === COLUMNS.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-1.5 mb-3">
          {COLUMNS.map((col, i) => (
            <button
              key={col.id}
              onClick={() => setMobileColIdx(i)}
              className={`h-2 rounded-full transition-all ${i === mobileColIdx ? `w-6 ${COLUMN_DOT_COLORS[col.id]}` : "w-2 bg-muted-foreground/30"
                }`}
            />
          ))}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={currentCol.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-lg border-t-4 ${COLUMN_COLORS[currentCol.id]} bg-card p-3 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto no-scrollbar ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className="space-y-2">
                  {currentColLeads.map((lead, idx) => renderLeadCard(lead, idx))}
                  {currentColLeads.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Nenhum lead nesta etapa
                    </p>
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <DragDropContext
        onDragEnd={onDragEnd}
        onDragStart={() => { isDraggingCardRef.current = true; }}
      >
        {/* Wrapper com setas de navegação desktop */}
        <div className="hidden md:block relative group">
          {/* Seta esquerda */}
          <button
            onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft -= 320)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-primary/95 text-primary-foreground shadow-[0_0_20px_rgba(0,0,0,0.3)] rounded-full p-3 hover:scale-110 active:scale-95 transition-all -ml-6 border-4 border-background"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          {/* Seta direita */}
          <button
            onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft += 320)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-primary/95 text-primary-foreground shadow-[0_0_20px_rgba(0,0,0,0.3)] rounded-full p-3 hover:scale-110 active:scale-95 transition-all -mr-6 border-4 border-background"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Kanban scrollável sem barra visível */}
          <div
            ref={kanbanRef}
            className="flex gap-4 overflow-x-auto pb-10 no-scrollbar px-10 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
          {COLUMNS.map((col) => {
            const colLeads = getColumnLeads(col.id);
            const totalValor = colLeads.reduce((s, l) => s + Number(l.valor_credito), 0);

            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-w-[300px] w-[300px] rounded-lg border-t-4 ${COLUMN_COLORS[col.id]} bg-card p-3 flex flex-col h-[calc(100vh-220px)] ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm">{col.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {colLeads.length} leads · {formatCurrency(totalValor)}
                      </p>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-1 no-scrollbar min-h-[100px]">
                      {colLeads.map((lead, idx) => renderLeadCard(lead, idx))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
        </div>
      </DragDropContext>

      {/* Modal Histórico de Tratativas */}
      <HistoricoModal lead={historicoLead} onClose={handleCloseHistorico} />

      {/* Vencimento Calendar Dialog */}
      <Dialog open={!!vencimentoLead} onOpenChange={(open) => !open && setVencimentoLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-amber-500" /> Agendar Vencimento
            </DialogTitle>
            <DialogDescription>
              Marque a data de vencimento do pagamento de{" "}
              <span className="font-bold">{vencimentoLead?.nome}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
            />
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                Data selecionada:{" "}
                <span className="font-bold text-foreground">{format(selectedDate, "dd/MM/yyyy")}</span>
              </p>
            )}
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={handleSaveVencimento} disabled={!selectedDate}>
                <Bell className="h-4 w-4 mr-2" /> Agendar
              </Button>
              <Button variant="ghost" onClick={() => setVencimentoLead(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Dialog */}
      <Dialog open={!!celebrationLead} onOpenChange={(open) => !open && setCelebrationLead(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              🎉 PARABÉNS! MAIS UMA FANTÁSTICA VENDA!
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              <span className="font-bold text-foreground">{celebrationLead?.nome}</span>
              <br />
              <span className="text-xl font-bold text-primary">
                {celebrationLead && formatCurrency(Number(celebrationLead.valor_credito))}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo</Label>
                <Input id="grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ex: 1234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cota">Cota</Label>
                <Input id="cota" value={cota} onChange={(e) => setCota(e.target.value)} placeholder="Ex: 56" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleSaveCelebration} disabled={saving}>
                {saving ? "Salvando..." : "🎉 Salvar e Celebrar!"}
              </Button>
              <Button variant="ghost" onClick={() => setCelebrationLead(null)}>
                Preencher depois
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <style>{`
        /* Ultra aggressive scrollbar removal - Global and Class based */
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        
        .no-scrollbar { 
          scrollbar-width: none !important; 
          -ms-overflow-style: none !important; 
          overflow: -moz-scrollbars-none !important;
        }
        .no-scrollbar::-webkit-scrollbar { 
          display: none !important; 
          width: 0 !important; 
          height: 0 !important; 
          background: transparent !important;
          -webkit-appearance: none !important;
        }
      `}</style>
    </div>
  );
}
