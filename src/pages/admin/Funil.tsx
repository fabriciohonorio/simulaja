import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Phone, MapPin, Calendar, MessageCircle, ChevronLeft, ChevronRight, Clock, TrendingUp, Sparkles } from "lucide-react";
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
}

const COLUMNS = [
  { id: "novo_lead", label: "🆕 Novo Lead" },
  { id: "primeiro_contato", label: "📞 Primeiro Contato" },
  { id: "qualificacao", label: "🧠 Qualificação" },
  { id: "simulacao_enviada", label: "📊 Simulação Enviada" },
  { id: "negociacao", label: "🤝 Negociação" },
];

const COLUMN_DOT_COLORS: Record<string, string> = {
  novo_lead: "bg-blue-500",
  primeiro_contato: "bg-yellow-500",
  qualificacao: "bg-orange-500",
  simulacao_enviada: "bg-purple-500",
  negociacao: "bg-indigo-500",
};

const COLUMN_COLORS: Record<string, string> = {
  novo_lead: "border-t-blue-500",
  primeiro_contato: "border-t-yellow-500",
  qualificacao: "border-t-orange-500",
  simulacao_enviada: "border-t-purple-500",
  negociacao: "border-t-indigo-500",
};

const TEMP_COLORS: Record<string, string> = {
  "quente": "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  "morno": "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
  "frio": "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
  "morto": "border-gray-400 bg-gray-50 opacity-75",
};

const TEMP_EMOJIS: Record<string, string> = {
  quente: "🔥",
  morno: "🌤",
  frio: "❄️",
  morto: "☠️",
};

const SCORE_LABELS: Record<string, string> = {
  premium: "🔥 Lead Premium",
  alto: "🚀 Lead Alto",
  medio: "⚡ Lead Médio",
  baixo: "🧊 Lead Baixo",
};

const formatCurrency = (v: number | null) => {
  if (v === null || v === undefined) return "Crédito a definir";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
};

