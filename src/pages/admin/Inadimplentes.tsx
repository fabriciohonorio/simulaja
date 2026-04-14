import { useEffect, useState, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  MessageCircle, 
  Copy, 
  Plus, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  FileText, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  Search,
  ShieldAlert,
  Calendar
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
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
import { Input } from "@/components/ui/input";
import { formatToUpper, formatToFourDigits } from "@/lib/formatters";

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
  { id: "em_atraso", label: "Em Atraso", color: "from-red-500 to-rose-600", border: "border-t-red-500", dot: "bg-red-500" },
  { id: "notificado", label: "Notificado", color: "from-amber-500 to-yellow-600", border: "border-t-amber-500", dot: "bg-amber-500" },
  { id: "negociando", label: "Negociando", color: "from-orange-500 to-orange-700", border: "border-t-orange-500", dot: "bg-orange-600" },
  { id: "regularizado", label: "Regularizado", color: "from-emerald-500 to-teal-600", border: "border-t-emerald-500", dot: "bg-emerald-500" },
];

export default function Inadimplentes() {
  const { profile } = useProfile();
  const [data, setData] = useState<Inadimplente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [administradoraFilter, setAdministradoraFilter] = useState("todos");
  const [copyTemplate, setCopyTemplate] = useState(
    "Olá {nome}, identificamos que sua cota {cota} do grupo {grupo} possui {parcelas_atrasadas} parcela(s) em atraso. Entre em contato conosco para regularizar sua situação. Estamos à disposição!"
  );
  const [form, setForm] = useState({
    nome: "", celular: "", tipo_consorcio: "", valor_parcela: "",
    parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", administradora: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Inadimplente | null>(null);

  const ADMINISTRADORAS = ["MAGALU", "ADEMICON", "SERVOPA"];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchData = async () => {
    if (!profile?.organizacao_id) return;
    try {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("inadimplentes")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id);
      
      if (error) throw error;
      setData(rows || []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (profile?.organizacao_id) fetchData(); 
  }, [profile?.organizacao_id]);

  const getColumnItems = (colId: string) => {
    return data.filter((d) => {
      const matchesStatus = d.status === colId;
      const matchesAdmin = administradoraFilter === "todos" || d.administradora === administradoraFilter;
      const matchesSearch = (d.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.grupo || "").includes(searchTerm);
      return matchesStatus && matchesAdmin && matchesSearch;
    });
  };

  const onDragEnd = async (result: DropResult) => {
    // Perform optimistic the change
    await handleKanbanDragEnd(result, data, setData, "inadimplentes", "🎉 Cliente regularizado!");
  };

  const handleSave = async () => {
    if (!profile?.organizacao_id) return;
    setSaving(true);
    const payload: any = {
      nome: formatToUpper(form.nome),
      celular: form.celular,
      tipo_consorcio: form.tipo_consorcio,
      valor_parcela: Number(form.valor_parcela) || 0,
      parcelas_pagas: Number(form.parcelas_pagas) || 0,
      parcelas_atrasadas: Number(form.parcelas_atrasadas) || 0,
      grupo: formatToFourDigits(form.grupo),
      cota: formatToFourDigits(form.cota),
      administradora: formatToUpper(form.administradora) || null,
      status: editingItem ? editingItem.status : "em_atraso",
      organizacao_id: profile.organizacao_id
    };

    try {
      const { error } = editingItem 
        ? await supabase.from("inadimplentes").update(payload).eq("id", editingItem.id)
        : await supabase.from("inadimplentes").insert([payload]);

      if (error) throw error;
      
      toast.success(editingItem ? "Atualizado!" : "Adicionado!");
      setShowAdd(false);
      setEditingItem(null);
      fetchData();
    } catch (e) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Excluir este registro?")) return;
    const { error } = await supabase.from("inadimplentes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído!");
    fetchData();
  };

  const handleGenerateReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório de inadimplentes ativos", 20, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 30);

      let y = 45;
      const debtors = data.filter(d => d.status !== 'regularizado');
      
      debtors.forEach((d, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${i + 1}. ${d.nome} - G/C: ${d.grupo}/${d.cota} - ${d.parcelas_atrasadas} parcs (${formatCurrency(d.valor_parcela)})`, 20, y);
        y += 7;
      });

      doc.save(`inadimplentes_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    }
  };

  const totalEmAtraso = data.filter(d => d.status !== "regularizado").length;
  const vlrAtraso = data.filter(d => d.status !== "regularizado").reduce((s, i) => s + (i.valor_parcela * i.parcelas_atrasadas), 0);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Sincronizando base de cobrança...</div>;

  return (
    <div className="space-y-6">
      {/* Dynamic Header Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative overflow-hidden p-6 rounded-[32px] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl">
          <TrendingUp className="absolute -bottom-6 -right-6 h-40 w-40 opacity-5 rotate-12" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-black text-white">Régua de Cobrança</h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[4px] mt-1">Status da Operação</p>
              </div>
              <Button size="sm" onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[10px] tracking-widest rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> Novo Contato
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Atraso</p>
                <p className="text-xl font-black text-white">{totalEmAtraso}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Montante Ativo</p>
                <p className="text-xl font-black text-rose-500">{formatCurrency(vlrAtraso)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Recuperação</p>
                <p className="text-xl font-black text-emerald-500">{data.length > 0 ? Math.round((data.filter(d => d.status === 'regularizado').length / data.length) * 100) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-4 grid grid-cols-2 gap-4">
           <button onClick={() => setShowCopy(true)} className="flex flex-col items-center justify-center gap-3 p-4 rounded-[32px] bg-emerald-50 border border-emerald-100 text-emerald-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/10 group">
              <WhatsAppIcon className="h-8 w-8 group-hover:animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
           </button>
           <button onClick={handleGenerateReport} className="flex flex-col items-center justify-center gap-3 p-4 rounded-[32px] bg-blue-50 border border-blue-100 text-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/10 group">
              <FileText className="h-8 w-8 group-hover:scale-110" />
              <span className="text-[10px] font-black uppercase tracking-widest">Relatório</span>
           </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filtro rápido: nome, grupo ou cota..." 
            className="pl-10 h-12 bg-white border-slate-100 rounded-xl font-medium" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={administradoraFilter} onValueChange={setAdministradoraFilter} className="shrink-0 w-full lg:w-auto">
          <TabsList className="h-12 bg-white border border-slate-100 p-1 rounded-xl w-full">
            <TabsTrigger value="todos" className="text-[10px] font-black uppercase tracking-tighter px-4">Todos</TabsTrigger>
            {ADMINISTRADORAS.map(admin => (
              <TabsTrigger key={admin} value={admin} className="text-[10px] font-black uppercase tracking-tighter px-4">{admin}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Advanced Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 no-scrollbar min-h-[600px]">
          {COLUMNS.map((col, i) => {
            if (isMobile && i !== mobileColIdx) return null;
            const items = getColumnItems(col.id);
            
            return (
              <div key={col.id} className={`${isMobile ? "w-full" : "min-w-[300px] w-[300px]"} flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                {/* Mobile Column Nav */}
                <div className="md:hidden flex items-center justify-between gap-4 mb-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                   <Button variant="ghost" size="icon" onClick={() => setMobileColIdx(m => Math.max(0, m - 1))} disabled={mobileColIdx===0}><ChevronLeft/></Button>
                   <div className="flex flex-col items-center">
                      <span className={`h-2 w-10 rounded-full mb-1 bg-gradient-to-r ${col.color}`} />
                      <span className="font-black text-[10px] uppercase text-slate-900 tracking-widest">{col.label} ({items.length})</span>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setMobileColIdx(m => Math.min(COLUMNS.length-1, m + 1))} disabled={mobileColIdx===COLUMNS.length-1}><ChevronRight/></Button>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex flex-col mb-4 px-2">
                   <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                         <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                         <span className="font-black text-[11px] uppercase tracking-[2px] text-slate-500">{col.label}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-full">{items.length}</span>
                   </div>
                   <div className={`h-1.5 w-full rounded-full bg-slate-100 overflow-hidden`}>
                      <div className={`h-full bg-gradient-to-r ${col.color}`} style={{ width: `${Math.min(100, (items.length/data.length)*100)}%` }} />
                   </div>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-[32px] bg-slate-100/30 border-2 border-dashed border-slate-200/50 p-2 transition-all min-h-[500px] ${snapshot.isDraggingOver ? "bg-slate-100 border-primary/20 scale-100" : ""}`}
                    >
                      <div className="space-y-3">
                        {items.map((item, idx) => (
                          <Draggable draggableId={item.id} index={idx} key={item.id}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                onClick={() => handleEdit(item)}
                                className={`relative group bg-white rounded-3xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1 ${snap.isDragging ? "shadow-2xl ring-2 ring-primary/20 rotate-2" : ""}`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                   <div className="flex-1 min-w-0">
                                      <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tighter">{formatToUpper(item.nome)}</h4>
                                      <div className="flex items-center gap-1.5 mt-1">
                                         <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">Grupo {formatToFourDigits(item.grupo)}</span>
                                         <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">{formatToUpper(item.administradora)}</span>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if (item.celular) {
                                            const num = item.celular.replace(/\D/g, '');
                                            window.open(`https://wa.me/55${num}`, '_blank');
                                          } else {
                                            toast.error('Número de celular não informado');
                                          }
                                        }}
                                        className="p-2 text-emerald-500 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors"
                                        title="Chamar no WhatsApp"
                                     >
                                        <WhatsAppIcon className="h-4 w-4" />
                                     </button>
                                     <button 
                                        onClick={(e) => handleDelete(item.id, e)}
                                        className="p-2 text-rose-400 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors"
                                        title="Excluir devedor"
                                     >
                                        <Trash2 className="h-4 w-4" />
                                     </button>
                                   </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                                   <div className="flex flex-col">
                                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Parcela</p>
                                      <p className="font-black text-slate-900 mt-1">{formatCurrency(item.valor_parcela)}</p>
                                   </div>
                                   <div className={`p-2 rounded-xl bg-red-50 text-red-600 flex items-center gap-1.5 ${item.status === 'regularizado' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                                      <ShieldAlert className="h-3 w-3" />
                                      <span className="text-[10px] font-black">{item.parcelas_atrasadas}x</span>
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
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modern Dialogs (Already maintained but visually polished) */}
      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) setEditingItem(null); }}>
        {/* ... Dialog content remains clean and operational ... */}
        <DialogContent className="max-w-2xl bg-white rounded-[32px] border-none p-8">
           <DialogHeader><DialogTitle className="text-2xl font-black">{editingItem ? "Editar Devedor" : "Novo Inadimplente"}</DialogTitle></DialogHeader>
           <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="col-span-2 space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</Label>
                 <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Celular</Label>
                 <Input value={form.celular} onChange={e => setForm({...form, celular: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Status Base</Label>
                 <Select value={form.administradora || "none"} onValueChange={v => setForm({...form, administradora: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl">
                      <SelectValue placeholder="Administradora" />
                    </SelectTrigger>
                    <SelectContent>{ADMINISTRADORAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                 </Select>
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Parcelas Atrasadas</Label>
                 <Input type="number" value={form.parcelas_atrasadas} onChange={e => setForm({...form, parcelas_atrasadas: e.target.value})} className="h-12 bg-red-50 border-none rounded-xl text-red-600 font-bold" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Valor Parcela</Label>
                 <Input type="number" value={form.valor_parcela} onChange={e => setForm({...form, valor_parcela: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Grupo</Label>
                 <Input value={form.grupo} onChange={e => setForm({...form, grupo: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cota</Label>
                 <Input value={form.cota} onChange={e => setForm({...form, cota: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
           </div>
           <div className="flex gap-2 mt-8">
              <Button variant="ghost" onClick={() => setShowAdd(false)} className="h-12 flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="h-12 flex-2 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest">
                 {saving ? "Processando..." : (editingItem ? "Salvar Alterações" : "Adicionar Registro")}
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCopy} onOpenChange={setShowCopy}>
        <DialogContent className="max-w-xl bg-white rounded-[32px] border-none p-8">
           <DialogHeader><DialogTitle className="text-2xl font-black">Régua de WhatsApp</DialogTitle></DialogHeader>
           <div className="space-y-4 mt-6">
              <Textarea rows={6} value={copyTemplate} onChange={e => setCopyTemplate(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm" />
              <button onClick={() => {
                const msgs = data.filter(d => d.status !== 'regularizado').map(d => {
                  let msg = copyTemplate;
                  msg = msg.replace(/{nome}/g, d.nome || "");
                  msg = msg.replace(/{cota}/g, d.cota || "");
                  msg = msg.replace(/{grupo}/g, d.grupo || "");
                  msg = msg.replace(/{parcelas_atrasadas}/g, String(d.parcelas_atrasadas || 0));
                  msg = msg.replace(/{valor_parcela}/g, formatCurrency(d.valor_parcela || 0));
                  return msg;
                }).join('\n\n---\n\n');
                navigator.clipboard.writeText(msgs);
                toast.success('Mensagens copiadas!');
              }} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-[4px] shadow-lg shadow-emerald-500/20 rounded-2xl">Copiar Lista Completa</button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
