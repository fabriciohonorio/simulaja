import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MessageCircle, Copy, Plus, AlertTriangle, ChevronLeft, ChevronRight, Pencil, Trash2, FileText } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleKanbanDragEnd } from "@/pages/admin/optimizations/dragDropOptimizations";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { TrendingUp, Zap, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  administradora: string | null;
}

const COLUMNS = [
  { id: "em_atraso", label: "Em Atraso", color: "border-t-red-500", dot: "bg-red-500" },
  { id: "notificado", label: "Notificado", color: "border-t-yellow-500", dot: "bg-yellow-500" },
  { id: "negociando", label: "Negociando", color: "border-t-orange-500", dot: "bg-orange-500" },
  { id: "regularizado", label: "Regularizado", color: "border-t-green-500", dot: "bg-green-500" },
  
];


export default function Inadimplentes() {
  const { profile } = useProfile();
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
    parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", administradora: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Inadimplente | null>(null);
  const [administradoraFilter, setAdministradoraFilter] = useState("todos");

  const ADMINISTRADORAS = ["MAGALU", "ADEMICON", "SERVOPA"];

  const fetchData = async () => {
    if (!profile?.organizacao_id) {
      setLoading(false);
      return;
    }
    const { data: rows } = await (supabase.from("inadimplentes" as any) as any)
      .select("*")
      .eq("organizacao_id", profile.organizacao_id);
    
    const fetchedRows = (rows as any[] ?? []).map(r => ({
      ...r,
      nome: r.nome || "Cliente Inadimplente"
    }));
    setData(fetchedRows);
    setLoading(false);
  };

  useEffect(() => { 
    if (profile?.organizacao_id) fetchData(); 
  }, [profile?.organizacao_id]);

  const getColumnItems = (colId: string) => {
    return data.filter((d) => {
      const matchStatus = d.status === colId;
      const matchAdmin = administradoraFilter === "todos" || d.administradora === administradoraFilter;
      return matchStatus && matchAdmin;
    });
  };

  const onDragEnd = async (result: DropResult) => {
    await handleKanbanDragEnd(result, data, setData, "inadimplentes", "🎉 Cliente regularizado!");
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      nome: form.nome,
      celular: form.celular,
      tipo_consorcio: form.tipo_consorcio,
      valor_parcela: Number(form.valor_parcela) || 0,
      parcelas_pagas: Number(form.parcelas_pagas) || 0,
      parcelas_atrasadas: Number(form.parcelas_atrasadas) || 0,
      grupo: form.grupo,
      cota: form.cota,
      administradora: form.administradora || null,
      status: editingItem ? editingItem.status : "em_atraso",
      organizacao_id: profile?.organizacao_id
    };

    const { error } = editingItem 
      ? await (supabase.from("inadimplentes" as any) as any).update(payload).eq("id", editingItem.id).eq("organizacao_id", profile?.organizacao_id)
      : await (supabase.from("inadimplentes" as any) as any).insert(payload);

    setSaving(false);
    if (error) { toast.error(editingItem ? "Erro ao atualizar" : "Erro ao adicionar"); return; }
    
    toast.success(editingItem ? "Atualizado com sucesso!" : "Adicionado com sucesso!");
    setShowAdd(false);
    setEditingItem(null);
    setForm({ nome: "", celular: "", tipo_consorcio: "", valor_parcela: "", parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", administradora: "" });
    fetchData();
  };

  const handleEdit = (item: Inadimplente) => {
    setEditingItem(item);
    setForm({
      nome: item.nome,
      celular: item.celular || "",
      tipo_consorcio: item.tipo_consorcio || "",
      valor_parcela: String(item.valor_parcela),
      parcelas_pagas: String(item.parcelas_pagas),
      parcelas_atrasadas: String(item.parcelas_atrasadas),
      grupo: item.grupo || "",
      cota: item.cota || "",
      administradora: item.administradora || "",
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este card?")) return;
    const { error } = await (supabase.from("inadimplentes" as any) as any).delete().eq("id", id).eq("organizacao_id", profile?.organizacao_id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído com sucesso");
    fetchData();
  };

  const generateMessages = () => {
    const atrasados = data.filter((d) => d.status !== "regularizado");
    return atrasados.map((d) =>
      copyTemplate
        .replace(/\{nome\}/g, d.nome)
        .replace(/\{cota\}/g, d.cota || "—")
        .replace(/\{grupo\}/g, d.grupo || "—")
        .replace(/\{parcelas_atrasadas\}/g, String(d.parcelas_atrasadas))
        .replace(/\{valor_parcela\}/g, formatCurrency(d.valor_parcela))
    );
  };

  const handleCopyAll = () => {
    const msgs = generateMessages();
    const text = msgs.join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success(`${msgs.length} mensagens copiadas!`);
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const title = "Relatorio de Inadimplentes";
    const date = format(new Date(), "dd/MM/yyyy HH:mm");

    doc.setFontSize(16);
    doc.text(title, 10, 10);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${date}`, 10, 16);
    doc.line(10, 18, 200, 18);

    let y = 25;
    doc.setFont("helvetica", "bold");
    doc.text("Nome", 10, y);
    doc.text("G/C", 80, y);
    doc.text("Atraso (Qtd)", 110, y);
    doc.text("Valor Devido", 150, y);
    doc.text("Status", 185, y);
    doc.line(10, y + 2, 200, y + 2);
    y += 8;

    doc.setFont("helvetica", "normal");
    const atrasados = data.filter(d => {
      const matchStatus = d.status !== "regularizado";
      const matchAdmin = administradoraFilter === "todos" || d.administradora === administradoraFilter;
      return matchStatus && matchAdmin;
    });
    atrasados.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const valorDevido = item.valor_parcela * item.parcelas_atrasadas;
      doc.text((item.nome || "Cliente").substring(0, 35), 10, y);
      doc.text(`${item.grupo || "-"}/${item.cota || "-"}`, 80, y);
      doc.text(`${item.parcelas_atrasadas} parc.`, 110, y);
      doc.text(formatCurrency(valorDevido), 150, y);
      doc.text(item.status.replace("_", " "), 185, y);
      y += 6;
    });

    doc.save(`relatorio-inadimplentes-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Relatório gerado com sucesso!");
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
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Gamified Inadimplentes Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AdminHeroCard 
            title="Recuperação de Crédito" 
            subtitle="Gestão de Inadimplência & Renegociação"
            icon={AlertTriangle} 
            bgIcon={AlertTriangle}
            accentColor="primary"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  Monitoramento <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">em Tempo Real</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                   Recupere créditos e re-ative sua base. Utilize as réguas de cobrança automatizadas via WhatsApp para escalar suas regularizações.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Volume em Atraso</p>
                  <p className="text-lg font-black text-red-600">{formatCurrency(totalValorAtrasado)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Clientes</p>
                  <p className="text-lg font-black text-slate-900">{totalAtrasados}</p>
                </div>
              </div>
            </div>
          </AdminHeroCard>
        </div>

        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          <div className="relative group overflow-hidden p-4 rounded-[24px] bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] cursor-default">
             <div className="flex items-center gap-2 opacity-90 mb-2">
                <span className="p-1.5 bg-white/20 rounded-lg"><Zap className="h-4 w-4" /></span>
                <p className="text-[10px] font-black uppercase tracking-widest">Régua de Cobrança</p>
             </div>
             <p className="text-3xl font-black">{data.filter(d => d.status === 'notificado').length}</p>
             <p className="text-[10px] bg-white/20 w-fit px-2 py-0.5 rounded-full font-bold mt-2">Mensagens Enviadas</p>
             <MessageCircle className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Inadimplentes</h1>
            <p className="text-sm text-muted-foreground">
              {totalAtrasados} clientes · {formatCurrency(totalValorAtrasado)} em atraso
            </p>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCopy(true)} className="h-9 px-3">
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateReport} 
                className="h-9 px-3 border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
              >
              <FileText className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-9 px-3" onClick={() => {
              setEditingItem(null);
              setForm({ nome: "", celular: "", tipo_consorcio: "", valor_parcela: "", parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", administradora: "" });
              setShowAdd(true);
            }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Tabs value={administradoraFilter} onValueChange={setAdministradoraFilter} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto h-auto">
              <TabsTrigger value="todos" className="text-[10px] sm:text-xs py-2 px-4">Todos</TabsTrigger>
              {ADMINISTRADORAS.map(admin => (
                <TabsTrigger key={admin} value={admin} className="text-[10px] sm:text-xs py-2 px-4">{admin}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowCopy(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Msgs
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateReport} 
              className="border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Relatório PDF
            </Button>
            <Button size="sm" onClick={() => {
              setEditingItem(null);
              setForm({ nome: "", celular: "", tipo_consorcio: "", valor_parcela: "", parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", administradora: "" });
              setShowAdd(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
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
                            <div className="flex items-center gap-1 shrink-0">
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
                                  className="text-green-500 hover:text-green-600 p-1"
                                  title="WhatsApp"
                                >
                                  <WhatsAppIcon className="h-4 w-4" />
                                </a>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                className="text-muted-foreground hover:text-primary p-1"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="text-muted-foreground hover:text-destructive p-1"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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
                            {item.administradora ? `${item.administradora} · ` : ""}{item.tipo_consorcio} · Grupo {item.grupo || "—"} · Cota {item.cota || "—"}
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
                                <div className="flex items-center gap-1 shrink-0">
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
                                      className="text-green-500 hover:text-green-600 p-1"
                                      title="WhatsApp"
                                    >
                                      <WhatsAppIcon className="h-4 w-4" />
                                    </a>
                                  )}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                    className="text-muted-foreground hover:text-primary p-1"
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                    className="text-muted-foreground hover:text-destructive p-1"
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
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
                                {item.administradora ? `${item.administradora} · ` : ""}{item.tipo_consorcio} · Grupo {item.grupo || "—"} · Cota {item.cota || "—"}
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
      <Dialog open={showAdd} onOpenChange={(open: boolean) => { setShowAdd(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Cliente" : "Adicionar Inadimplente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input placeholder="Nome completo" value={form.nome} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, nome: e.target.value })} />
            </div>
            
            <div className="space-y-2">
              <Label>Celular</Label>
              <Input placeholder="(11) 99999-9999" value={form.celular} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, celular: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo Consórcio</Label>
              <Input placeholder="Ex: Imóvel" value={form.tipo_consorcio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, tipo_consorcio: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Valor Parcela</Label>
              <Input type="number" value={form.valor_parcela} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, valor_parcela: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Parcelas Pagas</Label>
              <Input type="number" value={form.parcelas_pagas} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, parcelas_pagas: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Parcelas Atrasadas</Label>
              <Input type="number" value={form.parcelas_atrasadas} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, parcelas_atrasadas: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Input placeholder="Ex: 1234" value={form.grupo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, grupo: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Cota</Label>
              <Input placeholder="Ex: 56" value={form.cota} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, cota: e.target.value })} />
            </div>
            <div className="space-y-2">
              {/* Spacer on desktop */}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Administradora</Label>
              <Select value={form.administradora || "none"} onValueChange={(val: string) => setForm({ ...form, administradora: val === "none" ? "" : val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {ADMINISTRADORAS.map(admin => (
                    <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCopyTemplate(e.target.value)}
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
