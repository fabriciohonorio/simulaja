import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Phone, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

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
];

const COLUMN_COLORS: Record<string, string> = {
  novo: "border-t-blue-500",
  contatado: "border-t-yellow-500",
  proposta_enviada: "border-t-orange-500",
  em_negociacao: "border-t-purple-500",
  fechado: "border-t-green-500",
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function Funil() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("leads").select("*").then(({ data }) => {
      setLeads(data ?? []);
      setLoading(false);
    });
  }, []);

  const getColumnLeads = (colId: string) =>
    leads.filter((l) => (l.status ?? "novo") === colId);

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
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Funil de Vendas</h1>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colLeads = getColumnLeads(col.id);
            const totalValor = colLeads.reduce((s, l) => s + Number(l.valor_credito), 0);

            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-w-[260px] w-[260px] rounded-lg border-t-4 ${COLUMN_COLORS[col.id]} bg-card p-3 flex flex-col ${
                      snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""
                    }`}
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
                              className={`bg-background border border-border rounded-md p-3 text-sm space-y-1.5 ${
                                snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                              }`}
                            >
                              <p className="font-medium truncate">{lead.nome}</p>
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
    </div>
  );
}
