import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, Filter, Mail, Phone, MapPin, Calendar, Clock, ChevronRight, User, DollarSign, MessageCircle, MoreHorizontal, UserCheck, UserPlus, ShieldCheck, HeartPulse, Zap, Download, ArrowUpDown, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { jsPDF } from "jspdf";
import { formatCurrency, formatLeadValue } from "@/lib/utils";
import { LeadForm, LeadFormData, STATUS_OPTIONS, TIPO_OPTIONS, TEMPERATURA_OPTIONS, SCORE_OPTIONS } from "@/components/admin/LeadForm";
import { zapiService } from "@/services/zapi";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";

interface Lead {
  id: string;
  nome: string;
  email: string | null;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: number;
  prazo_meses: number;
  status: string | null;
  created_at: string | null;
  lead_score_valor: string | null;
  lead_temperatura: string | null;
  responsavel_id?: string | null;
  administradora?: string | null;
  indicador_nome?: string;
  indicador_celular?: string;
}

interface Membro {
  id: string;
  nome_completo: string;
}

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

const FILTER_STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  ...STATUS_OPTIONS
];

const FILTER_TIPO_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  ...TIPO_OPTIONS
];

const openWhatsApp = (lead: Lead) => {
  const msg = encodeURIComponent(
    `Olá, bom dia! Aqui é o Fabricio. Vi sua empresa e pensei em uma forma de gerar mais oportunidades com planejamento financeiro… posso te explicar rapidinho?`
  );
  const phone = lead.celular.replace(/\D/g, "");
  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
};

const EMPTY_LEAD_FORM: LeadFormData = {
  nome: "", email: "", celular: "", cidade: "", tipo_consorcio: "imovel",
  valor_credito: "", prazo_meses: "120", status: "novo_lead",
  lead_temperatura: "quente", lead_score_valor: "medio",
  administradora: "none",
  indicador_nome: "",
  indicador_celular: "",
};

