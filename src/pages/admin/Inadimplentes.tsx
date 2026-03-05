import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MessageCircle, Copy, Plus, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Inadimplente {
  id: string;
  nome: string;
  celular: string | null;
  tipo_consorcio: string | null;
  valor_parcela: number;
  parcelas_pagas: number;
  parcelas_atrasadas: number;
  grupo: string | null;
  cota: string | null;
  status: string;
}

const COLUMNS = [
  { id: "em_atraso", label: "Em Atraso", color: "border-t-red-500", dot: "bg-red-500" },
  { id: "notificado", label: "Notificado", color: "border-t-yellow-500", dot: "bg-yellow-500" },
  { id: "negociando", label: "Negociando", color: "border-t-orange-500", dot: "bg-orange-500" },
  { id: "regularizado", label: "Regularizado", color: "border-t-green-500", dot: "bg-green-500" },
  { id: "juridico", label: "Jurídico", color: "border-t-purple-500", dot: "bg-purple-500" },
];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export default function Inadimplentes() {
  const [data, setData] = useState<Inadimplente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [copyTemplate, setCopyTemplate] = useState(
    "Olá {nome}, identificamos que sua cota {cota} do grupo {grupo} possui {parcelas_atrasadas} parcela(s) em atraso. Entre em contato conosco para regularizar sua situação. Estamos à disposição!"
  );
  const [form, setForm] = useState({
    nome: "", celular: "", tipo_consorcio: "", valor_parcela: "",
    parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data: rows } = await (supabase.from("inadimplentes" as any) as any).select("*");
    setData(rows ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getColumnItems = (colId: string) => data.filter((d) => d.status === colId);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const id = result.draggableId;
    const newStatus = result.destination.droppableId;

    setData((prev) => prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));

    const { error } = await (supabase.from("inadimplentes" as any) as any)
      .update({ status: newStatus })
      .eq("id", id);

    if (error) toast.error("Erro ao atualizar status");
    if (newStatus === "regularizado") toast.success("🎉 Cliente regularizado!");
  };

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await (supabase.from("inadimplentes" as any) as any).insert({
      nome: form.nome,
      celular: form.celular,
      tipo_consorcio: form.tipo_consorcio,
      valor_parcela: Number(form.valor_parcela) || 0,
      parcelas_pagas: Number(form.parcelas_pagas) || 0,
      parcelas_atrasadas: Number(form.parcelas_atrasadas) || 0,
      grupo: form.grupo,
      cota: form.cota,
      status: "em_atraso",
    });
    setSaving(false);
    if (error) { toast.error("Erro ao adicionar"); return; }
    toast.success("Inadimplente adicionado!");
    setShowAdd(false);
    setForm({ nome: "", celular: "", tipo_consorcio: "", valor_parcela: "", parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "" });
    fetchData();
  };

  const generateMessages = () => {
    const atrasados = data.filter((d) => d.status !== "regularizado");
    return atrasados.map((d) =>
      copyTemplate
        .replace("{nome}", d.nome)
        .replace("{cota}", d.cota || "—")
        .replace("{grupo}", d.grupo || "—")
        .replace("{parcelas_atrasadas}", String(d.parcelas_atrasadas))
        .replace("{valor_parcela}", formatCurrency(d.valor_parcela))
    );
  };

  const handleCopyAll = () => {
    const msgs = generateMessages();
    const text = msgs.join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success(`${msgs.length} mensagens copiadas!`);
  };

  const totalAtrasados = data.filter((d) => d.status !== "regularizado").length;
  const totalValorAtrasado = data
    .filter((d) => d.status !== "regularizado")
    .reduce((s, d) => s + d.valor_parcela * d.parcelas_atrasadas, 0);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const currentCol = COLUMNS[mobileColIdx];
  const currentColItems = getColumnItems(currentCol.id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Inadimplentes</h1>
          <p className="text-sm text-muted-foreground">
            {totalAtrasados} inadimplentes · {formatCurrency(totalValorAtrasado)} em atraso
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCopy(true)} className="flex-1 sm:flex-none">
            <Copy className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Copiar Msgs</span>
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Adicionar</span>
          </Button>
        </div>
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
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentCol.dot}`} />
              <span className="font-semibold text-sm">{currentCol.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{currentColItems.length} clientes</p>
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
              className={`h-2 rounded-full transition-all ${i === mobileColIdx ? `w-6 ${col.dot}` : "w-2 bg-muted-foreground/30"}`}
            />
          ))}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={currentCol.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-lg border-t-4 ${currentCol.color} bg-card p-3 min-h-[200px] ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className="space-y-2">
                  {currentColItems.map((item, idx) => (
                    <Draggable draggableId={item.id} index={idx} key={item.id}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className={`bg-background border border-border rounded-md p-3 text-sm space-y-2 ${snap.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate flex-1">{item.nome}</p>
                            {item.celular && (
                              <a
                                href={`https://wa.me/55${item.celular.replace(/\D/g, "")}?text=${encodeURIComponent(
                                  copyTemplate
                                    .replace("{nome}", item.nome)
                                    .replace("{cota}", item.cota || "—")
                                    .replace("{grupo}", item.grupo || "—")
                                    .replace("{parcelas_atrasadas}", String(item.parcelas_atrasadas))
                                    .replace("{valor_parcela}", formatCurrency(item.valor_parcela))
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-green-500 hover:text-green-600 shrink-0 ml-1 p-1"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                              {item.parcelas_pagas} pagas
                            </span>
                            <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" />
                              {item.parcelas_atrasadas} atrasadas
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.tipo_consorcio} · Grupo {item.grupo || "—"} · Cota {item.cota || "—"}
                          </p>
                          <p className="text-primary font-bold text-sm">
                            {formatCurrency(item.valor_parcela)}/mês
                          </p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {currentColItems.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhum cliente nesta etapa</p>
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
            const items = getColumnItems(col.id);
            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-w-[270px] w-[270px] rounded-lg border-t-4 ${col.color} bg-card p-3 flex flex-col ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm">{col.label}</h3>
                      <p className="text-xs text-muted-foreground">{items.length} clientes</p>
                    </div>
                    <div className="space-y-2 flex-1 min-h-[100px]">
                      {items.map((item, idx) => (
                        <Draggable draggableId={item.id} index={idx} key={item.id}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`bg-background border border-border rounded-md p-3 text-sm space-y-2 ${snap.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate flex-1">{item.nome}</p>
                                {item.celular && (
                                  <a
                                    href={`https://wa.me/55${item.celular.replace(/\D/g, "")}?text=${encodeURIComponent(
                                      copyTemplate
                                        .replace("{nome}", item.nome)
                                        .replace("{cota}", item.cota || "—")
                                        .replace("{grupo}", item.grupo || "—")
                                        .replace("{parcelas_atrasadas}", String(item.parcelas_atrasadas))
                                        .replace("{valor_parcela}", formatCurrency(item.valor_parcela))
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-green-500 hover:text-green-600 shrink-0 ml-1"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                  {item.parcelas_pagas} pagas
                                </span>
                                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                  <AlertTriangle className="h-3 w-3" />
                                  {item.parcelas_atrasadas} atrasadas
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {item.tipo_consorcio} · Grupo {item.grupo || "—"} · Cota {item.cota || "—"}
                              </p>
                              <p className="text-primary font-bold text-sm">
                                {formatCurrency(item.valor_parcela)}/mês
                              </p>
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

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Inadimplente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Celular</Label>
              <Input value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1">
              <Label>Segmento</Label>
              <Input value={form.tipo_consorcio} onChange={(e) => setForm({ ...form, tipo_consorcio: e.target.value })} placeholder="Imóveis, Veículos..." />
            </div>
            <div className="space-y-1">
              <Label>Valor Parcela</Label>
              <Input type="number" value={form.valor_parcela} onChange={(e) => setForm({ ...form, valor_parcela: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Parcelas Pagas</Label>
              <Input type="number" value={form.parcelas_pagas} onChange={(e) => setForm({ ...form, parcelas_pagas: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Parc. Atrasadas</Label>
              <Input type="number" value={form.parcelas_atrasadas} onChange={(e) => setForm({ ...form, parcelas_atrasadas: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Grupo</Label>
              <Input value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Cota</Label>
              <Input value={form.cota} onChange={(e) => setForm({ ...form, cota: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={saving || !form.nome} className="mt-2 w-full">
            {saving ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Copy Messages Dialog */}
      <Dialog open={showCopy} onOpenChange={setShowCopy}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Copiar Mensagens em Massa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Template da Mensagem</Label>
              <Textarea
                rows={4}
                value={copyTemplate}
                onChange={(e) => setCopyTemplate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis: {"{nome}"}, {"{cota}"}, {"{grupo}"}, {"{parcelas_atrasadas}"}, {"{valor_parcela}"}
              </p>
            </div>
            <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto text-sm space-y-2">
              <p className="font-medium text-xs text-muted-foreground mb-2">
                Pré-visualização ({data.filter((d) => d.status !== "regularizado").length} mensagens):
              </p>
              {generateMessages().slice(0, 3).map((msg, i) => (
                <div key={i} className="bg-background rounded p-2 text-xs border border-border">{msg}</div>
              ))}
              {generateMessages().length > 3 && (
                <p className="text-xs text-muted-foreground">...e mais {generateMessages().length - 3}</p>
              )}
            </div>
            <Button onClick={handleCopyAll} className="w-full">
              <Copy className="h-4 w-4 mr-2" /> Copiar Todas as Mensagens
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