export default function Funil() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationLead, setCelebrationLead] = useState<Lead | null>(null);
  const [grupo, setGrupo] = useState("");
  const [cota, setCota] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);

  useEffect(() => {
    supabase.from("leads").select("*").then(({ data }) => {
      const fetchedLeads = (data as any) ?? [];
      const validStatus = COLUMNS.map(c => c.id);

      setLeads(fetchedLeads);
      setLoading(false);

      // Automations: Temperature and Status fallback
      const now = new Date();
      fetchedLeads.forEach(async (lead: Lead) => {
        const lastInteraction = new Date(lead.last_interaction_at || lead.created_at || now);
        const hoursDiff = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
        let newTemp = lead.lead_temperatura || "quente";
        let newStatus = lead.status;

        // Regra 2: Se status for inválido/antigo, vira novo_lead
        if (!newStatus || !validStatus.includes(newStatus)) {
          newStatus = "novo_lead";
        }

        // Temperatura dinâmica (mantendo a lógica mas sem forçar status 'morto')
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

        if (["simulacao_enviada", "negociacao"].includes(newStatus)) { score += 20; reasons.push("Fase Avançada"); }
        else if (newStatus === "qualificacao") { score += 15; reasons.push("Em Qualificação"); }
        else if (newStatus === "primeiro_contato") { score += 10; }
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

  const getColumnLeads = (colId: string) => {
    const validStatus = COLUMNS.map(c => c.id);

    // Filtra aplicando o mapeamento de status antigos/nulos para novo_lead se necessário
    const filtered = leads.filter((l) => {
      const currentStatus = l.status || "novo_lead";

      // Se for a primeira coluna (novo_lead), inclui leads com status desconhecido
      if (colId === "novo_lead") {
        return !validStatus.includes(currentStatus || "") || currentStatus === "novo_lead" || currentStatus === "novo" || currentStatus === "contato";
      }

      // Mapeamento explícito para as outras colunas (compatibilidade)
      if (colId === "primeiro_contato") return currentStatus === "primeiro_contato" || currentStatus === "contato";
      if (colId === "simulacao_enviada") return currentStatus === "simulacao_enviada" || currentStatus === "proposta";

      return currentStatus === colId;
    });

    // Ordenação: score_final (A->B->C->D) ou lead_score_valor fallback, depois created_at DESC
    return filtered.sort((a, b) => {
      // Prioridade por score_final (A, B, C, D)
      const scoreWeight: Record<string, number> = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
      const scoreA = scoreWeight[a.score_final || ""] || 0;
      const scoreB = scoreWeight[b.score_final || ""] || 0;

      if (scoreA !== scoreB) return scoreB - scoreA;

      // Fallback para lead_score_valor se score_final for igual
      const valorWeight: Record<string, number> = { 'premium': 4, 'alto': 3, 'medio': 2, 'baixo': 1 };
      const valA = valorWeight[a.lead_score_valor || ""] || 0;
      const valB = valorWeight[b.lead_score_valor || ""] || 0;

      if (valA !== valB) return valB - valA;

      // Por fim, data de criação
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  };

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
        status_updated_at: new Date().toISOString()
      })
      .eq("id", leadId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
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

        {/* Mobile column dots */}
        <div className="flex justify-center gap-1.5 mb-3">
          {COLUMNS.map((col, i) => (
            <button
              key={col.id}
              onClick={() => setMobileColIdx(i)}
              className={`h-2 rounded-full transition-all ${i === mobileColIdx ? `w-6 ${COLUMN_DOT_COLORS[col.id]}` : "w-2 bg-muted-foreground/30"}`}
            />
          ))}
        </div>

        {/* Mobile single-column kanban */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={currentCol.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-lg border-t-4 ${COLUMN_COLORS[currentCol.id]} bg-card p-3 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className="space-y-2">
                  {currentColLeads.map((lead, idx) => (
                    <Draggable draggableId={lead.id} index={idx} key={lead.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-background border-2 rounded-md p-3 text-sm space-y-1.5 transition-all ${TEMP_COLORS[lead.lead_temperatura || "🔥 Quente"] || "border-border"
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
                                {lead.score_final && (
                                  <Badge className="h-4 px-1 text-[10px] bg-primary text-white font-black">
                                    {lead.score_final}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">{SCORE_LABELS[lead.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}</span>
                                {lead.urgencia && (
                                  <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold uppercase">Urgente</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toast.info("Agenda: Funcionalidade em desenvolvimento"); }}
                              className="text-orange-500 hover:text-orange-600 shrink-0 ml-1 p-1 bg-orange-50 rounded-full"
                              title="Agendar"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                            <a
                              href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de R$ ${Number(lead.valor_credito).toLocaleString("pt-BR")}...`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-500 hover:text-green-600 shrink-0 ml-1 p-1 bg-green-50 rounded-full"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-primary font-bold text-base">
                              {formatCurrency(lead.valor_credito)}
                            </p>
                            {lead.last_interaction_at && (Date.now() - new Date(lead.last_interaction_at).getTime() > 12 * 60 * 60 * 1000) && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                                <Clock className="h-3 w-3" /> 12h+
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-y-1 pt-1 border-t border-border/50">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {lead.cidade || "Não inf."}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <TrendingUp className="h-3 w-3" /> {lead.origem || "Simulador"}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" /> {lead.prazo_meses}m
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                              {TEMP_EMOJIS[lead.lead_temperatura || "quente"] || "🔥"} {lead.lead_temperatura === 'quente' ? 'Quente' : lead.lead_temperatura === 'morno' ? 'Morno' : lead.lead_temperatura === 'frio' ? 'Frio' : 'Morto'}
                            </div>
                          </div>
                        </div>
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
                    className={`min-w-[300px] w-[300px] rounded-lg border-t-4 ${COLUMN_COLORS[col.id]} bg-card p-3 flex flex-col h-[calc(100vh-220px)] ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm">{col.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {colLeads.length} leads · {formatCurrency(totalValor)}
                      </p>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      {colLeads.map((lead, idx) => (
                        <Draggable draggableId={lead.id} index={idx} key={lead.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-background border-2 rounded-md p-3 text-sm space-y-1.5 transition-all ${TEMP_COLORS[lead.lead_temperatura || "🔥 Quente"] || "border-border"
                                } ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold truncate text-foreground">{lead.nome}</p>
                                    {lead.propensity_score !== null && (
                                      <div className="flex flex-col items-center">
                                        <Badge variant="outline" className={`h-4 px-1 text-[8px] font-black border-2 ${lead.propensity_score >= 70 ? "text-green-600 border-green-200" :
                                          lead.propensity_score >= 40 ? "text-orange-600 border-orange-200" : "text-slate-400 border-slate-100"
                                          }`}>
                                          {lead.propensity_score}%
                                        </Badge>
                                      </div>
                                    )}
                                    {lead.score_final && (
                                      <Badge className="h-4 px-1 text-[10px] bg-primary text-white font-black">
                                        {lead.score_final}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{SCORE_LABELS[lead.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}</span>
                                    {lead.urgencia && (
                                      <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold uppercase">Urgente</span>
                                    )}
                                  </div>
                                </div>
                                <a
                                  href="/admin/sdr"
                                  className="bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-lg transition-colors"
                                  title="Conselho da IA"
                                >
                                  <Sparkles className="h-4 w-4" />
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toast.info("Agenda: Funcionalidade em desenvolvimento"); }}
                                  className="text-orange-500 hover:text-orange-600 shrink-0 ml-1 p-1 bg-orange-50 rounded-full"
                                  title="Agendar"
                                >
                                  <Calendar className="h-4 w-4" />
                                </button>
                                <a
                                  href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de R$ ${Number(lead.valor_credito).toLocaleString("pt-BR")}...`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-green-500 hover:text-green-600 shrink-0 ml-1 p-1 bg-green-50 rounded-full"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              </div>

                              <div className="flex items-center justify-between">
                                <p className="text-primary font-bold text-base">
                                  {formatCurrency(lead.valor_credito)}
                                </p>
                                {lead.last_interaction_at && (Date.now() - new Date(lead.last_interaction_at).getTime() > 12 * 60 * 60 * 1000) && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                                    <Clock className="h-3 w-3" /> 12h+
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-y-1 pt-1 border-t border-border/50">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {lead.cidade || "Não inf."}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <TrendingUp className="h-3 w-3" /> {lead.origem || "Simulador"}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Calendar className="h-3 w-3" /> {lead.prazo_meses}m
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                                  {TEMP_EMOJIS[lead.lead_temperatura || "quente"] || "🔥"} {lead.lead_temperatura === 'quente' ? 'Quente' : lead.lead_temperatura === 'morno' ? 'Morno' : lead.lead_temperatura === 'frio' ? 'Frio' : 'Morto'}
                                </div>
                              </div>
                            </div>
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
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