export default function Leads() {
  const { profile, isManager } = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [cidadeFilter, setCidadeFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof Lead>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [administradoraFilter, setAdministradoraFilter] = useState("todos");
  const ADMINISTRADORAS = ["MAGALU", "ADEMICON", "SERVOPA"];

  // New Lead dialog
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLead, setNewLead] = useState(EMPTY_LEAD_FORM);

  // Edit Lead dialog
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_LEAD_FORM);
  const [isAiGenerating, setIsAiGenerating] = useState<string | null>(null);

  // Delete confirmation
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!profile?.organizacao_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("leads")
      .select("*")
      .eq("organizacao_id", profile.organizacao_id)
      .order("created_at", { ascending: false });
      const fetchedLeads = ((data as Lead[]) ?? []).map(l => ({
        ...l,
        nome: l.nome || "Lead Sem Nome"
      }));
      setLeads(fetchedLeads);
      setLoading(false);
  }, [profile?.organizacao_id]);

  useEffect(() => {
    if (!profile) return;
    fetchLeads();
    if (isManager && profile.organizacao_id) {
      const fetchMembros = async () => {
        const { data } = await (supabase as any).from("perfis").select("id, nome_completo").eq("organizacao_id", profile.organizacao_id);
        if (data) setMembros(data as unknown as Membro[]);
      };
      fetchMembros();
    }
  }, [profile, fetchLeads, isManager]);

  const assignLead = async (leadId: string, responsavelId: string) => {
    const val = responsavelId === "none" ? null : responsavelId;
    await (supabase as any).from("leads").update({ responsavel_id: val }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, responsavel_id: val } : l));
  };

  const handleCreateLead = async (formData: LeadFormData) => {
    if (!profile) return;
    setIsSubmitting(true);
    const leadToInsert = {
      nome: formData.nome,
      email: formData.email || null,
      celular: formData.celular,
      cidade: formData.cidade,
      tipo_consorcio: formData.tipo_consorcio,
      valor_credito: Number(formData.valor_credito) || 0,
      prazo_meses: Number(formData.prazo_meses) || 120,
      status: formData.status,
      lead_temperatura: formData.lead_temperatura,
      lead_score_valor: formData.lead_score_valor,
      responsavel_id: profile.id,
      organizacao_id: profile.organizacao_id,
      administradora: formData.administradora === "none" ? null : formData.administradora,
      indicador_nome: formData.indicador_nome || null,
      indicador_celular: formData.indicador_celular || null,
    };
    const { data, error } = await supabase.from("leads").insert([leadToInsert as any]).select();
    if (!error && data && data.length > 0) {
      setLeads(prev => [data[0] as Lead, ...prev]);
      setIsNewLeadOpen(false);
    }
    setIsSubmitting(false);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm({
      nome: lead.nome || "",
      email: lead.email || "",
      celular: lead.celular || "",
      cidade: lead.cidade || "",
      tipo_consorcio: lead.tipo_consorcio || "imovel",
      valor_credito: String(lead.valor_credito || ""),
      prazo_meses: String(lead.prazo_meses || "120"),
      status: lead.status || "novo_lead",
      lead_temperatura: lead.lead_temperatura || "quente",
      lead_score_valor: lead.lead_score_valor || "medio",
      administradora: lead.administradora || "none",
      indicador_nome: lead.indicador_nome || "",
      indicador_celular: lead.indicador_celular || "",
    });
    setIsEditOpen(true);
  };

  const handleEditLead = async (formData: LeadFormData) => {
    if (!editingLead) return;
    setIsEditSubmitting(true);
    const updates = {
      nome: formData.nome,
      email: formData.email || null,
      celular: formData.celular,
      cidade: formData.cidade,
      tipo_consorcio: formData.tipo_consorcio,
      valor_credito: Number(formData.valor_credito) || 0,
      prazo_meses: Number(formData.prazo_meses) || 120,
      status: formData.status,
      lead_temperatura: formData.lead_temperatura,
      lead_score_valor: formData.lead_score_valor,
      administradora: formData.administradora === "none" ? null : formData.administradora,
      indicador_nome: formData.indicador_nome || null,
      indicador_celular: formData.indicador_celular || null,
    };
    const { error } = await supabase.from("leads").update(updates as any).eq("id", editingLead.id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...updates } : l));
      setIsEditOpen(false);
      setEditingLead(null);
    }
    setIsEditSubmitting(false);
  };

  const openDelete = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    const { error } = await supabase.from("leads").delete().eq("id", deletingLead.id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== deletingLead.id));
      setIsDeleteOpen(false);
      setDeletingLead(null);
    }
    setIsDeleting(false);
  };

  const handleAiWhatsApp = async (lead: Lead) => {
    setIsAiGenerating(lead.id);
    toast.info(`Jarvis está analisando ${lead.nome}...`);
    
    try {
      const { script, error: aiError } = await aiService.generateSalesScript({
        nome: lead.nome,
        tipo_consorcio: lead.tipo_consorcio,
        valor_credito: Number(lead.valor_credito),
        cidade: lead.cidade
      });

      if (aiError) throw aiError;

      toast.success("Script gerado com sucesso!");
      
      const { error: zapiError } = await zapiService.sendMessage({
        phone: lead.celular,
        message: script
      });

      if (zapiError) {
        // Se der erro no Z-API (ex: falta de chave), abre o WhatsApp manual com o script gerado
        toast.warning("Z-API não configurada. Abrindo manual com script do Jarvis.");
        const phone = lead.celular.replace(/\D/g, "");
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(script)}`, "_blank");
      } else {
        toast.success("Mensagem enviada via Z-API!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha na automação do Jarvis.");
    } finally {
      setIsAiGenerating(null);
    }
  };

  const toggleSort = (key: keyof Lead) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...leads];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.nome.toLowerCase().includes(s) ||
          (l.email || "").toLowerCase().includes(s) ||
          l.celular.includes(s)
      );
    }
    if (statusFilter !== "all") result = result.filter((l) => {
      const s = l.status ?? "novo_lead";
      if (statusFilter === "novo_lead" || statusFilter === "novo") {
        return s === "novo_lead" || s === "novo";
      }
      return s === statusFilter;
    });
    if (tipoFilter !== "all") result = result.filter((l) => l.tipo_consorcio === tipoFilter);
    if (administradoraFilter !== "todos") result = result.filter((l) => l.administradora === administradoraFilter);
    if (cidadeFilter) result = result.filter((l) => l.cidade?.toLowerCase().includes(cidadeFilter.toLowerCase()) ?? false);

    result.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, statusFilter, tipoFilter, cidadeFilter, sortKey, sortDir, administradoraFilter]);

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Celular", "Cidade", "Tipo", "Valor Crédito", "Prazo", "Status", "Score", "Temp", "Data"];
    const rows = filtered.map((l) => [
      l.nome, l.email, l.celular, l.cidade, l.tipo_consorcio,
      l.valor_credito, l.prazo_meses, l.status ?? "novo",
      l.lead_score_valor ?? "baixo", l.lead_temperatura ?? "quente",
      l.created_at?.slice(0, 10) ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const titleText = "Relatorio de Leads — CRM";
    const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");

    doc.setFontSize(16);
    doc.text(titleText, 10, 10);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${dateStr}`, 10, 16);
    doc.line(10, 18, 200, 18);

    let y = 25;
    doc.setFont("helvetica", "bold");
    doc.text("Nome", 10, y);
    doc.text("Celular", 80, y);
    doc.text("Valor", 120, y);
    doc.text("Status", 155, y);
    doc.text("Data", 185, y);
    doc.line(10, y + 2, 200, y + 2);
    y += 8;

    doc.setFont("helvetica", "normal");
    filtered.forEach((l) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(l.nome.substring(0, 35), 10, y);
      doc.text(l.celular || "—", 80, y);
      doc.text(formatLeadValue(Number(l.valor_credito || 0)), 120, y);
      doc.text((l.status || "Novo").replace("_", " "), 155, y);
      doc.text(l.created_at?.slice(0, 10) || "—", 185, y);
      y += 6;
    });

    doc.save(`relatorio-leads-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const SortHeader = ({ label, field }: { label: string; field: keyof Lead }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  );


  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const leadsPremium = leads.filter(l => l.lead_score_valor === 'premium').length;
  const leadsEsteMes = leads.filter(l => l.created_at?.startsWith(format(new Date(), "yyyy-MM"))).length;
  const totalCredito = leads.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Gamified Leads Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AdminHeroCard 
            title="Base de Leads" 
            subtitle="Inteligência de Mercado & Prospecção"
            icon={Users} 
            bgIcon={Users}
            accentColor="primary"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  Gestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Estratégica</span> de Leads
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                  Sua base de dados organizada para conversão. Utilize os filtros avançados e o Jarvis para automatizar seu primeiro contato.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total em Carteira</p>
                  <p className="text-lg font-black text-blue-600">{formatLeadValue(totalCredito)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Registrados</p>
                  <p className="text-lg font-black text-slate-900">{leads.length}</p>
                </div>
              </div>
            </div>
          </AdminHeroCard>
        </div>

        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          <div className="relative group overflow-hidden p-4 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-default">
             <div className="flex items-center gap-2 opacity-90 mb-2">
                <span className="p-1.5 bg-white/20 rounded-lg"><Sparkles className="h-4 w-4" /></span>
                <p className="text-[10px] font-black uppercase tracking-widest">Performance Mensal</p>
             </div>
             <p className="text-3xl font-black">+{leadsEsteMes}</p>
             <p className="text-[10px] bg-white/20 w-fit px-2 py-0.5 rounded-full font-bold mt-2">Novos Leads este Mês</p>
             <TrendingUp className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center justify-between w-full md:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leads</h1>
          <div className="flex md:hidden items-center gap-2">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handleGenerateReport} 
                className="h-9 w-9 border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
                title="Relatório PDF"
              >
              <FileText className="h-4 w-4" />
            </Button>
            <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="h-9 w-9" title="Novo Lead">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Lead</DialogTitle>
                </DialogHeader>
                <LeadForm 
                  initialData={EMPTY_LEAD_FORM}
                  onSubmit={handleCreateLead}
                  onCancel={() => setIsNewLeadOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateReport} 
            className="border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatório PDF
          </Button>

          <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Lead</DialogTitle>
              </DialogHeader>
              <LeadForm 
                initialData={EMPTY_LEAD_FORM}
                onSubmit={handleCreateLead}
                onCancel={() => setIsNewLeadOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>

          <Button onClick={exportCSV} variant="outline" size="icon" className="h-9 w-9" title="Exportar CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-muted/30 p-1 rounded-lg border border-border/50 overflow-x-auto no-scrollbar">
        <Tabs value={administradoraFilter} onValueChange={setAdministradoraFilter} className="w-full">
          <TabsList className="flex w-full sm:w-auto h-auto bg-transparent border-none">
            <TabsTrigger value="todos" className="text-[10px] sm:text-xs py-2 px-4 whitespace-nowrap">Todas</TabsTrigger>
            {ADMINISTRADORAS.map(admin => (
              <TabsTrigger key={admin} value={admin} className="text-[10px] sm:text-xs py-2 px-4 whitespace-nowrap">{admin}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Input
          placeholder="Buscar nome, email, telefone..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTER_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTER_TIPO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filtrar cidade..."
          value={cidadeFilter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCidadeFilter(e.target.value)}
        />
      </div>

      {/* Lead List */}
      <div className="rounded-lg border border-border bg-card">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <SortHeader label="Nome" field="nome" />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Ações</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Celular</th>
                <SortHeader label="Cidade" field="cidade" />
                <SortHeader label="Valor" field="valor_credito" />
                <SortHeader label="Score" field="lead_score_valor" />
                <SortHeader label="Temp" field="lead_temperatura" />
                <SortHeader label="Admin" field="administradora" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Data" field="created_at" />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Indicador</th>
                {isManager && <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Responsável</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground">
                <td className="px-3 py-1">{filtered.length} leads</td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1">{formatLeadValue(filtered.reduce((s, l) => s + Number(l.valor_credito || 0), 0))}</td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                <td className="px-3 py-1"></td>
                {isManager && <td className="px-3 py-1"></td>}
              </tr>
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium">{l.nome}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {/* WhatsApp */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="WhatsApp Manual"
                        onClick={() => openWhatsApp(l)}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                      {/* Jarvis Auto WhatsApp */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Atendimento Automático Jarvis"
                        onClick={() => handleAiWhatsApp(l)}
                        disabled={isAiGenerating === l.id}
                      >
                        {isAiGenerating === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      </Button>
                      {/* Editar */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Editar lead"
                        onClick={() => openEdit(l)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Excluir */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir lead"
                        onClick={() => openDelete(l)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2">{l.celular}</td>
                  <td className="px-3 py-2">{l.cidade || "N/Inf"}</td>
                  <td className="px-3 py-2 font-medium">{formatLeadValue(Number(l.valor_credito))}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] font-bold uppercase">{SCORE_LABELS[l.lead_score_valor || "baixo"] || "🧊 Lead Baixo"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] font-bold uppercase">{TEMP_EMOJIS[l.lead_temperatura || "quente"] || "🔥"}</span>
                  </td>
                  <td className="px-3 py-2">
                    {l.administradora && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase">
                        {l.administradora}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary capitalize">
                      {(l.status ?? "novo").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{l.created_at?.slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    {l.indicador_nome ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{l.indicador_nome}</span>
                        <span className="text-[10px] text-muted-foreground">{l.indicador_celular}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  {isManager && (
                    <td className="px-3 py-2">
                      <Select
                        value={l.responsavel_id || "none"}
                        onValueChange={(val: string) => assignLead(l.id, val)}
                      >
                        <SelectTrigger className="h-7 text-xs w-36 rounded-lg">
                          <SelectValue placeholder="Sem responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem responsável</SelectItem>
                          {membros.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {filtered.map((l) => (
            <div key={l.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{l.nome}</h3>
                  <p className="text-xs text-muted-foreground">{l.cidade}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize shrink-0">
                  {(l.status ?? "novo").replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Score / Temp</p>
                  <p className="font-bold text-[10px] mt-1">
                    {SCORE_LABELS[l.lead_score_valor || "baixo"] || "🧊 Lead Baixo"} <br />
                    {TEMP_EMOJIS[l.lead_temperatura || "quente"] || "🔥"} {l.lead_temperatura === 'quente' ? 'Quente' : l.lead_temperatura === 'morno' ? 'Morno' : l.lead_temperatura === 'frio' ? 'Frio' : 'Morto'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Valor</p>
                  <p className="font-bold text-primary">{formatLeadValue(Number(l.valor_credito))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Celular</p>
                  <p className="font-medium">{l.celular}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Tipo / Prazo</p>
                  <p className="capitalize font-medium">{l.tipo_consorcio} · {l.prazo_meses}m</p>
                </div>
                {l.administradora && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-black">Admin</p>
                    <p className="font-bold text-blue-600 uppercase text-[10px]">{l.administradora}</p>
                  </div>
                )}
                {l.indicador_nome && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground uppercase font-black">Indicador</p>
                    <p className="text-sm font-medium">{l.indicador_nome} ({l.indicador_celular})</p>
                  </div>
                )}
              </div>

              {isManager && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-black">Responsável</p>
                  <Select
                    value={l.responsavel_id || "none"}
                    onValueChange={(val: string) => assignLead(l.id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs w-full rounded-lg">
                      <SelectValue placeholder="Sem responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem responsável</SelectItem>
                      {membros.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mobile action buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50 h-9 w-9"
                  title="WhatsApp Manual"
                  onClick={() => openWhatsApp(l)}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 h-9 w-9"
                  title="Jarvis Auto"
                  onClick={() => handleAiWhatsApp(l)}
                  disabled={isAiGenerating === l.id}
                >
                  {isAiGenerating === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-9 w-9"
                  title="Editar"
                  onClick={() => openEdit(l)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 h-9 w-9"
                  title="Excluir"
                  onClick={() => openDelete(l)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">Nenhum lead encontrado.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} leads encontrados</p>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          <LeadForm 
            initialData={editForm}
            onSubmit={handleEditLead}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={isEditSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o lead <strong className="text-foreground">{deletingLead?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteLead}
            >
              {isDeleting ? "Excluindo..." : "Excluir Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
