import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Phone, MapPin, Calendar, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
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
  valor_credito: number;
  prazo_meses: number;
  status: string | null;
  created_at: string | null;
}

const COLUMNS = [
  { id: "novo", label: "Novo" },
  { id: "contatado", label: "Contatado" },
  { id: "proposta_enviada", label: "Proposta Enviada" },
  { id: "em_negociacao", label: "Em Negociação" },
  { id: "fechado", label: "Fechado" },
  { id: "desistiu", label: "Desistiu" },
  { id: "perdido", label: "Perdido" },
];

const COLUMN_COLORS: Record<string, string> = {
  novo: "border-t-blue-500",
  contatado: "border-t-yellow-500",
  proposta_enviada: "border-t-orange-500",
  em_negociacao: "border-t-purple-500",
  fechado: "border-t-green-500",
  desistiu: "border-t-gray-500",
  perdido: "border-t-red-500",
};

const COLUMN_DOT_COLORS: Record<string, string> = {
  novo: "bg-blue-500",
  contatado: "bg-yellow-500",
  proposta_enviada: "bg-orange-500",
  em_negociacao: "bg-purple-500",
  fechado: "bg-green-500",
  desistiu: "bg-gray-500",
  perdido: "bg-red-500",
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

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
      setLeads(data ?? []);
      setLoading(false);
    });
  }, []);

  const getColumnLeads = (colId: string) =>
    leads.filter((l) => (l.status ?? "novo") === colId);

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
      .update({ status: newStatus })
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
                className={`rounded-lg border-t-4 ${COLUMN_COLORS[currentCol.id]} bg-card p-3 min-h-[200px] ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className="space-y-2">
                  {currentColLeads.map((lead, idx) => (
                    <Draggable draggableId={lead.id} index={idx} key={lead.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-background border border-border rounded-md p-3 text-sm space-y-1.5 ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate flex-1">{lead.nome}</p>
                            <a
                              href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de R$ ${Number(lead.valor_credito).toLocaleString("pt-BR")}...`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-500 hover:text-green-600 shrink-0 ml-1 p-1"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </div>
                          <p className="text-primary font-bold text-base">
                            {formatCurrency(Number(lead.valor_credito))}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> {lead.prazo_meses} meses
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {lead.celular}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {lead.cidade}
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
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-background border border-border rounded-md p-3 text-sm space-y-1.5 ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate flex-1">{lead.nome}</p>
                                <a
                                  href={`https://wa.me/55${(lead.celular || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.nome}! Sobre sua simulação de ${lead.tipo_consorcio} no valor de R$ ${Number(lead.valor_credito).toLocaleString("pt-BR")}...`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-green-500 hover:text-green-600 shrink-0 ml-1"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              </div>
                              <p className="text-primary font-bold text-base">
                                {formatCurrency(Number(lead.valor_credito))}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" /> {lead.prazo_meses} meses
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" /> {lead.celular}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {lead.cidade}
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
    </div>
  );
}
