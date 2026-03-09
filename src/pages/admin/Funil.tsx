import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Phone, MapPin, Calendar as CalendarIcon, MessageCircle, ChevronLeft, ChevronRight, Clock, TrendingUp, Trash2, Bell } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: number;
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
  indicador_nome: string | null;
  indicador_celular: string | null;
  data_vencimento: string | null;
}

const COLUMNS = [
  { id: "novo", label: "🆕 Novo Lead" },
  { id: "contato", label: "📞 Primeiro Contato" },
  { id: "qualificacao", label: "🧠 Qualificação" },
  { id: "proposta", label: "📊 Simulação Enviada" },
  { id: "negociacao", label: "🤝 Negociação" },
  { id: "aguardando_pagamento", label: "🧘 Aguardando Pagamento" },
  { id: "fechado", label: "🏆 Venda Fechada" },
  { id: "perdido", label: "❌ Perdido" },
  { id: "morto", label: "☠️ Lead Morto" },
];

const COLUMN_COLORS: Record<string, string> = {
  novo: "border-t-blue-500",
  contato: "border-t-yellow-500",
  qualificacao: "border-t-orange-500",
  proposta: "border-t-purple-500",
  negociacao: "border-t-indigo-500",
  aguardando_pagamento: "border-t-amber-500",
  fechado: "border-t-green-500",
  perdido: "border-t-red-500",
  morto: "border-t-gray-500",
};

const COLUMN_DOT_COLORS: Record<string, string> = {
  novo: "bg-blue-500",
  contato: "bg-yellow-500",
  qualificacao: "bg-orange-500",
  proposta: "bg-purple-500",
  negociacao: "bg-indigo-500",
  aguardando_pagamento: "bg-amber-500",
  fechado: "bg-green-500",
  perdido: "bg-red-500",
  morto: "bg-gray-500",
};

const TEMP_COLORS: Record<string, string> = {
  "quente": "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  "morno": "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
  "frio": "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
  "perdido": "border-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.1)]",
  "morto": "border-gray-400 bg-gray-50 opacity-75",
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

const normalizeStatus = (status: string | null): string => {
  if (!status) return "novo";
  const s = status.toLowerCase().trim();
  const map: Record<string, string> = {
    "novo": "novo",
    "contato": "contato",
    "contatado": "contato",
    "primeiro_contato": "contato",
    "qualificacao": "qualificacao",
    "qualificação": "qualificacao",
    "proposta": "proposta",
    "proposta_enviada": "proposta",
    "simulação enviada": "proposta",
    "negociacao": "negociacao",
    "negociação": "negociacao",
    "em_negociacao": "negociacao",
    "em_negociação": "negociacao",
    "aguardando_pagamento": "aguardando_pagamento",
    "aguardando pagamento": "aguardando_pagamento",
    "fechado": "fechado",
    "venda_fechada": "fechado",
    "perdido": "perdido",
    "desistiu": "perdido",
    "morto": "morto",
    "lead_morto": "morto",
  };
  return map[s] || "novo";
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const isToday = (dateStr: string | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
};

const isPastDue = (dateStr: string | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

// Lead card component to avoid duplication
function LeadCard({ lead, snapshot, provided, onDelete, onSetVencimento }: {
  lead: Lead;
  snapshot: any;
  provided: any;
  onDelete: (id: string, nome: string) => void;
  onSetVencimento: (lead: Lead) => void;
}) {
  const isAguardando = normalizeStatus(lead.status) === "aguardando_pagamento";
  const vencHoje = isToday(lead.data_vencimento);
  const vencAtrasado = isPastDue(lead.data_vencimento);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-background border-2 rounded-md p-3 text-sm space-y-1.5 transition-all ${normalizeStatus(lead.status) === "fechado" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : TEMP_COLORS[lead.lead_temperatura || "🔥 Quente"] || "border-border"
        } ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold truncate text-foreground">{lead.nome}</p>
            {lead.propensity_score !== null && (
              <Badge variant="outline" className={`h-4 px-1 text-[8px] font-black border-2 ${lead.propensity_score >= 70 ? "text-green-600 border-green-200" :
                lead.propensity_score >= 40 ? "text-orange-600 border-orange-200" : "text-slate-400 border-slate-100"
                }`}>
                {lead.propensity_score}%
              </Badge>
            )}
            {isAguardando && (vencHoje || vencAtrasado) && (
              <Bell className="h-4 w-4 text-amber-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">{SCORE_LABELS[lead.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}</span>
        </div>
        <div className="flex items-center gap-1">
          {isAguardando && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetVencimento(lead); }}
              className="text-amber-500 hover:text-amber-600 shrink-0 p-1 bg-amber-50 rounded-full"
              title="Agendar vencimento"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          )}
          <a
            href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de R$ ${Number(lead.valor_credito).toLocaleString("pt-BR")}...`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-green-500 hover:text-green-600 shrink-0 p-1 bg-green-50 rounded-full"
            title="Enviar WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.nome); }}
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
        {lead.last_interaction_at && (Date.now() - new Date(lead.last_interaction_at).getTime() > 12 * 60 * 60 * 1000) && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
            <Clock className="h-3 w-3" /> 12h+
          </span>
        )}
      </div>

      {/* Vencimento info for aguardando_pagamento */}
      {isAguardando && lead.data_vencimento && (
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${vencAtrasado ? "bg-red-100 text-red-700" : vencHoje ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
          {(vencHoje || vencAtrasado) && <Bell className="h-3 w-3 animate-bounce" />}
          <CalendarIcon className="h-3 w-3" />
          Venc: {format(new Date(lead.data_vencimento), "dd/MM/yyyy")}
          {vencAtrasado && " — ATRASADO"}
          {vencHoje && " — VENCE HOJE!"}
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
        {/* Data de inclusão */}
        <div className="col-span-2 flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
          <Clock className="h-3 w-3" /> Incluído: {lead.created_at ? format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR }) : "—"}
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    supabase.from("leads").select("*").then(({ data }) => {
      const fetchedLeads = ((data as any) ?? []).map((lead: any) => ({
        ...lead,
        status: normalizeStatus(lead.status),
      }));
      setLeads(fetchedLeads);
      setLoading(false);

      const now = new Date();
      fetchedLeads.forEach(async (lead: Lead) => {
        const finalStatuses = ["fechado", "perdido", "morto"];
        if (finalStatuses.includes(lead.status || "")) return;

        const lastInteraction = new Date(lead.last_interaction_at || lead.created_at || now);
        const hoursDiff = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
        let newTemp = lead.lead_temperatura || "quente";

        if (hoursDiff > 24 * 7) {
          newTemp = "frio";
        } else if (hoursDiff > 24 * 3) {
          newTemp = "frio";
        } else if (hoursDiff > 24) {
          newTemp = "morno";
        }

        if (newTemp !== lead.lead_temperatura) {
          await supabase.from("leads").update({
            lead_temperatura: newTemp,
          }).eq("id", lead.id);

          setLeads(prev => prev.map(l => l.id === lead.id ? {
            ...l,
            lead_temperatura: newTemp,
          } : l));
        }
      });
    });
  }, []);

  const getColumnLeads = (colId: string) =>
    leads
      .filter((l) => normalizeStatus(l.status) === colId)
      .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());

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
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    const { error } = await supabase
      .from("leads")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", leadId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    if (newStatus === "aguardando_pagamento") {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setVencimentoLead({ ...lead, status: "aguardando_pagamento" });
        setSelectedDate(lead.data_vencimento ? new Date(lead.data_vencimento) : undefined);
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

    setLeads(prev => prev.map(l => l.id === vencimentoLead.id ? { ...l, data_vencimento: dateStr } : l));
    toast.success(
      vencimentoLead.data_vencimento
        ? `Agendamento atualizado para ${format(selectedDate, "dd/MM/yyyy")}`
        : `Vencimento agendado para ${format(selectedDate, "dd/MM/yyyy")}`
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
    if (error) { toast.error("Erro ao excluir lead"); return; }
    setLeads(prev => prev.filter(l => l.id !== leadId));
    toast.success(`Lead "${leadNome}" excluído`);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const currentCol = COLUMNS[mobileColIdx];
  const currentColLeads = getColumnLeads(currentCol.id);
  const currentColTotal = currentColLeads.reduce((s, l) => s + Number(l.valor_credito), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Funil de Vendas</h1>

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
              className={`h-2 rounded-full transition-all ${i === mobileColIdx ? `w-6 ${COLUMN_DOT_COLORS[col.id]}` : "w-2 bg-muted-foreground/30"}`}
            />
          ))}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={currentCol.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-lg border-t-4 ${COLUMN_COLORS[currentCol.id]} bg-card p-3 min-h-[200px] ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className="space-y-2">
                  {currentColLeads.map((lead, idx) => (
                    <Draggable draggableId={lead.id} index={idx} key={lead.id}>
                      {(provided, snapshot) => (
                        <LeadCard
                          lead={lead}
                          snapshot={snapshot}
                          provided={provided}
                          onDelete={handleDeleteLead}
                          onSetVencimento={(l) => {
                            setVencimentoLead(l);
                            setSelectedDate(l.data_vencimento ? new Date(l.data_vencimento) : undefined);
                          }}
                        />
                      )}
                    </Draggable>
                  ))}
                  {currentColLeads.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhum lead nesta etapa</p>
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Desktop: horizontal scroll kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colLeads = getColumnLeads(col.id);
            const totalValor = colLeads.reduce((s, l) => s + Number(l.valor_credito), 0);

            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-w-[260px] w-[260px] rounded-lg border-t-4 ${COLUMN_COLORS[col.id]} bg-card p-3 flex flex-col ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm">{col.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {colLeads.length} leads · {formatCurrency(totalValor)}
                      </p>
                    </div>

                    <div className="space-y-2 flex-1 min-h-[100px]">
                      {colLeads.map((lead, idx) => (
                        <Draggable draggableId={lead.id} index={idx} key={lead.id}>
                          {(provided, snapshot) => (
                            <LeadCard
                              lead={lead}
                              snapshot={snapshot}
                              provided={provided}
                              onDelete={handleDeleteLead}
                              onSetVencimento={(l) => {
                                setVencimentoLead(l);
                                setSelectedDate(l.data_vencimento ? new Date(l.data_vencimento) : undefined);
                              }}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Vencimento Calendar Dialog */}
      <Dialog open={!!vencimentoLead} onOpenChange={(open) => !open && setVencimentoLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-amber-500" /> Agendar Vencimento
            </DialogTitle>
            <DialogDescription>
              Marque a data de vencimento do pagamento de <span className="font-bold">{vencimentoLead?.nome}</span>
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
                Data selecionada: <span className="font-bold text-foreground">{format(selectedDate, "dd/MM/yyyy")}</span>
              </p>
            )}
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={handleSaveVencimento} disabled={!selectedDate}>
                <Bell className="h-4 w-4 mr-2" /> Agendar
              </Button>
              <Button variant="ghost" onClick={() => setVencimentoLead(null)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Dialog */}
      <Dialog open={!!celebrationLead} onOpenChange={(open) => !open && setCelebrationLead(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">🎉 PARABÉNS! MAIS UMA FANTÁSTICA VENDA!</DialogTitle>
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
    </div>
  );
}
